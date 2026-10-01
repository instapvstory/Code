"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/admin/AdminAuthProvider";
import { useRouter } from "next/navigation";
import {
  FileText, Plus, Save, RefreshCw, CheckCircle,
  AlertCircle, Copy, ExternalLink, ChevronDown, ChevronUp,
  Globe, Shield, Info, Trash2,
} from "lucide-react";

const NETWORKS = [
  { id: "google",       name: "Google AdSense",  color: "#4285F4", logo: "G",  docsUrl: "https://support.google.com/adsense/answer/7532444", lines: ["google.com, pub-1602093984257648, DIRECT, f08c47fec0942fa0"] },
  { id: "adsterra",     name: "Adsterra",         color: "#00B96B", logo: "A",  docsUrl: "https://publishers.adsterra.com/", lines: ["adsterra.com, 4629628, DIRECT"] },
  { id: "mgid",         name: "MGID",             color: "#E84B3A", logo: "M",  docsUrl: "https://help.mgid.com/", lines: ["mgid.com, 1234567, DIRECT"] },
  { id: "propeller",    name: "PropellerAds",     color: "#FF6B35", logo: "P",  docsUrl: "https://publishers.propellerads.com/", lines: ["propellerads.com, YOUR_ID, DIRECT"] },
  { id: "medianet",     name: "Media.net",        color: "#0066CC", logo: "MN", docsUrl: "https://www.media.net/", lines: ["media.net, YOUR_SITEID, DIRECT"] },
  { id: "infolinks",    name: "Infolinks",        color: "#FF5500", logo: "IL", docsUrl: "https://www.infolinks.com/", lines: ["infolinks.com, YOUR_ID, DIRECT"] },
  { id: "amazon",       name: "Amazon Ads",       color: "#FF9900", logo: "Az", docsUrl: "https://advertising.amazon.com/", lines: ["amazon-adsystem.com, 3916270810, DIRECT"] },
  { id: "criteo",       name: "Criteo",           color: "#FF6900", logo: "C",  docsUrl: "https://www.criteo.com/", lines: ["criteo.com, YOUR_ID, DIRECT"] },
  { id: "ezoic",        name: "Ezoic",            color: "#7C3AED", logo: "Ez", docsUrl: "https://www.ezoic.com/", lines: ["ezoic.com, YOUR_ID, DIRECT"] },
  { id: "taboola",      name: "Taboola",          color: "#1F3B8C", logo: "T",  docsUrl: "https://www.taboola.com/", lines: ["taboola.com, YOUR_ID, DIRECT"] },
];

interface FileStatus {
  name: string; desc: string; example: string;
  exists: boolean; lineCount: number; content: string;
}

export default function AdNetworksPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [files, setFiles] = useState<FileStatus[]>([]);
  const [activeFile, setActiveFile] = useState("ads.txt");
  const [editorContent, setEditorContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [expandedNet, setExpandedNet] = useState<string | null>(null);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [origin, setOrigin] = useState("");

  useEffect(() => { if (!loading && !user) router.push("/admin/login"); }, [user, loading, router]);
  useEffect(() => { if (user) { loadFiles(); setOrigin(window.location.origin); } }, [user]);

  const loadFiles = async () => {
    setLoadingFiles(true);
    try {
      const res = await fetch("/api/admin/ad-networks");
      const data = await res.json();
      if (data.success) {
        setFiles(data.files);
        const cur = data.files.find((f: FileStatus) => f.name === activeFile);
        if (cur) setEditorContent(cur.content);
      }
    } finally { setLoadingFiles(false); }
  };

  const switchFile = async (fileName: string) => {
    setActiveFile(fileName);
    const res = await fetch(`/api/admin/ad-networks?file=${fileName}`);
    const data = await res.json();
    if (data.success) setEditorContent(data.content);
  };

  const saveFile = async () => {
    setSaving(true); setMsg(null);
    try {
      const res = await fetch("/api/admin/ad-networks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ file: activeFile, content: editorContent }) });
      const data = await res.json();
      if (data.success) { setMsg({ type: "success", text: `${activeFile} saved successfully (${data.lineCount} entries)` }); loadFiles(); }
      else setMsg({ type: "error", text: data.error || "Save failed" });
    } catch { setMsg({ type: "error", text: "Network error" }); }
    finally { setSaving(false); }
  };

  const deleteFile = async () => {
    if (!confirm(`Delete ${activeFile}?`)) return;
    await fetch(`/api/admin/ad-networks?file=${activeFile}`, { method: "DELETE" });
    setEditorContent("");
    setMsg({ type: "success", text: `${activeFile} deleted` });
    loadFiles();
  };

  const addNetwork = (lines: string[]) => {
    const existing = editorContent.trim();
    const newLines = lines.filter(l => !existing.includes(l.split(",")[0].trim()));
    if (!newLines.length) { setMsg({ type: "error", text: "This network is already in the file." }); return; }
    setEditorContent(prev => prev.trim() ? prev.trim() + "\n" + newLines.join("\n") : newLines.join("\n"));
    setMsg({ type: "success", text: `Added ${newLines.length} line(s). Click Save to apply.` });
  };

  const copyContent = () => { navigator.clipboard.writeText(editorContent); setMsg({ type: "success", text: "Copied to clipboard!" }); };

  const lines = editorContent.split("\n").filter(l => l.trim() && !l.startsWith("#"));
  const currentFile = files.find(f => f.name === activeFile);

  if (loading || loadingFiles) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
      <RefreshCw size={28} style={{ animation: "spin 1s linear infinite", color: "#6366f1" }} />
    </div>
  );

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}textarea{font-family:'Fira Code','Cascadia Code',monospace!important}`}</style>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", margin: 0 }}>Ad Networks &amp; TXT Files</h1>
        <p style={{ color: "#64748b", marginTop: 6, fontSize: 14 }}>Manage ads.txt and app-ads.txt to authorize ad networks and increase verified revenue.</p>
      </div>

      {msg && (
        <div style={{ padding: "12px 16px", borderRadius: 10, marginBottom: 20, background: msg.type === "success" ? "#f0fdf4" : "#fef2f2", border: `1px solid ${msg.type === "success" ? "#bbf7d0" : "#fecaca"}`, color: msg.type === "success" ? "#16a34a" : "#dc2626", display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
          {msg.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {msg.text}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
        {/* LEFT: Editor */}
        <div>
          <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
            {files.map(f => (
              <button key={f.name} onClick={() => switchFile(f.name)} style={{ padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, background: activeFile === f.name ? "#6366f1" : "#f1f5f9", color: activeFile === f.name ? "#fff" : "#475569", display: "flex", alignItems: "center", gap: 7 }}>
                <FileText size={14} />
                {f.name}
                {f.exists && <span style={{ background: activeFile === f.name ? "rgba(255,255,255,0.25)" : "#e2e8f0", color: activeFile === f.name ? "#fff" : "#64748b", borderRadius: 999, padding: "1px 7px", fontSize: 11 }}>{f.lineCount}</span>}
              </button>
            ))}
          </div>

          {currentFile && (
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Info size={15} color="#6366f1" />
                <span style={{ fontSize: 13, color: "#475569" }}>{currentFile.desc}</span>
              </div>
              <a href={`${origin}/${activeFile}`} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#6366f1", textDecoration: "none", fontWeight: 500 }}>
                <ExternalLink size={13} />View Live
              </a>
            </div>
          )}

          <div style={{ background: "#0f172a", borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }}>
            <div style={{ background: "#1e293b", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ef4444" }} />
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#f59e0b" }} />
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#22c55e" }} />
                <span style={{ marginLeft: 8, color: "#94a3b8", fontSize: 13, fontFamily: "monospace" }}>{activeFile}</span>
              </div>
              <button onClick={copyContent} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 6, padding: "5px 10px", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
                <Copy size={13} />Copy
              </button>
            </div>
            <div style={{ display: "flex", minHeight: 300 }}>
              <div style={{ background: "#0a0f1c", color: "#475569", padding: "16px 12px", fontSize: 13, fontFamily: "monospace", lineHeight: "24px", userSelect: "none", minWidth: 40, textAlign: "right", borderRight: "1px solid rgba(255,255,255,0.04)" }}>
                {editorContent.split("\n").map((_, i) => <div key={i}>{i + 1}</div>)}
              </div>
              <textarea value={editorContent} onChange={e => setEditorContent(e.target.value)} spellCheck={false} placeholder={`# ${activeFile}\n# Format: domain, publisher-id, DIRECT|RESELLER, cert-id\n\n${currentFile?.example || ""}`} style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#e2e8f0", fontSize: 13, lineHeight: "24px", padding: 16, resize: "none", minHeight: 300 }} />
            </div>
            <div style={{ background: "#1e293b", padding: "8px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 16, fontSize: 12, color: "#64748b" }}>
              <span>{lines.length} entries</span>
              <span>{editorContent.length} bytes</span>
              <span style={{ color: "#22c55e" }}>UTF-8</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={saveFile} disabled={saving} style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 28px", fontWeight: 600, fontSize: 14, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, display: "flex", alignItems: "center", gap: 8 }}>
              {saving ? <RefreshCw size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={15} />}
              {saving ? "Saving..." : `Save ${activeFile}`}
            </button>
            <button onClick={() => switchFile(activeFile)} style={{ background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 10, padding: "11px 18px", fontWeight: 500, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <RefreshCw size={14} />Reload
            </button>
            {currentFile?.exists && (
              <button onClick={deleteFile} style={{ marginLeft: "auto", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", borderRadius: 10, padding: "11px 18px", fontWeight: 500, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <Trash2 size={14} />Delete File
              </button>
            )}
          </div>

          {lines.length > 0 && (
            <div style={{ marginTop: 20, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", margin: "0 0 12px" }}>Parsed Entries ({lines.length})</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {lines.map((line, i) => {
                  const parts = line.split(",").map(p => p.trim());
                  const valid = parts.length >= 3;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, background: valid ? "#f0fdf4" : "#fef2f2", border: `1px solid ${valid ? "#bbf7d0" : "#fecaca"}` }}>
                      {valid ? <CheckCircle size={14} color="#16a34a" /> : <AlertCircle size={14} color="#dc2626" />}
                      <code style={{ fontSize: 12, color: valid ? "#15803d" : "#dc2626", flex: 1 }}>{line}</code>
                      {parts[2] && <span style={{ background: parts[2].toUpperCase() === "DIRECT" ? "#dbeafe" : "#fef3c7", color: parts[2].toUpperCase() === "DIRECT" ? "#1d4ed8" : "#92400e", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>{parts[2].toUpperCase()}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Networks panel */}
        <div>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", background: "#fafbfc" }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>Quick Add Networks</h2>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: "4px 0 0" }}>One-click to add network lines to {activeFile}</p>
            </div>
            <div style={{ maxHeight: 560, overflowY: "auto" }}>
              {NETWORKS.map(net => {
                const alreadyAdded = net.lines.some(l => editorContent.includes(l.split(",")[0].trim()));
                const isExpanded = expandedNet === net.id;
                return (
                  <div key={net.id} style={{ borderBottom: "1px solid #f1f5f9", background: alreadyAdded ? "#f0fdf4" : "#fff" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer" }} onClick={() => setExpandedNet(isExpanded ? null : net.id)}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: net.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{net.logo}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>{net.name}</div>
                        <div style={{ fontSize: 11, color: alreadyAdded ? "#16a34a" : "#94a3b8" }}>{alreadyAdded ? "✓ Already added" : `${net.lines.length} line(s) to add`}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {!alreadyAdded && <button onClick={e => { e.stopPropagation(); addNetwork(net.lines); }} style={{ background: net.color, color: "#fff", border: "none", borderRadius: 7, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><Plus size={12} />Add</button>}
                        {isExpanded ? <ChevronUp size={15} color="#94a3b8" /> : <ChevronDown size={15} color="#94a3b8" />}
                      </div>
                    </div>
                    {isExpanded && (
                      <div style={{ padding: "0 16px 14px" }}>
                        <div style={{ background: "#f8fafc", borderRadius: 8, padding: 10 }}>
                          {net.lines.map((l, i) => <code key={i} style={{ display: "block", fontSize: 11, color: "#475569", lineHeight: "20px" }}>{l}</code>)}
                        </div>
                        <a href={net.docsUrl} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "#6366f1", marginTop: 8, textDecoration: "none" }}>
                          <ExternalLink size={12} />View docs
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}><Globe size={15} color="#3b82f6" /><span style={{ fontWeight: 600, fontSize: 13, color: "#1e40af" }}>ads.txt</span></div>
              <p style={{ fontSize: 12, color: "#3b82f6", margin: 0, lineHeight: 1.5 }}>Publicly at <strong>pvstoryviewer.com/ads.txt</strong> — required for ad network approval.</p>
            </div>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}><Shield size={15} color="#16a34a" /><span style={{ fontWeight: 600, fontSize: 13, color: "#15803d" }}>Revenue Impact</span></div>
              <p style={{ fontSize: 12, color: "#16a34a", margin: 0, lineHeight: 1.5 }}>Publishers with valid ads.txt earn up to <strong>23% more</strong> — advertisers pay premium for verified inventory.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}