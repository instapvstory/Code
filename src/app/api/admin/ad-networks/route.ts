import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { validateSession } from "@/lib/cms";

const PUBLIC_DIR = path.join(process.cwd(), "public");

// Supported TXT file types
const ALLOWED_FILES: Record<string, { desc: string; example: string }> = {
  "ads.txt": {
    desc: "IAB ads.txt - authorizes digital ad sellers for your domain",
    example: "google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0",
  },
  "app-ads.txt": {
    desc: "IAB app-ads.txt - same as ads.txt but for mobile apps",
    example: "google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0",
  },
  "sellers.json": {
    desc: "IAB sellers.json - transparency file for your publisher identity",
    example: '{"contact_email":"admin@pvstoryviewer.com","sellers":[]}',
  },
};

// Helper: auth check
async function checkAuth(request: NextRequest) {
  const token =
    request.cookies.get("admin_token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  return await validateSession(token);
}

// GET - read file contents + list all ad network files
export async function GET(request: NextRequest) {
  const user = await checkAuth(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const file = searchParams.get("file");

  if (file) {
    // Read specific file
    if (!ALLOWED_FILES[file]) {
      return NextResponse.json({ error: "Invalid file" }, { status: 400 });
    }
    try {
      const content = await fs.readFile(path.join(PUBLIC_DIR, file), "utf-8");
      return NextResponse.json({ success: true, file, content });
    } catch {
      return NextResponse.json({ success: true, file, content: "" });
    }
  }

  // List all files with their status
  const fileStatuses = await Promise.all(
    Object.entries(ALLOWED_FILES).map(async ([name, meta]) => {
      let content = "";
      let exists = false;
      let lineCount = 0;
      try {
        content = await fs.readFile(path.join(PUBLIC_DIR, name), "utf-8");
        exists = true;
        lineCount = content.split("\n").filter((l) => l.trim() && !l.startsWith("#")).length;
      } catch {}
      return { name, ...meta, exists, lineCount, content };
    })
  );

  return NextResponse.json({ success: true, files: fileStatuses });
}

// POST - save/update a file
export async function POST(request: NextRequest) {
  const user = await checkAuth(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { file, content } = body;

  if (!file || !ALLOWED_FILES[file]) {
    return NextResponse.json({ error: "Invalid file name" }, { status: 400 });
  }

  if (typeof content !== "string") {
    return NextResponse.json({ error: "Invalid content" }, { status: 400 });
  }

  // Basic validation for ads.txt format
  if (file === "ads.txt" || file === "app-ads.txt") {
    const lines = content.split("\n").filter((l) => l.trim() && !l.startsWith("#"));
    for (const line of lines) {
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length < 3) {
        return NextResponse.json({
          error: `Invalid line format: "${line}". Expected: domain, publisher-id, DIRECT|RESELLER`,
        }, { status: 400 });
      }
    }
  }

  await fs.writeFile(path.join(PUBLIC_DIR, file), content.trim() + "\n", "utf-8");

  return NextResponse.json({
    success: true,
    message: `${file} saved successfully`,
    lineCount: content.split("\n").filter((l) => l.trim() && !l.startsWith("#")).length,
  });
}

// DELETE - clear/delete a file
export async function DELETE(request: NextRequest) {
  const user = await checkAuth(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const file = searchParams.get("file");

  if (!file || !ALLOWED_FILES[file]) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  }

  try {
    await fs.unlink(path.join(PUBLIC_DIR, file));
  } catch {}

  return NextResponse.json({ success: true, message: `${file} deleted` });
}
