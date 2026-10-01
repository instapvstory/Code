"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/admin/AdminAuthProvider";
import { useRouter } from "next/navigation";
import {
  FileText, Plus, Save, RefreshCw, CheckCircle,
  AlertCircle, Copy, ExternalLink, ChevronDown, ChevronUp,
  Globe, Shield, Info, Trash2, Upload, FilePlus, Sparkles
} from "lucide-react";

const PRESET_NETWORKS = [
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
  name: string;
  desc: string;
  example: string;
  exists: boolean;
  lineCount: number;
  content: string;
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

  // Modal / Form state for adding custom file
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState("");

  // Custom network form state
  const [showCustomNetForm, setShowCustomNetForm] = useState(false);
  const [customNetDomain, setCustomNetDomain] = useState("");
  const [customNetPubId, setCustomNetPubId] = useState("");
  const [customNetType, setCustomNetType] = useState<"DIRECT" | "RESELLER">("DIRECT");
  const [customNetAuthId, setCustomNetAuthId] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/admin/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadFiles();
      setOrigin(window.location.origin);
    }
  }, [user]);

  const loadFiles = async () => {
    setLoadingFiles(true);
    try {
      const res = await fetch("/api/admin/ad-networks");
      const data = await res.json();
      if (data.success && data.files) {
        setFiles(data.files);
        const cur = data.files.find((f: FileStatus) => f.name === activeFile) || data.files[0];
        if (cur) {
          setActiveFile(cur.name);
          setEditorContent(cur.content || "");
        }
      }
    } catch {
      setMsg({ type: "error", text: "Failed to load files from server" });
    } finally {
      setLoadingFiles(false);
    }
  };

  const switchFile = async (fileName: string) => {
    setActiveFile(fileName);
    setMsg(null);
    const existing = files.find((f) => f.name === fileName);
    if (existing && existing.content !== undefined) {
      setEditorContent(existing.content);
    } else {
      const res = await fetch(`/api/admin/ad-networks?file=${encodeURIComponent(fileName)}`);
      const data = await res.json();
      if (data.success) setEditorContent(data.content || "");
    }
  };

  const saveFile = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/ad-networks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: activeFile, content: editorContent }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ type: "success", text: `${activeFile} saved to database successfully (${data.lineCount} entries)` });
        loadFiles();
      } else {
        setMsg({ type: "error", text: data.error || "Save failed" });
      }
    } catch {
      setMsg({ type: "error", text: "Network error saving file" });
    } finally {
      setSaving(false);
    }
  };

  const deleteFile = async (fileToDelete: string) => {
    if (!confirm(`Are you sure you want to delete ${fileToDelete} permanently?`)) return;
    try {
      const res = await fetch(`/api/admin/ad-networks?file=${encodeURIComponent(fileToDelete)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ type: "success", text: `${fileToDelete} deleted successfully` });
        setActiveFile("ads.txt");
        loadFiles();
      } else {
        setMsg({ type: "error", text: data.error || "Delete failed" });
      }
    } catch {
      setMsg({ type: "error", text: "Network error deleting file" });
    }
  };

  // Add lines from preset network
  const addNetwork = (lines: string[]) => {
    const existing = editorContent.trim();
    const newLines = lines.filter((l) => !existing.includes(l.split(",")[0].trim()));
    if (!newLines.length) {
      setMsg({ type: "error", text: "This ad network is already authorized in the file." });
      return;
    }
    setEditorContent((prev) => (prev.trim() ? prev.trim() + "\n" + newLines.join("\n") : newLines.join("\n")));
    setMsg({ type: "success", text: `Added ${newLines.length} line(s). Click "Save ${activeFile}" to persist.` });
  };

  // Add custom user-specified network
  const handleAddCustomNetwork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customNetDomain.trim() || !customNetPubId.trim()) {
      setMsg({ type: "error", text: "Domain and Publisher ID are required." });
      return;
    }

    const domain = customNetDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    const pubId = customNetPubId.trim();
    const type = customNetType;
    const authId = customNetAuthId.trim();

    const formattedLine = authId
      ? `${domain}, ${pubId}, ${type}, ${authId}`
      : `${domain}, ${pubId}, ${type}`;

    if (editorContent.includes(domain)) {
      setMsg({ type: "error", text: `Domain "${domain}" is already in this file.` });
      return;
    }

    setEditorContent((prev) => (prev.trim() ? prev.trim() + "\n" + formattedLine : formattedLine));
    setCustomNetDomain("");
    setCustomNetPubId("");
    setCustomNetAuthId("");
    setShowCustomNetForm(false);
    setMsg({ type: "success", text: `Added "${domain}" to ${activeFile}. Click "Save ${activeFile}" to save to database.` });
  };

  // Create a brand new custom file
  const handleCreateNewFile = async (e: React.FormEvent) => {
    e.preventDefault();
    let name = newFileName.trim().toLowerCase();
    if (!name) return;
    if (!name.endsWith(".txt") && !name.endsWith(".json")) {
      name += ".txt";
    }

    if (files.some((f) => f.name.toLowerCase() === name)) {
      setMsg({ type: "error", text: `File "${name}" already exists.` });
      return;
    }

    setShowNewFileModal(false);
    setNewFileName("");
    setActiveFile(name);
    setEditorContent(`# ${name}\n# Created for custom ad network verification\n`);
    setMsg({ type: "success", text: `Created ${name}. Add your content and click "Save ${name}".` });
  };

  // Handle local .txt file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || "";
      const uploadFileName = file.name.toLowerCase();

      // If user wants to replace active file or create new
      if (confirm(`Do you want to open "${file.name}" as a file tab? (Click Cancel to paste into current ${activeFile})`)) {
        setActiveFile(uploadFileName);
        setEditorContent(text);
        setMsg({ type: "success", text: `Loaded "${file.name}". Click "Save ${uploadFileName}" to save in dashboard.` });
      } else {
        setEditorContent((prev) => (prev.trim() ? prev.trim() + "\n" + text.trim() : text.trim()));
        setMsg({ type: "success", text: `Appended contents of "${file.name}" into ${activeFile}.` });
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const copyContent = () => {
    navigator.clipboard.writeText(editorContent);
    setMsg({ type: "success", text: "Copied to clipboard!" });
  };

  const lines = editorContent.split("\n").filter((l) => l.trim() && !l.startsWith("#"));
  const currentFile = files.find((f) => f.name === activeFile);

  if (loading || loadingFiles) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <RefreshCw size={28} style={{ animation: "spin 1s linear infinite", color: "#6366f1" }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1240, margin: "0 auto" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        textarea { font-family: 'Fira Code', 'Cascadia Code', monospace !important; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <FileText size={26} color="#6366f1" /> Ad Networks &amp; TXT Files
          </h1>
          <p style={{ color: "#64748b", marginTop: 6, fontSize: 14 }}>
            Manage ads.txt, app-ads.txt, or upload custom TXT files to approve your site across any ad network.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          {/* Upload TXT file button */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.json"
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: "9px 16px",
              borderRadius: 10,
              border: "1px solid #cbd5e1",
              background: "#fff",
              color: "#334155",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 7,
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <Upload size={14} /> Upload TXT File
          </button>

          {/* Add New File button */}
          <button
            onClick={() => setShowNewFileModal(true)}
            style={{
              padding: "9px 16px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 7,
              boxShadow: "0 2px 8px rgba(99,102,241,0.25)",
            }}
          >
            <FilePlus size={15} /> Add Custom File
          </button>
        </div>
      </div>

      {/* Notification Message */}
      {msg && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            marginBottom: 20,
            background: msg.type === "success" ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${msg.type === "success" ? "#bbf7d0" : "#fecaca"}`,
            color: msg.type === "success" ? "#16a34a" : "#dc2626",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 14,
          }}
        >
          {msg.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {msg.text}
        </div>
      )}

      {/* Main Grid: Left Editor & Right Ad Network helper */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24 }}>
        {/* LEFT: Editor */}
        <div>
          {/* File Tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 4 }}>
            {files.map((f) => (
              <button
                key={f.name}
                onClick={() => switchFile(f.name)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 13,
                  background: activeFile === f.name ? "#6366f1" : "#f1f5f9",
                  color: activeFile === f.name ? "#fff" : "#475569",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                }}
              >
                <FileText size={14} />
                {f.name}
                {f.exists && (
                  <span
                    style={{
                      background: activeFile === f.name ? "rgba(255,255,255,0.25)" : "#e2e8f0",
                      color: activeFile === f.name ? "#fff" : "#64748b",
                      borderRadius: 999,
                      padding: "1px 7px",
                      fontSize: 11,
                    }}
                  >
                    {f.lineCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Active File Info Bar */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              padding: "10px 16px",
              marginBottom: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Info size={15} color="#6366f1" />
              <span style={{ fontSize: 13, color: "#475569" }}>
                {currentFile?.desc || `Custom file: ${activeFile}`}
              </span>
            </div>
            <a
              href={`${origin}/${activeFile}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 12,
                color: "#6366f1",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              <ExternalLink size={13} /> View Public URL: /{activeFile}
            </a>
          </div>

          {/* Dark Monaco-Style Code Editor */}
          <div style={{ background: "#0f172a", borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }}>
            <div
              style={{
                background: "#1e293b",
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ef4444" }} />
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#f59e0b" }} />
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#22c55e" }} />
                <span style={{ marginLeft: 8, color: "#94a3b8", fontSize: 13, fontFamily: "monospace" }}>
                  {activeFile}
                </span>
              </div>
              <button
                onClick={copyContent}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "none",
                  borderRadius: 6,
                  padding: "5px 10px",
                  color: "#94a3b8",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 12,
                }}
              >
                <Copy size={13} /> Copy All
              </button>
            </div>

            <div style={{ display: "flex", minHeight: 320 }}>
              {/* Line Numbers */}
              <div
                style={{
                  background: "#0a0f1c",
                  color: "#475569",
                  padding: "16px 12px",
                  fontSize: 13,
                  fontFamily: "monospace",
                  lineHeight: "24px",
                  userSelect: "none",
                  minWidth: 40,
                  textAlign: "right",
                  borderRight: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                {editorContent.split("\n").map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>

              {/* Textarea */}
              <textarea
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                spellCheck={false}
                placeholder={`# ${activeFile}\n# Paste any ad network verification lines, authorization codes, or txt entries here\n# Format: domain, publisher-id, DIRECT|RESELLER, cert-id`}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#e2e8f0",
                  fontSize: 13,
                  lineHeight: "24px",
                  padding: 16,
                  resize: "none",
                  minHeight: 320,
                }}
              />
            </div>

            {/* Editor Footer */}
            <div
              style={{
                background: "#1e293b",
                padding: "8px 16px",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                gap: 16,
                fontSize: 12,
                color: "#64748b",
              }}
            >
              <span>{lines.length} authorized lines</span>
              <span>{editorContent.length} bytes</span>
              <span style={{ color: "#22c55e" }}>Saved to Supabase DB</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            <button
              onClick={saveFile}
              disabled={saving}
              style={{
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "11px 28px",
                fontWeight: 600,
                fontSize: 14,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {saving ? <RefreshCw size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={15} />}
              {saving ? "Saving to Database..." : `Save ${activeFile}`}
            </button>

            <button
              onClick={() => switchFile(activeFile)}
              style={{
                background: "#f1f5f9",
                color: "#475569",
                border: "none",
                borderRadius: 10,
                padding: "11px 18px",
                fontWeight: 500,
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <RefreshCw size={14} /> Reload
            </button>

            {activeFile !== "ads.txt" && (
              <button
                onClick={() => deleteFile(activeFile)}
                style={{
                  marginLeft: "auto",
                  background: "#fef2f2",
                  color: "#ef4444",
                  border: "1px solid #fecaca",
                  borderRadius: 10,
                  padding: "11px 18px",
                  fontWeight: 500,
                  fontSize: 14,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Trash2 size={14} /> Delete File
              </button>
            )}
          </div>

          {/* Parsed Line Validation View */}
          {lines.length > 0 && (
            <div style={{ marginTop: 24, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", margin: "0 0 12px" }}>
                Parsed Entries ({lines.length})
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {lines.map((line, i) => {
                  const parts = line.split(",").map((p) => p.trim());
                  const valid = parts.length >= 3;
                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 12px",
                        borderRadius: 8,
                        background: valid ? "#f0fdf4" : "#fef2f2",
                        border: `1px solid ${valid ? "#bbf7d0" : "#fecaca"}`,
                      }}
                    >
                      {valid ? <CheckCircle size={14} color="#16a34a" /> : <AlertCircle size={14} color="#dc2626" />}
                      <code style={{ fontSize: 12, color: valid ? "#15803d" : "#dc2626", flex: 1, wordBreak: "break-all" }}>
                        {line}
                      </code>
                      {parts[2] && (
                        <span
                          style={{
                            background: parts[2].toUpperCase() === "DIRECT" ? "#dbeafe" : "#fef3c7",
                            color: parts[2].toUpperCase() === "DIRECT" ? "#1d4ed8" : "#92400e",
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 999,
                          }}
                        >
                          {parts[2].toUpperCase()}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Networks Panel & Custom Network Builder */}
        <div>
          {/* Custom Network Quick-Add Form */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 14,
              overflow: "hidden",
              boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                padding: "14px 18px",
                borderBottom: "1px solid #f1f5f9",
                background: "#fafbfc",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
              }}
              onClick={() => setShowCustomNetForm(!showCustomNetForm)}
            >
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 7 }}>
                  <Sparkles size={16} color="#8b5cf6" /> Add Any Custom Network
                </h2>
                <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>
                  Add your own desired ad network entry
                </p>
              </div>
              <button
                type="button"
                style={{
                  background: showCustomNetForm ? "#e2e8f0" : "#6366f1",
                  color: showCustomNetForm ? "#334155" : "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "4px 10px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {showCustomNetForm ? "Close" : "+ New"}
              </button>
            </div>

            {showCustomNetForm && (
              <form onSubmit={handleAddCustomNetwork} style={{ padding: 16 }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                    Ad Network Domain *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. admaven.com or monetag.com"
                    value={customNetDomain}
                    onChange={(e) => setCustomNetDomain(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                    required
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                    Your Publisher / Account ID *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543 or pub-123456"
                    value={customNetPubId}
                    onChange={(e) => setCustomNetPubId(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                    required
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                      Relationship
                    </label>
                    <select
                      value={customNetType}
                      onChange={(e) => setCustomNetType(e.target.value as "DIRECT" | "RESELLER")}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                    >
                      <option value="DIRECT">DIRECT</option>
                      <option value="RESELLER">RESELLER</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                      Auth ID (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. f08c47fec0942fa0"
                      value={customNetAuthId}
                      onChange={(e) => setCustomNetAuthId(e.target.value)}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  style={{
                    width: "100%",
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "9px 16px",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Plus size={14} /> Add Line to {activeFile}
                </button>
              </form>
            )}
          </div>

          {/* Preset Networks List */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 14,
              overflow: "hidden",
              boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9", background: "#fafbfc" }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Popular Ad Networks
              </h2>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: "4px 0 0" }}>
                1-click to authorize known ad partners in {activeFile}
              </p>
            </div>

            <div style={{ maxHeight: 420, overflowY: "auto" }}>
              {PRESET_NETWORKS.map((net) => {
                const alreadyAdded = net.lines.some((l) => editorContent.includes(l.split(",")[0].trim()));
                const isExpanded = expandedNet === net.id;
                return (
                  <div key={net.id} style={{ borderBottom: "1px solid #f1f5f9", background: alreadyAdded ? "#f0fdf4" : "#fff" }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer" }}
                      onClick={() => setExpandedNet(isExpanded ? null : net.id)}
                    >
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 8,
                          background: net.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: 11,
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        {net.logo}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>{net.name}</div>
                        <div style={{ fontSize: 11, color: alreadyAdded ? "#16a34a" : "#94a3b8" }}>
                          {alreadyAdded ? "✓ Added" : `${net.lines.length} line(s)`}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {!alreadyAdded && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addNetwork(net.lines);
                            }}
                            style={{
                              background: net.color,
                              color: "#fff",
                              border: "none",
                              borderRadius: 6,
                              padding: "4px 10px",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                            }}
                          >
                            <Plus size={11} /> Add
                          </button>
                        )}
                        {isExpanded ? <ChevronUp size={14} color="#94a3b8" /> : <ChevronDown size={14} color="#94a3b8" />}
                      </div>
                    </div>
                    {isExpanded && (
                      <div style={{ padding: "0 16px 12px" }}>
                        <div style={{ background: "#f8fafc", borderRadius: 8, padding: 8 }}>
                          {net.lines.map((l, i) => (
                            <code key={i} style={{ display: "block", fontSize: 11, color: "#475569", lineHeight: "18px", wordBreak: "break-all" }}>
                              {l}
                            </code>
                          ))}
                        </div>
                        <a
                          href={net.docsUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 11,
                            color: "#6366f1",
                            marginTop: 6,
                            textDecoration: "none",
                          }}
                        >
                          <ExternalLink size={11} /> View docs
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info cards */}
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Globe size={15} color="#3b82f6" />
                <span style={{ fontWeight: 600, fontSize: 13, color: "#1e40af" }}>Live URL Integration</span>
              </div>
              <p style={{ fontSize: 12, color: "#3b82f6", margin: 0, lineHeight: 1.5 }}>
                Any TXT file saved here is instantly reachable on the web at <strong>pvstoryviewer.com/{activeFile}</strong>.
              </p>
            </div>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Shield size={15} color="#16a34a" />
                <span style={{ fontWeight: 600, fontSize: 13, color: "#15803d" }}>Database Backed</span>
              </div>
              <p style={{ fontSize: 12, color: "#16a34a", margin: 0, lineHeight: 1.5 }}>
                All records are saved directly in Supabase so your network approvals persist across every deployment and build.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Create New Custom File */}
      {showNewFileModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
          onClick={() => setShowNewFileModal(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              width: "100%",
              maxWidth: 440,
              padding: 24,
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
              Add Custom TXT File
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b" }}>
              Enter the filename required by your ad network for domain approval or verification.
            </p>

            <form onSubmit={handleCreateNewFile}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                  File Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. adsterra.txt or verification.txt"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                  autoFocus
                  required
                />
                <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, display: "block" }}>
                  Must end in .txt or .json. Will be hosted at pvstoryviewer.com/{newFileName || "your-file.txt"}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowNewFileModal(false)}
                  style={{
                    padding: "9px 16px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    background: "#fff",
                    color: "#475569",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "9px 20px",
                    borderRadius: 8,
                    border: "none",
                    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Create File Tab
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}