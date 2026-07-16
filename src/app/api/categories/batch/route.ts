import { NextResponse } from "next/server";
import { requireAdminMode } from "@/lib/admin";
import { updateDocumentCategories } from "@/lib/documents";
import type { DocumentCategory } from "@/lib/document-categories";

export async function POST(request: Request) {
  try {
    requireAdminMode(request);
    const body = (await request.json()) as {
      changes?: { slug?: string; category?: string }[];
    };

    if (!Array.isArray(body.changes) || body.changes.length === 0) {
      return NextResponse.json({ error: "changes is required" }, { status: 400 });
    }

    const changes = body.changes.map((change) => {
      if (!change.slug || !change.category) {
        throw new Error("each change requires slug and category");
      }
      return { slug: change.slug, category: change.category as DocumentCategory };
    });

    const result = await updateDocumentCategories(changes);
    return NextResponse.json({ changes: result });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "failed to update categories",
      },
      { status: 500 },
    );
  }
}
