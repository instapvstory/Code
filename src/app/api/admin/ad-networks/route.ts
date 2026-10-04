import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { validateSession } from "@/lib/cms";
import { supabaseAdmin } from "@/lib/supabase-admin";

const PUBLIC_DIR = path.join(process.cwd(), "public");

// Default standard files with descriptions
const DEFAULT_FILES: Record<string, { desc: string; example: string }> = {
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

// Validate that filename is a safe .txt or .json file without directory traversal
function isValidFileName(name: string): boolean {
  if (!name || typeof name !== "string") return false;
  if (name.includes("..") || name.includes("/") || name.includes("\\")) return false;
  return /^[a-zA-Z0-9_\-\.]+\.(txt|json)$/i.test(name.trim());
}

// Helper: auth check
async function checkAuth(request: NextRequest) {
  const token =
    request.cookies.get("admin_session")?.value ||
    request.cookies.get("admin_token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  return await validateSession(token);
}

// Helper: Get file content from Supabase DB, fallback to public file, seed DB if missing
async function getFileContent(fileName: string): Promise<string> {
  try {
    const { data } = await supabaseAdmin
      .from("ads")
      .select("code")
      .eq("type", "ad_network_file")
      .eq("placement", fileName)
      .maybeSingle();

    if (data?.code !== undefined && data?.code !== null) {
      return data.code;
    }
  } catch (err) {
    console.error(`Error querying DB for ${fileName}:`, err);
  }

  // Fallback to local public file
  let diskContent = "";
  try {
    diskContent = await fs.readFile(path.join(PUBLIC_DIR, fileName), "utf-8");
  } catch {}

  // If found on disk but not in DB, seed to DB
  if (diskContent.trim()) {
    try {
      await supabaseAdmin.from("ads").insert({
        name: fileName,
        placement: fileName,
        code: diskContent.trim(),
        type: "ad_network_file",
        status: "active",
        target_devices: "all",
        target_categories: [],
        target_tags: [],
        priority: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error(`Error seeding ${fileName} to DB:`, e);
    }
  }

  return diskContent;
}

// GET - read file contents or list all ad network files
export async function GET(request: NextRequest) {
  const user = await checkAuth(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const file = searchParams.get("file");

  if (file) {
    if (!isValidFileName(file)) {
      return NextResponse.json({ error: "Invalid file name. Must end with .txt or .json" }, { status: 400 });
    }
    const content = await getFileContent(file);
    return NextResponse.json({ success: true, file, content });
  }

  // Discover all files: default files + database entries + disk files
  const fileMap = new Map<string, { desc: string; example: string }>();

  // 1. Add defaults
  for (const [name, meta] of Object.entries(DEFAULT_FILES)) {
    fileMap.set(name, meta);
  }

  // 2. Query custom files from Supabase DB
  try {
    const { data: dbFiles } = await supabaseAdmin
      .from("ads")
      .select("placement, name")
      .eq("type", "ad_network_file");

    if (dbFiles) {
      for (const row of dbFiles) {
        const fname = row.placement || row.name;
        if (isValidFileName(fname) && !fileMap.has(fname)) {
          fileMap.set(fname, {
            desc: `Custom Ad Network File (${fname})`,
            example: "# Custom ad network authorization or verification",
          });
        }
      }
    }
  } catch (err) {
    console.error("Error querying dbFiles for ad-networks:", err);
  }

  // 3. Scan public directory for any extra .txt or .json files
  try {
    const diskFiles = await fs.readdir(PUBLIC_DIR);
    for (const df of diskFiles) {
      if (isValidFileName(df) && !fileMap.has(df) && df !== "robots.txt") {
        fileMap.set(df, {
          desc: `Custom File (${df})`,
          example: "# Ad network verification file",
        });
      }
    }
  } catch {}

  // List all discovered files with status & contents
  const fileStatuses = await Promise.all(
    Array.from(fileMap.entries()).map(async ([name, meta]) => {
      const content = await getFileContent(name);
      const exists = content.trim().length > 0;
      const lineCount = content.split("\n").filter((l) => l.trim() && !l.startsWith("#")).length;
      return { name, ...meta, exists, lineCount, content };
    })
  );

  return NextResponse.json({ success: true, files: fileStatuses });
}

// POST - save/update any file in DB and disk
export async function POST(request: NextRequest) {
  const user = await checkAuth(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { file, content } = body;

  if (!file || !isValidFileName(file)) {
    return NextResponse.json({ error: "Invalid file name. Must be a safe name ending in .txt or .json" }, { status: 400 });
  }

  if (typeof content !== "string") {
    return NextResponse.json({ error: "Invalid content" }, { status: 400 });
  }

  const cleanContent = content.trim();

  // Validate ads.txt / app-ads.txt — allow comments, directives, blank lines
  // Only validate actual seller record lines (contain commas)
  if (file === "ads.txt" || file === "app-ads.txt") {
    const lines = cleanContent.split("\n");
    for (const rawLine of lines) {
      const line = rawLine.trim();
      // Skip blank lines, comments, and directive lines
      if (!line || line.startsWith("#") || /^(ownerdomain|managerdomain|inventorypartnerdomain)\s*=/i.test(line)) {
        continue;
      }
      // Seller record lines must have at least 3 comma-separated fields
      if (line.includes(",")) {
        const parts = line.split(",").map((p) => p.trim());
        if (parts.length < 3) {
          return NextResponse.json({
            error: `Invalid seller line: "${line}". Expected: domain, publisher-id, DIRECT|RESELLER`,
          }, { status: 400 });
        }
      }
      // Lines without commas that aren't directives/comments are invalid
      // (but we skip this to be lenient with future IAB extensions)
    }
  }

  // 1. Save in Supabase database
  const { data: existing } = await supabaseAdmin
    .from("ads")
    .select("id")
    .eq("type", "ad_network_file")
    .eq("placement", file)
    .maybeSingle();

  if (existing?.id) {
    const { error: updateError } = await supabaseAdmin.from("ads").update({
      code: cleanContent,
      status: "active",
      updated_at: new Date().toISOString(),
    }).eq("id", existing.id);

    if (updateError) {
      return NextResponse.json({ error: `Database save failed: ${updateError.message}` }, { status: 500 });
    }
  } else {
    const { error: insertError } = await supabaseAdmin.from("ads").insert({
      name: file,
      placement: file,
      code: cleanContent,
      type: "ad_network_file",
      status: "active",
      target_devices: "all",
      target_categories: [],
      target_tags: [],
      priority: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (insertError) {
      return NextResponse.json({ error: `Database save failed: ${insertError.message}` }, { status: 500 });
    }
  }

  // 2. Also try to write to public directory for static file fallback
  try {
    await fs.writeFile(path.join(PUBLIC_DIR, file), cleanContent + "\n", "utf-8");
  } catch (err) {
    console.warn(`Filesystem write skipped for ${file} (serverless/read-only):`, err);
  }

  return NextResponse.json({
    success: true,
    message: `${file} saved to database successfully`,
    lineCount: cleanContent.split("\n").filter((l) => l.trim() && !l.startsWith("#")).length,
  });
}

// DELETE - clear/delete a file from DB and disk
export async function DELETE(request: NextRequest) {
  const user = await checkAuth(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const file = searchParams.get("file");

  if (!file || !isValidFileName(file)) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  }

  // Delete from Supabase DB
  await supabaseAdmin
    .from("ads")
    .delete()
    .eq("type", "ad_network_file")
    .eq("placement", file);

  // Unlink from disk
  try {
    await fs.unlink(path.join(PUBLIC_DIR, file));
  } catch {}

  return NextResponse.json({ success: true, message: `${file} deleted successfully` });
}
