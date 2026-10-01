import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { validateSession } from "@/lib/cms";

async function checkAuth(request: NextRequest) {
  const token =
    request.cookies.get("admin_token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  return await validateSession(token);
}

// GET - list all ads with pagination/filter
export async function GET(request: NextRequest) {
  const user = await checkAuth(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;
  const placement = searchParams.get("placement") || "";
  const status = searchParams.get("status") || "";

  let query = supabase
    .from("ads")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (placement) query = query.eq("placement", placement);
  if (status) query = query.eq("status", status);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    success: true,
    data: data || [],
    pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) },
  });
}

// POST - create new ad
export async function POST(request: NextRequest) {
  const user = await checkAuth(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, placement, code, type, status, target_devices, priority, start_date, end_date } = body;

  if (!name || !placement || !code) {
    return NextResponse.json({ error: "name, placement and code are required" }, { status: 400 });
  }

  const { data, error } = await supabase.from("ads").insert({
    name,
    placement,
    code,
    type: type || "custom",
    status: status || "active",
    target_devices: target_devices || "all",
    priority: priority || 5,
    start_date: start_date || null,
    end_date: end_date || null,
    target_categories: [],
    target_tags: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

// DELETE bulk
export async function DELETE(request: NextRequest) {
  const user = await checkAuth(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { ids } = body;
  if (!ids?.length) return NextResponse.json({ error: "No ids provided" }, { status: 400 });

  const { error } = await supabase.from("ads").delete().in("id", ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
