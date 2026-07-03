import { expect, test, type Page } from "@playwright/test";

const KEY = "pk_live_e2e0000000000000000000";

interface FakeComment {
  id: string;
  parent_id: string | null;
  route: string;
  anchor: unknown;
  author_name: string;
  body: string;
  resolved: boolean;
  created_at: string;
}

/**
 * In-memory API fake. The store outlives page reloads (it lives in the test,
 * not the page), so persistence-across-reload is genuinely exercised.
 */
async function mockApi(page: Page, store: FakeComment[]) {
  await page.route("**/api/v1/comments**", async (route) => {
    const req = route.request();
    if (req.method() === "GET") {
      const counts: Record<string, number> = {};
      for (const c of store) {
        if (!c.parent_id && !c.resolved)
          counts[c.route] = (counts[c.route] ?? 0) + 1;
      }
      return route.fulfill({ json: { comments: store, counts } });
    }
    if (req.method() === "POST") {
      const body = req.postDataJSON() as Record<string, unknown>;
      const created: FakeComment = {
        id: crypto.randomUUID(),
        parent_id: (body.parent_id as string) ?? null,
        route: body.route as string,
        anchor: body.anchor ?? null,
        author_name: body.author_name as string,
        body: body.body as string,
        resolved: false,
        created_at: new Date().toISOString(),
      };
      store.push(created);
      return route.fulfill({ status: 201, json: { comment: created } });
    }
    return route.fulfill({ status: 405, json: { error: "method" } });
  });
}

const pinCount = (page: Page) =>
  page.evaluate(
    () => (window as unknown as { __pinmark?: { pins?: number } }).__pinmark?.pins
  );

const widgetMounted = (page: Page) =>
  page.waitForFunction(
    () =>
      (window as unknown as { __pinmark?: { pins?: number } }).__pinmark
        ?.pins !== undefined
  );

/** Post a comment through the real composer using only the keyboard. */
async function postComment(page: Page, x: number, y: number, text: string) {
  await page.keyboard.press("c");
  await page.mouse.click(x, y);
  // composer autofocuses: name field on first use, textarea afterwards
  await page.keyboard.type("E2E Tester");
  await page.keyboard.press("Tab");
  await page.keyboard.type(text);
  await page.keyboard.press("Tab"); // → Cancel
  await page.keyboard.press("Tab"); // → Post
  await page.keyboard.press("Enter");
}

test("pin persists across reload (acceptance criterion)", async ({ page }) => {
  const store: FakeComment[] = [];
  await mockApi(page, store);

  await page.goto(`/test.html?key=${KEY}`);
  await widgetMounted(page);
  expect(await pinCount(page)).toBe(0);

  const postRequest = page.waitForRequest(
    (r) => r.method() === "POST" && r.url().includes("/api/v1/comments")
  );
  await postComment(page, 400, 300, "pin me down");
  await postRequest;
  await page.waitForFunction(
    () => (window as unknown as { __pinmark?: { pins?: number } }).__pinmark?.pins === 1
  );

  // the store survives reload; the widget must re-render the pin from it
  await page.reload();
  await widgetMounted(page);
  await page.waitForFunction(
    () => (window as unknown as { __pinmark?: { pins?: number } }).__pinmark?.pins === 1
  );
});

test("comment body is stored as inert text (XSS criterion)", async ({ page }) => {
  const store: FakeComment[] = [];
  await mockApi(page, store);

  await page.goto(`/test.html?key=${KEY}`);
  await widgetMounted(page);

  let alerted = false;
  page.on("dialog", async (d) => {
    alerted = true;
    await d.dismiss();
  });

  await postComment(page, 500, 400, `<img src=x onerror="alert(1)">`);
  await page.waitForFunction(
    () => (window as unknown as { __pinmark?: { pins?: number } }).__pinmark?.pins === 1
  );

  // reload renders the stored payload; textContent rendering keeps it inert
  await page.reload();
  await widgetMounted(page);
  await page.waitForTimeout(500);
  expect(alerted).toBe(false);
  expect(store[0].body).toContain("<img");
});

test("widget mounts and works on a hostile-CSS page (isolation criterion)", async ({
  page,
}) => {
  const store: FakeComment[] = [];
  await mockApi(page, store);

  await page.goto(`/hostile.html?key=${KEY}`);
  await widgetMounted(page);

  // the host element must exist and keep its defensive inline styling
  const hostStyle = await page.evaluate(() => {
    const host = document.querySelector("pinmark-root") as HTMLElement | null;
    return host ? host.style.position : null;
  });
  expect(hostStyle).toBe("fixed");

  // and commenting still functions amid the CSS carnage
  await postComment(page, 300, 200, "still alive");
  await page.waitForFunction(
    () => (window as unknown as { __pinmark?: { pins?: number } }).__pinmark?.pins === 1
  );
});

test("widget stays dormant without a key", async ({ page }) => {
  await page.goto("/test.html"); // no ?key= → loader never injects
  await page.waitForTimeout(1000);
  const state = await page.evaluate(
    () => (window as unknown as { __pinmark?: unknown }).__pinmark
  );
  expect(state).toBeUndefined();
});
