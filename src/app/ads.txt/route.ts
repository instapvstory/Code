import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  let content = "";

  // 1. Try fetching from Supabase database
  try {
    const { data } = await supabaseAdmin
      .from("ads")
      .select("code")
      .eq("type", "ad_network_file")
      .eq("placement", "ads.txt")
      .maybeSingle();

    if (data?.code) {
      content = data.code;
    }
  } catch (err) {
    console.error("Error reading ads.txt from Supabase:", err);
  }

  // 2. Fallback to public/ads.txt file on disk
  if (!content) {
    try {
      content = await fs.readFile(path.join(process.cwd(), "public", "ads.txt"), "utf-8");
    } catch {
      content = "adsterra.com, 4629628, DIRECT\nownerdomain=pvstoryviewer.com\nmanagerdomain=revbid.net\nrevbid.net, 21983, DIRECT";
    }
  }

  return new NextResponse(content.trim() + "\n", {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
