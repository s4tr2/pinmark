export interface RegionRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Anchor {
  route: string;
  selector: string | null;
  selector_confidence: "high" | "medium" | "low" | "none";
  offset_pct: { x: number; y: number } | null;
  page_pct: { x: number; y: number };
  viewport: { w: number; h: number };
  // Region comments (Figma-style area selection). The point fields above
  // describe the region's top-left corner; these describe its extent,
  // element-relative when the selector resolves, page-relative as fallback.
  region_offset_pct?: RegionRect | null;
  region_page_pct?: RegionRect | null;
}

export interface Comment {
  id: string;
  parent_id: string | null;
  route: string;
  anchor: Anchor | null;
  author_name: string;
  body: string;
  resolved: boolean;
  created_at: string;
}

export interface CommentsResponse {
  comments: Comment[];
  counts: Record<string, number>;
}

export class Api {
  constructor(
    private base: string,
    private key: string,
    private token: string | null
  ) {}

  async fetchComments(route: string): Promise<CommentsResponse> {
    const url = new URL("/api/v1/comments", this.base);
    url.searchParams.set("key", this.key);
    url.searchParams.set("route", route);
    if (this.token) url.searchParams.set("token", this.token);
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) {
      let code = `fetch_failed_${res.status}`;
      try {
        code = (await res.json()).error ?? code;
      } catch {
        /* keep status code */
      }
      throw new Error(code);
    }
    return res.json();
  }

  async postComment(input: {
    route: string;
    anchor: Anchor | null;
    parent_id: string | null;
    author_name: string;
    author_token: string;
    body: string;
  }): Promise<Comment> {
    const res = await fetch(new URL("/api/v1/comments", this.base), {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: this.key, token: this.token, ...input }),
    });
    if (!res.ok) {
      let code = `post_failed_${res.status}`;
      try {
        code = (await res.json()).error ?? code;
      } catch {
        /* keep status code */
      }
      throw new Error(code);
    }
    return (await res.json()).comment;
  }

  async editComment(id: string, authorToken: string, body: string): Promise<void> {
    await this.mutateOwn("PATCH", id, { author_token: authorToken, body });
  }

  async deleteComment(id: string, authorToken: string): Promise<void> {
    await this.mutateOwn("DELETE", id, { author_token: authorToken });
  }

  private async mutateOwn(
    method: "PATCH" | "DELETE",
    id: string,
    extra: Record<string, string>
  ): Promise<void> {
    const res = await fetch(new URL(`/api/v1/comments/${id}`, this.base), {
      method,
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: this.key, token: this.token, ...extra }),
    });
    if (!res.ok) {
      let code = `mutate_failed_${res.status}`;
      try {
        code = (await res.json()).error ?? code;
      } catch {
        /* keep status code */
      }
      throw new Error(code);
    }
  }
}
