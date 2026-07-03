import { NextResponse, type NextRequest } from "next/server";
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { createClient } from "@/lib/supabase/server";
import { BRAND_NAME } from "@/lib/config";

export const dynamic = "force-dynamic";

type ExportComment = {
  id: string;
  parent_id: string | null;
  route: string;
  author_name: string;
  body: string;
  resolved: boolean;
  created_at: string;
};

function groupThreads(comments: ExportComment[]) {
  const pins = comments.filter((c) => !c.parent_id);
  const byRoute = new Map<string, ExportComment[]>();
  for (const pin of pins) {
    byRoute.set(pin.route, [...(byRoute.get(pin.route) ?? []), pin]);
  }
  const repliesFor = (id: string) =>
    comments.filter((c) => c.parent_id === id);
  return { byRoute, repliesFor };
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function toMarkdown(name: string, comments: ExportComment[]): string {
  const { byRoute, repliesFor } = groupThreads(comments);
  const lines: string[] = [
    `# Feedback — ${name}`,
    "",
    `Exported ${fmtDate(new Date().toISOString())} · ${byRoute.size} route(s), ${
      comments.filter((c) => !c.parent_id).length
    } thread(s)`,
    "",
  ];

  for (const [route, pins] of byRoute) {
    lines.push(`## \`${route}\``, "");
    pins.forEach((pin, i) => {
      const status = pin.resolved ? " · ✅ resolved" : "";
      lines.push(
        `### ${i + 1}. ${pin.author_name} — ${fmtDate(pin.created_at)}${status}`,
        "",
        `> ${pin.body.replace(/\n/g, "\n> ")}`,
        ""
      );
      for (const reply of repliesFor(pin.id)) {
        lines.push(
          `- **${reply.author_name}** (${fmtDate(reply.created_at)}): ${reply.body.replace(/\n/g, " ")}`
        );
      }
      if (repliesFor(pin.id).length) lines.push("");
    });
  }

  lines.push("---", `Exported from ${BRAND_NAME}`);
  return lines.join("\n");
}

function toDocx(name: string, comments: ExportComment[]): Document {
  const { byRoute, repliesFor } = groupThreads(comments);
  const children: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun(`Feedback — ${name}`)],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Exported ${fmtDate(new Date().toISOString())}`,
          color: "888888",
          size: 20,
        }),
      ],
    }),
  ];

  for (const [route, pins] of byRoute) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300 },
        children: [new TextRun(route)],
      })
    );
    pins.forEach((pin, i) => {
      children.push(
        new Paragraph({
          spacing: { before: 200 },
          children: [
            new TextRun({ text: `${i + 1}. ${pin.author_name}`, bold: true }),
            new TextRun({
              text: `  ${fmtDate(pin.created_at)}${pin.resolved ? "  (resolved)" : ""}`,
              color: "888888",
              size: 18,
            }),
          ],
        }),
        new Paragraph({
          indent: { left: 360 },
          children: [new TextRun(pin.body)],
        })
      );
      for (const reply of repliesFor(pin.id)) {
        children.push(
          new Paragraph({
            indent: { left: 720 },
            spacing: { before: 80 },
            children: [
              new TextRun({ text: `${reply.author_name}: `, bold: true }),
              new TextRun(reply.body),
              new TextRun({
                text: `  ${fmtDate(reply.created_at)}`,
                color: "888888",
                size: 16,
              }),
            ],
          })
        );
      }
    });
  }

  return new Document({ sections: [{ children }] });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // RLS scopes both queries to the owner's own projects
  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", params.id)
    .single();
  if (!project)
    return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { data: comments } = await supabase
    .from("comments")
    .select("id, parent_id, route, author_name, body, resolved, created_at")
    .eq("project_id", project.id)
    .order("created_at", { ascending: true });

  const format = new URL(req.url).searchParams.get("format") ?? "md";
  const safeName = project.name.replace(/[^\w-]+/g, "-").toLowerCase();

  if (format === "docx") {
    const buffer = await Packer.toBuffer(toDocx(project.name, comments ?? []));
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="feedback-${safeName}.docx"`,
      },
    });
  }

  return new NextResponse(toMarkdown(project.name, comments ?? []), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="feedback-${safeName}.md"`,
    },
  });
}
