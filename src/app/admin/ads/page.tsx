"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/admin/AdminAuthProvider";
import { useRouter } from "next/navigation";
import {
  Plus, Edit2, Trash2, Save, X, Eye,
  Code, CheckCircle, AlertCircle, RefreshCw,
  LayoutGrid, Search, Copy, Layers,
} from "lucide-react";

const PLACEMENTS = [
  { id: "hero_left",               label: "Homepage – Left Sidebar",       page: "Homepage", desc: "160×600 sidebar left of search" },
  { id: "hero_right",              label: "Homepage – Right Sidebar",      page: "Homepage", desc: "160×600 sidebar right of search" },
  { id: "below_search",            label: "Homepage – Below Search Bar",   page: "Homepage", desc: "728×90 banner below search input" },
  { id: "after_hero",              label: "Homepage – After Hero",         page: "Homepage", desc: "728×90 banner below hero section" },
  { id: "homepage_after_features", label: "Homepage – After Features",     page: "Homepage", desc: "Banner after comparison table" },
  { id: "homepage_after_blog",     label: "Homepage – After Blog Section", page: "Homepage", desc: "728×90 banner before FAQ" },
  { id: "sticky_footer",           label: "Sticky Footer (All Pages)",     page: "Global",   desc: "Fixed bottom banner on every page" },
  { id: "blog_top",                label: "Blog List – Top Banner",        page: "Blog",     desc: "728×90 at top of blog listing" },
  { id: "blog_sidebar",            label: "Blog List – Sidebar",           page: "Blog",     desc: "300×600 sidebar on blog listing" },
  { id: "between_posts",           label: "Blog – Between Post Cards",     page: "Blog",     desc: "Native ad between post cards" },
  { id: "article_top",             label: "Article – Top of Content",      page: "Article",  desc: "728×90 above article body" },
  { id: "article_mid",             label: "Article – Mid Content",         page: "Article",  desc: "In-content middle of article" },
  { id: "article_bottom",          label: "Article – End of Content",      page: "Article",  desc: "728×90 below article body" },
  { id: "article_sidebar",         label: "Article – Sidebar",             page: "Article",  desc: "300×250 sticky sidebar" },
  { id: "profile_top",             label: "Profile Page – Top",            page: "Profile",  desc: "Banner above profile viewer" },
  { id: "profile_left",            label: "Profile Page – Left Sidebar",   page: "Profile",  desc: "160×600 left of profile" },
  { id: "profile_right",           label: "Profile Page – Right Sidebar",  page: "Profile",  desc: "160×600 right of profile" },
];

const PAGE_GROUPS = ["All", "Global", "Homepage", "Blog", "Article", "Profile"];

const AD_TYPES = [
  { id: "custom",  label: "Custom HTML",    color: "#6366f1" },
  { id: "adsense", label: "Google AdSense", color: "#4285F4" },
  { id: "script",  label: "Ext. Script",   color: "#f59e0b" },
];

interface Ad {
  id: string; name: string; placement: string; code: string;
  type: string; status: string; target_devices: string;
  priority: number; start_date: string | null; end_date: string | null;
  created_at: string;
}

const EMPTY = { name: "", placement: "", code: "", type: "custom", status: "active", target_devices: "all", priority: 5, start_date: "", end_date: "" };

export default function AdManagerPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [ads, setAds] = useState<Ad[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingData, setLoadingData] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterPage, setFilterPage] = useState("All");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQ, setSearchQ] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  useEffect(() => { if (!loading && !user) router.push("/admin/login"); }, [user, loading, router]);
  useEffect(() => { if (user) fetchAds(); }, [user]);

  const fetchAds = async () => {
    setLoadingData(true);
    try {
      const res = await fetch("/api/admin/ads?limit=100");
      const data = await res.json();
      if (data.success) { setAds(data.data || []); setTotal(data.pagination?.total || 0); }
    } finally { setLoadingData(false); }
  };

  const openCreate = (placement?: string) => {
    setEditingAd(null);
    setForm({ ...EMPTY, placement: placement || "" });
    setMsg(null);
    setPreviewMode(false);
    setShowModal(true);
  };

  const openEdit = (ad: Ad) => {
    setEditingAd(ad);
    setForm({ name: ad.name, placement: ad.placement, code: ad.code, type: ad.type, status: ad.status, target_devices: ad.target_devices, priority: ad.priority, start_date: ad.start_date || "", end_date: ad.end_date || "" });
    setMsg(null);
    setPreviewMode(false);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.placement || !form.code.trim()) {
      setMsg({ type: "error", text: "Name, placement zone and ad code are all required." });
      return;
    }
    setSaving(true); setMsg(null);
    try {
      const url = editingAd ? `/api/admin/ads/${editingAd.id}` : "/api/admin/ads";
      const res = await fetch(url, { method: editingAd ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, start_date: form.start_date || null, end_date: form.end_date || null }) });
      const data = await res.json();
      if (data.success) { setMsg({ type: "success", text: editingAd ? "Ad updated!" : "Ad created!" }); setShowModal(false); fetchAds(); }
      else setMsg({ type: "error", text: data.error || "Save failed" });
    } catch { setMsg({ type: "error", text: "Network error" }); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this ad permanently?")) return;
    setDeletingId(id);
    try { await fetch(`/api/admin/ads/${id}`, { method: "DELETE" }); setAds(p => p.filter(a => a.id !== id)); setMsg({ type: "success", text: "Ad deleted." }); }
    finally { setDeletingId(null); }
  };

  const toggleStatus = async (ad: Ad) => {
    const ns = ad.status === "active" ? "inactive" : "active";
    await fetch(`/api/admin/ads/${ad.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: ns }) });
    setAds(p => p.map(a => a.id === ad.id ? { ...a, status: ns } : a));
  };

  const filtered = ads.filter(ad => {
    const p = PLACEMENTS.find(pl => pl.id === ad.placement);
    return (filterPage === "All" || p?.page === filterPage) && (filterStatus === "all" || ad.status === filterStatus) && (!searchQ || ad.name.toLowerCase().includes(searchQ.toLowerCase()));
  });

  const getZoneAds = (pid: string) => ads.filter(a => a.placement === pid);

  const badgeStyle = (s: string) => ({ active: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0", label: "Active" }, inactive: { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0", label: "Inactive" }, testing: { bg: "#fffbeb", color: "#d97706", border: "#fde68a", label: "Testing" } } as any)[s] || { bg: "#f1f5f9", color: "#475569", border: "#e2e8f0", label: s };

  const inp = { width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" as const, color: "#0f172a" };
  const lbl = { fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 };

  if (loading) return null;

  return (
    <div style={{ padding: 24, maxWidth: 1280, margin: "0 auto" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.ad-row:hover td{background:#f8faff!important}.zone-card:hover{border-color:#6366f1!important}`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", margin: 0 }}>Ad Manager</h1>
          <p style={{ color: "#64748b", marginTop: 6, fontSize: 14 }}>{total} ads across {PLACEMENTS.length} placement zones</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setViewMode(v => v === "list" ? "grid" : "list")} style={{ background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 10, padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontWeight: 500, fontSize: 13 }}>
            <LayoutGrid size={15} />{viewMode === "list" ? "Zone View" : "List View"}
          </button>
          <button onClick={() => openCreate()} style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <Plus size={16} />New Ad
          </button>
        </div>
      </div>

      {/* Global message */}
      {msg && !showModal && (
        <div style={{ padding: "12px 16px", borderRadius: 10, marginBottom: 20, background: msg.type === "success" ? "#f0fdf4" : "#fef2f2", border: `1px solid ${msg.type === "success" ? "#bbf7d0" : "#fecaca"}`, color: msg.type === "success" ? "#16a34a" : "#dc2626", display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
          {msg.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "inherit" }}><X size={14} /></button>
        </div>
      )}

      {/* Filters */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 16px", marginBottom: 20, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
          <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search ads..." style={{ ...inp, paddingLeft: 34 }} />
        </div>
        {PAGE_GROUPS.map(g => (
          <button key={g} onClick={() => setFilterPage(g)} style={{ padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500, background: filterPage === g ? "#6366f1" : "#f1f5f9", color: filterPage === g ? "#fff" : "#475569" }}>{g}</button>
        ))}
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#475569", cursor: "pointer" }}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* ── ZONE VIEW ── */}
      {viewMode === "grid" && PAGE_GROUPS.filter(g => g !== "All").map(pg => {
        if (filterPage !== "All" && filterPage !== pg) return null;
        const zones = PLACEMENTS.filter(p => p.page === pg);
        return (
          <div key={pg} style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>{pg} Zones</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: 14 }}>
              {zones.map(zone => {
                const za = getZoneAds(zone.id);
                const hasActive = za.some(a => a.status === "active");
                return (
                  <div key={zone.id} className="zone-card" style={{ background: "#fff", border: `2px solid ${hasActive ? "#bbf7d0" : "#e2e8f0"}`, borderRadius: 14, padding: 16, transition: "border 0.2s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>{zone.label}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>{zone.desc}</div>
                      </div>
                      {hasActive && <span style={{ background: "#f0fdf4", color: "#16a34a", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, border: "1px solid #bbf7d0", whiteSpace: "nowrap" }}>LIVE</span>}
                    </div>
                    {za.length > 0 ? za.map(ad => {
                      const b = badgeStyle(ad.status);
                      return (
                        <div key={ad.id} style={{ display: "flex", alignItems: "center", gap: 6, background: "#f8fafc", borderRadius: 8, padding: "6px 10px", marginBottom: 5 }}>
                          <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ad.name}</span>
                          <span style={{ background: b.bg, color: b.color, border: `1px solid ${b.border}`, fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 999 }}>{b.label}</span>
                          <button onClick={() => openEdit(ad)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 2 }}><Edit2 size={12} /></button>
                          <button onClick={() => handleDelete(ad.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", padding: 2 }}><Trash2 size={12} /></button>
                        </div>
                      );
                    }) : (
                      <div style={{ background: "#f8fafc", border: "1px dashed #e2e8f0", borderRadius: 8, padding: 10, textAlign: "center", marginBottom: 8 }}>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>No ad configured</span>
                      </div>
                    )}
                    <button onClick={() => openCreate(zone.id)} style={{ width: "100%", background: "#f1f5f9", border: "none", borderRadius: 8, padding: "6px 0", fontSize: 11, fontWeight: 500, color: "#6366f1", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 4 }}>
                      <Plus size={11} />Add Ad Here
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* ── LIST VIEW ── */}
      {viewMode === "list" && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden" }}>
          {loadingData ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
              <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", color: "#6366f1" }} />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <Layers size={48} style={{ color: "#e2e8f0", margin: "0 auto 16px", display: "block" }} />
              <p style={{ color: "#94a3b8", fontSize: 15 }}>No ads found. Create your first ad to get started.</p>
              <button onClick={() => openCreate()} style={{ marginTop: 12, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Plus size={14} />Create First Ad
              </button>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  {["Ad Name", "Placement Zone", "Type", "Device", "Status", "Actions"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(ad => {
                  const zone = PLACEMENTS.find(p => p.id === ad.placement);
                  const b = badgeStyle(ad.status);
                  return (
                    <tr key={ad.id} className="ad-row" style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>{ad.name}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Priority: {ad.priority} · {new Date(ad.created_at).toLocaleDateString()}</div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 500, fontSize: 13, color: "#334155" }}>{zone?.label || ad.placement}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{zone?.page}</div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ background: "#ede9fe", color: "#7c3aed", fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 999 }}>{AD_TYPES.find(t => t.id === ad.type)?.label || ad.type}</span>
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: "#475569" }}>{ad.target_devices}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <button onClick={() => toggleStatus(ad)} style={{ background: b.bg, color: b.color, border: `1px solid ${b.border}`, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 999, cursor: "pointer" }}>{b.label}</button>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => openEdit(ad)} style={{ background: "#f1f5f9", border: "none", borderRadius: 7, padding: "6px 10px", cursor: "pointer", color: "#6366f1", display: "flex" }}><Edit2 size={14} /></button>
                          <button onClick={() => handleDelete(ad.id)} disabled={deletingId === ad.id} style={{ background: "#fef2f2", border: "none", borderRadius: 7, padding: "6px 10px", cursor: "pointer", color: "#ef4444", display: "flex" }}>
                            {deletingId === ad.id ? <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── CREATE / EDIT MODAL ── */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 800, maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 25px 80px rgba(0,0,0,0.25)", animation: "fadeIn 0.2s ease" }}>

            {/* Modal Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg,#0f172a,#1e293b)" }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>{editingAd ? "Edit Ad" : "Create New Ad"}</h2>
                <p style={{ fontSize: 12, color: "#94a3b8", margin: "4px 0 0" }}>Paste your ad code and choose where to display it on the site</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setPreviewMode(v => !v)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "7px 14px", color: "#e2e8f0", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                  <Eye size={14} />{previewMode ? "Edit Mode" : "Preview"}
                </button>
                <button onClick={() => { setShowModal(false); setMsg(null); }} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", color: "#94a3b8" }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div style={{ overflow: "auto", flex: 1, padding: 24 }}>
              {msg && (
                <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 18, background: msg.type === "success" ? "#f0fdf4" : "#fef2f2", border: `1px solid ${msg.type === "success" ? "#bbf7d0" : "#fecaca"}`, color: msg.type === "success" ? "#16a34a" : "#dc2626", display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  {msg.type === "success" ? <CheckCircle size={15} /> : <AlertCircle size={15} />}{msg.text}
                </div>
              )}

              {!previewMode ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {/* Ad Name */}
                  <div style={{ gridColumn: "1/-1" }}>
                    <label style={lbl}>Ad Name *</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Adsterra Homepage Banner" style={inp} />
                  </div>

                  {/* Placement */}
                  <div>
                    <label style={lbl}>Placement Zone *</label>
                    <select value={form.placement} onChange={e => setForm(f => ({ ...f, placement: e.target.value }))} style={{ ...inp, cursor: "pointer" }}>
                      <option value="">-- Select Zone --</option>
                      {PAGE_GROUPS.filter(g => g !== "All").map(pg => (
                        <optgroup key={pg} label={`${pg} Page`}>
                          {PLACEMENTS.filter(p => p.page === pg).map(p => (
                            <option key={p.id} value={p.id}>{p.label}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    {form.placement && <p style={{ fontSize: 11, color: "#6366f1", margin: "5px 0 0" }}>{PLACEMENTS.find(p => p.id === form.placement)?.desc}</p>}
                  </div>

                  {/* Ad Type */}
                  <div>
                    <label style={lbl}>Ad Type</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      {AD_TYPES.map(t => (
                        <button key={t.id} onClick={() => setForm(f => ({ ...f, type: t.id }))} style={{ flex: 1, padding: "9px 6px", border: `2px solid ${form.type === t.id ? t.color : "#e2e8f0"}`, borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 600, background: form.type === t.id ? t.color + "18" : "#fff", color: form.type === t.id ? t.color : "#64748b", transition: "all 0.15s" }}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Device Targeting */}
                  <div>
                    <label style={lbl}>Device Targeting</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[{ id: "all", label: "All" }, { id: "desktop", label: "Desktop" }, { id: "mobile", label: "Mobile" }, { id: "tablet", label: "Tablet" }].map(d => (
                        <button key={d.id} onClick={() => setForm(f => ({ ...f, target_devices: d.id }))} style={{ flex: 1, padding: "9px 4px", border: `2px solid ${form.target_devices === d.id ? "#6366f1" : "#e2e8f0"}`, borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 600, background: form.target_devices === d.id ? "#ede9fe" : "#fff", color: form.target_devices === d.id ? "#6366f1" : "#64748b" }}>
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label style={lbl}>Status</label>
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={{ ...inp, cursor: "pointer" }}>
                      <option value="active">Active – show on site</option>
                      <option value="inactive">Inactive – hidden</option>
                      <option value="testing">Testing – visible to admin only</option>
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label style={lbl}>Priority (1–10, higher = shown first)</label>
                    <input type="number" min={1} max={10} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: parseInt(e.target.value) || 5 }))} style={inp} />
                  </div>

                  {/* Dates */}
                  <div>
                    <label style={lbl}>Start Date (optional)</label>
                    <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>End Date (optional)</label>
                    <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} style={inp} />
                  </div>

                  {/* Code Editor */}
                  <div style={{ gridColumn: "1/-1" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <label style={lbl}>
                        <Code size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
                        Ad Code * <span style={{ color: "#94a3b8", fontWeight: 400 }}>(paste full ad script or HTML)</span>
                      </label>
                      <button onClick={() => navigator.clipboard.writeText(form.code)} style={{ background: "none", border: "none", color: "#6366f1", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                        <Copy size={12} />Copy
                      </button>
                    </div>
                    <div style={{ background: "#0f172a", borderRadius: 12, overflow: "hidden", border: "2px solid #e2e8f0" }}>
                      <div style={{ background: "#1e293b", padding: "8px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e" }} />
                        </div>
                        <span style={{ color: "#64748b", fontSize: 12, fontFamily: "monospace" }}>{form.placement || "ad-code.html"}</span>
                        <span style={{ color: "#22c55e", fontSize: 11 }}>HTML / JS</span>
                      </div>
                      <textarea
                        value={form.code}
                        onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                        rows={12}
                        placeholder={"<!-- Paste your ad code here -->\n\n<!-- Adsterra example: -->\n<script type=\"text/javascript\">\n  atOptions = { 'key': 'YOUR_KEY', 'format': 'iframe' };\n</script>\n<script src=\"//www.topcreativeformat.com/YOUR_KEY/invoke.js\"></script>\n\n<!-- AdSense example: -->\n<ins class=\"adsbygoogle\" style=\"display:block\"\n  data-ad-client=\"ca-pub-XXXXXXXX\"\n  data-ad-slot=\"XXXXXXXX\"></ins>"}
                        style={{ width: "100%", background: "transparent", border: "none", color: "#e2e8f0", fontSize: 13, lineHeight: 1.7, padding: 16, resize: "vertical", outline: "none", boxSizing: "border-box", minHeight: 240, fontFamily: "monospace" }}
                      />
                    </div>
                    <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
                      Supports: Adsterra scripts, Google AdSense ins tags, any iframe, popunder codes, banner HTML — anything your ad network gives you.
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ background: "#f8fafc", border: "2px dashed #e2e8f0", borderRadius: 14, padding: 24, textAlign: "center", minHeight: 160, marginBottom: 16 }}>
                    <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 12 }}>Rendered preview:</p>
                    {form.code
                      ? <div dangerouslySetInnerHTML={{ __html: form.code }} />
                      : <p style={{ color: "#cbd5e1" }}>No code entered yet</p>}
                  </div>
                  <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: 14 }}>
                    <p style={{ fontSize: 13, color: "#0369a1", margin: 0 }}>ℹ️ External ad scripts (Adsterra, AdSense) may not fully render in preview but will work correctly on the live site.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end", gap: 10, background: "#fafbfc" }}>
              <button onClick={() => { setShowModal(false); setMsg(null); }} style={{ background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 10, padding: "10px 24px", fontWeight: 500, cursor: "pointer", fontSize: 14 }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 28px", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                {saving ? <RefreshCw size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={15} />}
                {saving ? "Saving..." : editingAd ? "Update Ad" : "Create Ad"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}