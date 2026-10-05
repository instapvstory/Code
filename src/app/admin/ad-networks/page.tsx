"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/admin/AdminAuthProvider";
import { useRouter } from "next/navigation";
import {
  FileText, Plus, Save, RefreshCw, CheckCircle,
  AlertCircle, Copy, ExternalLink, ChevronDown, ChevronUp,
  Globe, Shield, Info, Trash2, Upload, FilePlus, Sparkles,
  HelpCircle, Check, Search, Wand2, Download, Eye, Zap
} from "lucide-react";

interface PresetNetwork {
  id: string;
  name: string;
  category: string;
  color: string;
  logo: string;
  docsUrl: string;
  sampleId: string;
  hint: string;
  format: (id: string) => string;
}

const PRESET_NETWORKS: PresetNetwork[] = [
  {
    id: "adsense",
    name: "Google AdSense",
    category: "Display / Banner",
    color: "#4285F4",
    logo: "G",
    sampleId: "pub-1602093984257648",
    hint: "Your numeric publisher ID (e.g. pub-1602093984257648)",
    docsUrl: "https://support.google.com/adsense/answer/7532444",
    format: (id) => `google.com, ${id.startsWith("pub-") ? id : `pub-${id}`}, DIRECT, f08c47fec0942fa0`,
  },
  {
    id: "adsterra",
    name: "Adsterra",
    category: "Popunder / Banner",
    color: "#00B96B",
    logo: "A",
    sampleId: "4629628",
    hint: "Your numeric Adsterra Publisher ID",
    docsUrl: "https://publishers.adsterra.com/",
    format: (id) => `adsterra.com, ${id}, DIRECT`,
  },
  {
    id: "revcontent",
    name: "RevBid",
    category: "Header Bidding / Native",
    color: "#0284c7",
    logo: "RB",
    sampleId: "21983",
    hint: "RevBid Publisher / Account ID (e.g. 21983)",
    docsUrl: "https://revbid.net/",
    format: (id) => `revbid.net, ${id}, DIRECT`,
  },
  {
    id: "mgid",
    name: "MGID",
    category: "Native / Push",
    color: "#E84B3A",
    logo: "M",
    sampleId: "1234567",
    hint: "Your MGID publisher account number",
    docsUrl: "https://help.mgid.com/",
    format: (id) => `mgid.com, ${id}, DIRECT`,
  },
  {
    id: "propeller",
    name: "PropellerAds",
    category: "Push / Pop / Interstitial",
    color: "#FF6B35",
    logo: "P",
    sampleId: "123456",
    hint: "Publisher ID shown on Propeller dashboard",
    docsUrl: "https://publishers.propellerads.com/",
    format: (id) => `propellerads.com, ${id}, DIRECT`,
  },
  {
    id: "monetag",
    name: "Monetag",
    category: "Multi-Format",
    color: "#6366f1",
    logo: "Mo",
    sampleId: "987654",
    hint: "Publisher ID from Monetag",
    docsUrl: "https://monetag.com/",
    format: (id) => `monetag.com, ${id}, DIRECT`,
  },
  {
    id: "medianet",
    name: "Media.net",
    category: "Search / Display",
    color: "#0066CC",
    logo: "MN",
    sampleId: "YOUR_SITEID",
    hint: "Media.net Account ID or Site ID",
    docsUrl: "https://www.media.net/",
    format: (id) => `media.net, ${id}, DIRECT`,
  },
  {
    id: "infolinks",
    name: "Infolinks",
    category: "In-Text / Banner",
    color: "#FF5500",
    logo: "IL",
    sampleId: "YOUR_ID",
    hint: "Publisher ID from Infolinks",
    docsUrl: "https://www.infolinks.com/",
    format: (id) => `infolinks.com, ${id}, DIRECT`,
  },
  {
    id: "amazon",
    name: "Amazon Publisher Services",
    category: "Header Bidding",
    color: "#FF9900",
    logo: "Az",
    sampleId: "3916270810",
    hint: "Publisher ID from Amazon APS",
    docsUrl: "https://advertising.amazon.com/",
    format: (id) => `amazon-adsystem.com, ${id}, DIRECT`,
  },
  {
    id: "ezoic",
    name: "Ezoic",
    category: "AI Monetization",
    color: "#7C3AED",
    logo: "Ez",
    sampleId: "YOUR_ID",
    hint: "Ezoic Publisher ID",
    docsUrl: "https://www.ezoic.com/",
    format: (id) => `ezoic.com, ${id}, DIRECT`,
  },
  {
    id: "taboola",
    name: "Taboola",
    category: "Native Recommendations",
    color: "#1F3B8C",
    logo: "T",
    sampleId: "YOUR_ID",
    hint: "Taboola Publisher Account ID",
    docsUrl: "https://www.taboola.com/",
    format: (id) => `taboola.com, ${id}, DIRECT`,
  },
  {
    id: "admaven",
    name: "AdMaven",
    category: "Pop / Push / Banner",
    color: "#059669",
    logo: "AM",
    sampleId: "YOUR_ID",
    hint: "AdMaven account ID",
    docsUrl: "https://ad-maven.com/",
    format: (id) => `ad-maven.com, ${id}, DIRECT`,
  },
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
  const [msg, setMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [origin, setOrigin] = useState("");

  // Mode: "easy" (friendly guided cards) vs "advanced" (raw text editor)
  const [activeTab, setActiveTab] = useState<"easy" | "advanced">("easy");

  // Search filter for presets
  const [presetSearch, setPresetSearch] = useState("");

  // Quick 1-click Preset modal / prompt
  const [selectedPreset, setSelectedPreset] = useState<PresetNetwork | null>(null);
  const [presetInputId, setPresetInputId] = useState("");

  // Smart Paste Box (for complete code or whole lines provided by ad network)
  const [smartPasteText, setSmartPasteText] = useState("");

  // Modal / Form state for adding custom file
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState("");

  // Custom network form state (with simple helper tooltips)
  const [customNetDomain, setCustomNetDomain] = useState("");
  const [customNetPubId, setCustomNetPubId] = useState("");
  const [customNetType, setCustomNetType] = useState<"DIRECT" | "RESELLER">("DIRECT");
  const [customNetAuthId, setCustomNetAuthId] = useState("");
  const [showDirectHelp, setShowDirectHelp] = useState(false);

  // Live URL Verifier
  const [verifyingUrl, setVerifyingUrl] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ ok: boolean; status: number; preview: string } | null>(null);

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
    setVerifyResult(null);
    const existing = files.find((f) => f.name === fileName);
    if (existing && existing.content !== undefined) {
      setEditorContent(existing.content);
    } else {
      const res = await fetch(`/api/admin/ad-networks?file=${encodeURIComponent(fileName)}`);
      const data = await res.json();
      if (data.success) setEditorContent(data.content || "");
    }
  };

  const saveFile = async (customContent?: string) => {
    const toSave = customContent !== undefined ? customContent : editorContent;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/ad-networks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: activeFile, content: toSave }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({
          type: "success",
          text: `🎉 Saved successfully! Your ${activeFile} is live with ${data.lineCount} entries.`
        });
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
    if (!confirm(`Are you sure you want to permanently delete "${fileToDelete}"?`)) return;
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

  // Add line to editor and auto-save option
  const appendLines = async (linesToAdd: string[], feedbackName: string) => {
    const existing = editorContent.trim();
    const existingLinesSet = new Set(
      existing.toLowerCase().split("\n").map((l) => l.trim())
    );

    // Filter duplicates: skip identical lines, but keep all unique partner/reseller entries
    const cleanLines = linesToAdd
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .filter((l) => !existingLinesSet.has(l.toLowerCase()));

    if (cleanLines.length === 0) {
      setMsg({
        type: "info",
        text: `Network "${feedbackName}" entries are already present in ${activeFile}.`
      });
      return;
    }

    const newContent = existing ? `${existing}\n${cleanLines.join("\n")}` : cleanLines.join("\n");
    setEditorContent(newContent);
    // Auto-save so user doesn't forget
    await saveFile(newContent);
  };

  // Quick Preset Add
  const handleConfirmPreset = async () => {
    if (!selectedPreset) return;
    const id = presetInputId.trim() || selectedPreset.sampleId;
    const line = selectedPreset.format(id);
    await appendLines([line], selectedPreset.name);
    setSelectedPreset(null);
    setPresetInputId("");
  };

  // Smart Paste Handler (Accepts full lines from any network email/dashboard)
  const handleSmartPaste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smartPasteText.trim()) return;

    const raw = smartPasteText.trim();
    const rawLines = raw.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);

    const validLines: string[] = [];
    rawLines.forEach((line) => {
      // Check if it's already an ads.txt format line (contains commas)
      if (line.includes(",")) {
        validLines.push(line);
      } else if (line.startsWith("pub-") || /^\d+$/.test(line)) {
        // Just an ID pasted
        validLines.push(`google.com, ${line}, DIRECT, f08c47fec0942fa0`);
      } else {
        // Plain text entry
        validLines.push(line);
      }
    });

    if (validLines.length > 0) {
      await appendLines(validLines, "Pasted Content");
      setSmartPasteText("");
    } else {
      setMsg({ type: "error", text: "Could not detect valid lines. Please paste the line from your network." });
    }
  };

  // Newbie-Friendly Custom Network Form
  const handleAddCustomNetwork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customNetDomain.trim()) {
      setMsg({ type: "error", text: "Please enter the ad network domain (e.g. revcontent.com)" });
      return;
    }

    const domain = customNetDomain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "");
    const pubId = customNetPubId.trim() || "0";
    const type = customNetType; // DIRECT or RESELLER
    const authId = customNetAuthId.trim();

    const formattedLine = authId
      ? `${domain}, ${pubId}, ${type}, ${authId}`
      : `${domain}, ${pubId}, ${type}`;

    await appendLines([formattedLine], domain);
    setCustomNetDomain("");
    setCustomNetPubId("");
    setCustomNetAuthId("");
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
    const initialContent = `# ${name}\n# Verification file for ad network approval\n`;
    setEditorContent(initialContent);
    await saveFile(initialContent);
  };

  // Handle local .txt file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = (event.target?.result as string) || "";
      const uploadFileName = file.name.toLowerCase();

      if (confirm(`Do you want to create a new file named "${file.name}"? (Click "Cancel" to append into current "${activeFile}")`)) {
        setActiveFile(uploadFileName);
        setEditorContent(text);
        await saveFile(text);
      } else {
        const combined = editorContent ? `${editorContent}\n${text}` : text;
        setEditorContent(combined);
        await saveFile(combined);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Test / Verify URL Live
  const verifyLiveUrl = async () => {
    setVerifyingUrl(true);
    setVerifyResult(null);
    try {
      const url = `/${activeFile}`;
      const res = await fetch(url, { cache: "no-store" });
      const text = await res.text();
      setVerifyResult({
        ok: res.ok,
        status: res.status,
        preview: text.slice(0, 200),
      });
    } catch {
      setVerifyResult({
        ok: false,
        status: 500,
        preview: "Failed to connect to public route",
      });
    } finally {
      setVerifyingUrl(false);
    }
  };

  // Remove a specific line from editor
  const handleRemoveLine = async (lineToRemove: string) => {
    const remaining = editorContent
      .split("\n")
      .filter((l) => l.trim() !== lineToRemove.trim())
      .join("\n");
    setEditorContent(remaining);
    await saveFile(remaining);
  };

  const copyContent = () => {
    navigator.clipboard.writeText(editorContent);
    setMsg({ type: "success", text: "Copied full file to clipboard!" });
  };

  const downloadFile = () => {
    const blob = new Blob([editorContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = activeFile;
    a.click();
    URL.revokeObjectURL(url);
  };

  const parsedLines = editorContent
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  const filteredPresets = PRESET_NETWORKS.filter(
    (p) =>
      p.name.toLowerCase().includes(presetSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(presetSearch.toLowerCase())
  );

  if (loading || loadingFiles) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <RefreshCw size={28} style={{ animation: "spin 1s linear infinite", color: "#6366f1" }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1260, margin: "0 auto" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        textarea { font-family: 'Fira Code', 'Cascadia Code', monospace !important; }
        .preset-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.08); }
        .btn-tab { transition: all 0.2s ease; }
      `}</style>

      {/* TOP HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }}>
              <FileText size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Ad Networks &amp; Domain Verification
              </h1>
              <p style={{ color: "#64748b", marginTop: 4, fontSize: 13, margin: 0 }}>
                Add authorization codes &amp; TXT files (ads.txt, revbid.txt, etc.) so ad networks approve your website instantly.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Tools */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.json"
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Upload a .txt file from your computer"
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              background: "#fff",
              color: "#334155",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Upload size={14} /> Upload TXT File
          </button>

          <button
            onClick={() => setShowNewFileModal(true)}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid #e0e7ff",
              background: "#eef2ff",
              color: "#4f46e5",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <FilePlus size={14} /> + New Verification File
          </button>

          <button
            onClick={verifyLiveUrl}
            disabled={verifyingUrl}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid #bbf7d0",
              background: "#f0fdf4",
              color: "#16a34a",
              fontWeight: 600,
              fontSize: 13,
              cursor: verifyingUrl ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Eye size={14} /> {verifyingUrl ? "Testing URL..." : `Test Live URL`}
          </button>
        </div>
      </div>

      {/* URL Verification Banner (if checked) */}
      {verifyResult && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            marginBottom: 16,
            background: verifyResult.ok ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${verifyResult.ok ? "#86efac" : "#fca5a5"}`,
            color: verifyResult.ok ? "#166534" : "#991b1b",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {verifyResult.ok ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>
              <strong>{verifyResult.ok ? "HTTP 200 OK — Live & Accessible!" : `Error (${verifyResult.status})`}</strong>{" "}
              Ad network bots can reach: <code>{origin}/{activeFile}</code>
            </span>
          </div>
          <a
            href={`${origin}/${activeFile}`}
            target="_blank"
            rel="noreferrer"
            style={{ fontWeight: 700, color: verifyResult.ok ? "#15803d" : "#dc2626", textDecoration: "underline" }}
          >
            Open in new tab &rarr;
          </a>
        </div>
      )}

      {/* Notifications */}
      {msg && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            marginBottom: 16,
            background: msg.type === "success" ? "#f0fdf4" : msg.type === "error" ? "#fef2f2" : "#eff6ff",
            border: `1px solid ${msg.type === "success" ? "#bbf7d0" : msg.type === "error" ? "#fecaca" : "#bfdbfe"}`,
            color: msg.type === "success" ? "#16a34a" : msg.type === "error" ? "#dc2626" : "#2563eb",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 13,
          }}
        >
          {msg.type === "success" ? <CheckCircle size={16} /> : msg.type === "error" ? <AlertCircle size={16} /> : <Info size={16} />}
          {msg.text}
        </div>
      )}

      {/* FILE SELECTION TABS & URL BAR */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 16px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          {/* File Pills */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, overflowX: "auto" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginRight: 4 }}>
              Active File:
            </span>
            {files.map((f) => (
              <button
                key={f.name}
                onClick={() => switchFile(f.name)}
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 13,
                  background: activeFile === f.name ? "linear-gradient(135deg, #6366f1, #4f46e5)" : "#f1f5f9",
                  color: activeFile === f.name ? "#fff" : "#475569",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: activeFile === f.name ? "0 2px 6px rgba(99,102,241,0.3)" : "none",
                }}
              >
                <FileText size={13} />
                {f.name}
                <span
                  style={{
                    background: activeFile === f.name ? "rgba(255,255,255,0.25)" : "#e2e8f0",
                    color: activeFile === f.name ? "#fff" : "#64748b",
                    borderRadius: 999,
                    padding: "1px 6px",
                    fontSize: 11,
                  }}
                >
                  {f.lineCount}
                </span>
              </button>
            ))}
          </div>

          {/* Live Link Button */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <a
              href={`${origin}/${activeFile}`}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: 12,
                color: "#4f46e5",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 5,
                background: "#f5f3ff",
                padding: "6px 12px",
                borderRadius: 6,
                textDecoration: "none",
                border: "1px solid #ddd6fe",
              }}
            >
              <ExternalLink size={13} /> Live Link: /{activeFile}
            </a>

            {activeFile !== "ads.txt" && (
              <button
                onClick={() => deleteFile(activeFile)}
                title="Delete this file"
                style={{
                  background: "#fee2e2",
                  color: "#ef4444",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 10px",
                  fontSize: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontWeight: 600,
                }}
              >
                <Trash2 size={13} /> Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MODE TOGGLE: Simple Mode (Newbies) vs Advanced Editor */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 6, background: "#f1f5f9", padding: 4, borderRadius: 10 }}>
          <button
            onClick={() => setActiveTab("easy")}
            style={{
              padding: "7px 18px",
              borderRadius: 8,
              border: "none",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              background: activeTab === "easy" ? "#fff" : "transparent",
              color: activeTab === "easy" ? "#4f46e5" : "#64748b",
              boxShadow: activeTab === "easy" ? "0 2px 4px rgba(0,0,0,0.06)" : "none",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Sparkles size={14} color={activeTab === "easy" ? "#6366f1" : "#64748b"} />
            Easy Setup (Recommended for Newbies)
          </button>
          <button
            onClick={() => setActiveTab("advanced")}
            style={{
              padding: "7px 18px",
              borderRadius: 8,
              border: "none",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              background: activeTab === "advanced" ? "#fff" : "transparent",
              color: activeTab === "advanced" ? "#4f46e5" : "#64748b",
              boxShadow: activeTab === "advanced" ? "0 2px 4px rgba(0,0,0,0.06)" : "none",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <FileText size={14} />
            Raw Code &amp; TXT Editor
          </button>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={copyContent}
            style={{
              padding: "6px 12px",
              background: "#fff",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              color: "#475569",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Copy size={13} /> Copy All
          </button>
          <button
            onClick={downloadFile}
            style={{
              padding: "6px 12px",
              background: "#fff",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              color: "#475569",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Download size={13} /> Download
          </button>
        </div>
      </div>

      {/* =============================================================== */}
      {/* TAB 1: EASY SETUP FOR NEWBIES (No confusing tech jargon)         */}
      {/* =============================================================== */}
      {activeTab === "easy" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* SECTION 1: SMART PASTE WIZARD */}
          <div
            style={{
              background: "linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)",
              border: "1.5px solid #bfdbfe",
              borderRadius: 14,
              padding: 20,
              boxShadow: "0 2px 10px rgba(59,130,246,0.06)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                <Wand2 size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e3a8a" }}>
                  Option 1: Quick Paste Any Code Given by Your Ad Network
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: "#3b82f6" }}>
                  Did the ad network send you an email or verification snippet? Just paste it here — we format and save it for you!
                </p>
              </div>
            </div>

            <form onSubmit={handleSmartPaste} style={{ marginTop: 14 }}>
              <textarea
                value={smartPasteText}
                onChange={(e) => setSmartPasteText(e.target.value)}
                placeholder="Paste the line(s) here... (e.g. revbid.com, 987654, DIRECT or google.com, pub-1602093984257648, DIRECT, f08c47fec0942fa0)"
                rows={3}
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                  background: "#fff",
                }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                <button
                  type="submit"
                  disabled={!smartPasteText.trim()}
                  style={{
                    padding: "9px 20px",
                    borderRadius: 8,
                    border: "none",
                    background: smartPasteText.trim() ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "#cbd5e1",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: smartPasteText.trim() ? "pointer" : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    boxShadow: smartPasteText.trim() ? "0 2px 8px rgba(37,99,235,0.3)" : "none",
                  }}
                >
                  <Plus size={15} /> Add to {activeFile} &amp; Save
                </button>
              </div>
            </form>
          </div>

          {/* SECTION 2: 1-CLICK POPULAR AD NETWORKS */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                  <Zap size={18} color="#eab308" />
                  Option 2: 1-Click Popular Networks (Google, Adsterra, RevBid, etc.)
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
                  Select your network below, enter your Publisher/Account ID, and click Add.
                </p>
              </div>

              {/* Search box for presets */}
              <div style={{ position: "relative", width: 220 }}>
                <Search size={14} color="#94a3b8" style={{ position: "absolute", left: 10, top: 10 }} />
                <input
                  type="text"
                  placeholder="Search network..."
                  value={presetSearch}
                  onChange={(e) => setPresetSearch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "7px 10px 7px 32px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 12,
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Grid of Preset Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
              {filteredPresets.map((net) => {
                // Accurate detection per network:
                const isAdded = editorContent.split("\n").some((line) => {
                  const cleanLine = line.split("#")[0].trim().toLowerCase();
                  if (!cleanLine) return false;

                  // RevBid check: matches revbid.net, DIRECT or managerdomain=revbid.net
                  if (net.id === "revcontent" || net.id === "revbid") {
                    if (cleanLine.includes("managerdomain=revbid.net") || cleanLine.startsWith("revbid.net")) {
                      return cleanLine.includes("direct") || cleanLine.includes("managerdomain=");
                    }
                    return false;
                  }

                  // Google AdSense check: matches google.com, DIRECT with user pub-ID
                  if (net.id === "adsense") {
                    if (!cleanLine.startsWith("google.com")) return false;
                    const parts = cleanLine.split(",").map((p) => p.trim());
                    return parts[0] === "google.com" && parts[2] === "direct" && parts[1].includes("1602093984257648");
                  }

                  // Media.net check: RevBid syndication contains a sub-partner line "media.net, 8CU3M1HM4, DIRECT".
                  // Only mark Media.net active if user added their own direct account (not RevBid's 8CU3M1HM4 partner)
                  if (net.id === "medianet") {
                    if (!cleanLine.startsWith("media.net")) return false;
                    const parts = cleanLine.split(",").map((p) => p.trim());
                    return parts[0] === "media.net" && parts[2] === "direct" && parts[1] !== "8cu3m1hm4";
                  }

                  // General check for all other networks: must match domain with DIRECT relationship
                  const domainToCheck = net.format("TEST").split(",")[0].trim().toLowerCase();
                  if (!cleanLine.includes(",")) return false;
                  const parts = cleanLine.split(",").map((p) => p.trim());
                  return parts[0] === domainToCheck && parts[2] === "direct";
                });

                return (
                  <div
                    key={net.id}
                    className="preset-card"
                    style={{
                      border: isAdded ? "1.5px solid #86efac" : "1px solid #e2e8f0",
                      background: isAdded ? "#f0fdf4" : "#fafbfc",
                      borderRadius: 12,
                      padding: 14,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: net.color,
                            color: "#fff",
                            fontWeight: 800,
                            fontSize: 12,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {net.logo}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {net.name}
                          </div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>{net.category}</div>
                        </div>
                      </div>

                      <div style={{ fontSize: 11, color: "#64748b", margin: "6px 0 10px", lineHeight: 1.4 }}>
                        {net.hint}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid #f1f5f9" }}>
                      {isAdded ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#16a34a", fontSize: 12, fontWeight: 700 }}>
                          <Check size={14} /> Active in {activeFile}
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedPreset(net);
                            setPresetInputId(net.sampleId.startsWith("YOUR") ? "" : net.sampleId);
                          }}
                          style={{
                            background: net.color,
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
                            padding: "5px 12px",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Plus size={13} /> Add Network
                        </button>
                      )}

                      <a
                        href={net.docsUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: 11, color: "#6366f1", textDecoration: "none", display: "flex", alignItems: "center", gap: 3 }}
                      >
                        Help <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: SIMPLE CUSTOM NETWORK FORM (WITH DIRECT/RESELLER EXPLAINED) */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 20 }}>
            <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
              <Plus size={18} color="#6366f1" />
              Option 3: Add Any Other Custom Network Manually
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b" }}>
              Have an ad network not listed above? Fill in these 2 fields and we’ll format it correctly.
            </p>

            <form onSubmit={handleAddCustomNetwork}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                {/* Network Domain */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    1. Network Website / Domain *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. revbid.com or ad-maven.com"
                    value={customNetDomain}
                    onChange={(e) => setCustomNetDomain(e.target.value)}
                    required
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                  />
                  <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 3, display: "block" }}>
                    The website of the ad company.
                  </span>
                </div>

                {/* Publisher ID */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    2. Your Account / Publisher ID *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 4629628 or pub-123456"
                    value={customNetPubId}
                    onChange={(e) => setCustomNetPubId(e.target.value)}
                    required
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                  />
                  <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 3, display: "block" }}>
                    Your ID in their dashboard.
                  </span>
                </div>

                {/* Account Type with EXPLANATION */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
                      3. Account Type
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowDirectHelp(!showDirectHelp)}
                      style={{ background: "none", border: "none", color: "#6366f1", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}
                    >
                      <HelpCircle size={12} /> What is this?
                    </button>
                  </div>
                  <select
                    value={customNetType}
                    onChange={(e) => setCustomNetType(e.target.value as "DIRECT" | "RESELLER")}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box", background: "#fff" }}
                  >
                    <option value="DIRECT">DIRECT (You signed up directly with them — 99% of cases)</option>
                    <option value="RESELLER">RESELLER (A third-party manages your ads)</option>
                  </select>
                </div>
              </div>

              {/* Explainer Box if Newbie is confused */}
              {showDirectHelp && (
                <div style={{ marginTop: 12, padding: 12, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, color: "#475569" }}>
                  <strong>💡 Plain English Guide:</strong>
                  <ul style={{ margin: "6px 0 0", paddingLeft: 18, lineHeight: 1.6 }}>
                    <li><strong>DIRECT:</strong> Choose this if you created an account directly on their website and you control the account yourself. This is what you should choose almost always.</li>
                    <li><strong>RESELLER:</strong> Only choose this if an ad agency or intermediary company controls the account on your behalf.</li>
                  </ul>
                </div>
              )}

              <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="submit"
                  style={{
                    padding: "9px 24px",
                    borderRadius: 8,
                    border: "none",
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    boxShadow: "0 2px 8px rgba(16,185,129,0.25)",
                  }}
                >
                  <Plus size={15} /> Add Custom Network &amp; Save
                </button>
              </div>
            </form>
          </div>

          {/* SECTION 4: CURRENTLY AUTHORIZED AD NETWORKS TABLE (Easy View) */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                  Authorized Entries in {activeFile} ({parsedLines.length})
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
                  These networks can show ads and pay you. You can delete any line at any time.
                </p>
              </div>
              <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 700, background: "#f0fdf4", padding: "4px 10px", borderRadius: 999, border: "1px solid #bbf7d0" }}>
                ✓ Synced to Database
              </span>
            </div>

            {parsedLines.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 10px", color: "#94a3b8", fontSize: 13 }}>
                No ad networks added yet. Use the options above to add your first network!
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {parsedLines.map((line, idx) => {
                  const parts = line.split(",").map((p) => p.trim());
                  const domain = parts[0] || "";
                  const pubId = parts[1] || "";
                  const type = parts[2] || "DIRECT";

                  return (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: 10,
                        gap: 12,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
                        <span style={{ fontWeight: 700, color: "#0f172a", fontSize: 13 }}>{domain}</span>
                        <code style={{ fontSize: 12, color: "#475569", background: "#e2e8f0", padding: "2px 8px", borderRadius: 4 }}>
                          {pubId}
                        </code>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 999,
                            background: type.toUpperCase() === "DIRECT" ? "#dbeafe" : "#fef3c7",
                            color: type.toUpperCase() === "DIRECT" ? "#1d4ed8" : "#92400e",
                          }}
                        >
                          {type.toUpperCase()}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(line);
                            setMsg({ type: "success", text: `Copied line: ${line}` });
                          }}
                          title="Copy line"
                          style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 4 }}
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          onClick={() => handleRemoveLine(line)}
                          title="Remove from file"
                          style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 4 }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* TAB 2: ADVANCED CODE & TXT EDITOR                                */}
      {/* =============================================================== */}
      {activeTab === "advanced" && (
        <div>
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
                Editing <strong>{activeFile}</strong> directly. Each line is served directly to crawlers at <code>{origin}/{activeFile}</code>.
              </span>
            </div>
            <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>
              Changes auto-sync to Supabase upon clicking Save
            </span>
          </div>

          {/* Dark Code Editor */}
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

            <div style={{ display: "flex", minHeight: 380 }}>
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
                placeholder={`# ${activeFile}\n# Paste verification lines, hashes, or domain txt records here`}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#e2e8f0",
                  fontSize: 13,
                  lineHeight: "24px",
                  padding: 16,
                  resize: "vertical",
                  minHeight: 380,
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
              <span>{parsedLines.length} active entries</span>
              <span>{editorContent.length} bytes</span>
              <span style={{ color: "#22c55e" }}>Saved to Supabase DB</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            <button
              onClick={() => saveFile()}
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
          </div>
        </div>
      )}

      {/* MODAL 1: PRESET NETWORK INPUT MODAL */}
      {selectedPreset && (
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
          onClick={() => setSelectedPreset(null)}
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
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: selectedPreset.color,
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {selectedPreset.logo}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a" }}>
                  Add {selectedPreset.name}
                </h3>
                <span style={{ fontSize: 12, color: "#64748b" }}>{selectedPreset.category}</span>
              </div>
            </div>

            <p style={{ fontSize: 13, color: "#475569", margin: "0 0 16px" }}>
              {selectedPreset.hint}
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                Your {selectedPreset.name} Account / Publisher ID:
              </label>
              <input
                type="text"
                placeholder={selectedPreset.sampleId}
                value={presetInputId}
                onChange={(e) => setPresetInputId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
                autoFocus
              />
            </div>

            <div style={{ background: "#f8fafc", padding: 10, borderRadius: 8, marginBottom: 16, border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 2 }}>Will automatically generate:</span>
              <code style={{ fontSize: 11, color: "#4f46e5", wordBreak: "break-all" }}>
                {selectedPreset.format(presetInputId || selectedPreset.sampleId)}
              </code>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                onClick={() => setSelectedPreset(null)}
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
                type="button"
                onClick={handleConfirmPreset}
                style={{
                  padding: "9px 20px",
                  borderRadius: 8,
                  border: "none",
                  background: selectedPreset.color,
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Add &amp; Save Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE NEW CUSTOM FILE */}
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
              Create New Verification File
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b" }}>
              Enter the exact filename required by your ad network (e.g. <code>revbid.txt</code>, <code>adsterra-verify.txt</code>).
            </p>

            <form onSubmit={handleCreateNewFile}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                  File Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. revbid.txt or verify.txt"
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
                  Will be immediately accessible to ad crawlers at {origin}/{newFileName || "your-file.txt"}
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
                  Create &amp; Open
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}