import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const fileName = searchParams.get("file");

  if (!fileName || fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
    return new NextResponse("Invalid file name", { status: 400 });
  }

  // 1. Check Supabase DB
  try {
    const { data } = await supabaseAdmin
      .from("ads")
      .select("code")
      .eq("type", "ad_network_file")
      .eq("placement", fileName)
      .maybeSingle();

    if (data?.code) {
      const contentType = fileName.endsWith(".json")
        ? "application/json; charset=utf-8"
        : "text/plain; charset=utf-8";
      return new NextResponse(data.code.trim() + "\n", {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
      });
    }
  } catch (err) {
    console.error(`Error querying DB for ${fileName}:`, err);
  }

  // 2. Check public directory on disk
  try {
    const diskPath = path.join(process.cwd(), "public", fileName);
    const content = await fs.readFile(diskPath, "utf-8");
    const contentType = fileName.endsWith(".json")
      ? "application/json; charset=utf-8"
      : "text/plain; charset=utf-8";
    return new NextResponse(content.trim() + "\n", {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch {}

  return new NextResponse("File Not Found", { status: 404 });
}
