"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getUser, getProfile, getBatch, getBatches, getLeadsByBatch, getAllLeads,
  getTemplates, createTemplate, updateTemplate, deleteTemplate,
  updateLeadStatus, getBatchStats, getOverallStats, signOut,
  generateWALink, isValidPhone, replaceVariables
} from "@/lib/db";
import { Lead, LeadStatus, Template, Batch, User, AVAILABLE_VARIABLES } from "@/types";
import Link from "next/link";
import * as XLSX from "xlsx";

const PER_PAGE = 50;

export default function FollowupPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("all");
  const [currentBatch, setCurrentBatch] = useState<Batch | null>(null);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [templateContent, setTemplateContent] = useState("");
  const [templateName, setTemplateName] = useState("");

  const [stats, setStats] = useState({ total: 0, belum: 0, sudah: 0, group: 0, noaktif: 0 });
  const [currentFilter, setCurrentFilter] = useState<LeadStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showSaved, setShowSaved] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedBatchId) {
      loadLeads();
    }
  }, [selectedBatchId]);

  const loadData = async () => {
    try {
      const userData = await getUser();
      if (!userData) {
        window.location.href = "/login";
        return;
      }
      setUser({ id: userData.id, email: userData.email || "" });

      const profileData = await getProfile();
      setProfile(profileData);

      // Get batch from URL param
      const batchParam = searchParams.get("batch");
      if (batchParam) {
        setSelectedBatchId(batchParam);
        const batch = await getBatch(batchParam);
        setCurrentBatch(batch);
      }

      const batchesData = await getBatches();
      setBatches(batchesData);

      const templatesData = await getTemplates();
      setTemplates(templatesData);
      if (templatesData.length > 0) {
        setSelectedTemplateId(templatesData[0].id);
        setTemplateContent(templatesData[0].content);
      }

      await loadLeads();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const loadLeads = async () => {
    try {
      let leadsData: Lead[];
      if (selectedBatchId === "all") {
        leadsData = await getAllLeads();
        setCurrentBatch(null);
        setStats(await getOverallStats());
      } else {
        leadsData = await getLeadsByBatch(selectedBatchId);
        const batch = await getBatch(selectedBatchId);
        setCurrentBatch(batch);
        setStats(await getBatchStats(selectedBatchId));
      }
      setLeads(leadsData);
      setCurrentPage(1);
    } catch (e) {
      console.error(e);
    }
  };

  const showSavedBadge = () => {
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 1500);
  };

  // Variable insertion
  const insertVariable = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = templateContent.substring(0, start) + `{${variable}}` + templateContent.substring(end);
    setTemplateContent(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + variable.length + 2;
      textarea.selectionEnd = start + variable.length + 2;
    }, 0);
  };

  // Template operations
  const selectTemplate = (template: Template) => {
    setSelectedTemplateId(template.id);
    setTemplateContent(template.content);
  };

  const saveTemplate = async () => {
    if (!templateContent.trim()) return;

    if (selectedTemplateId) {
      await updateTemplate(selectedTemplateId, { content: templateContent });
    }
    showSavedBadge();
  };

  const handleCreateTemplate = async () => {
    if (!templateName.trim()) return;
    const newTemplate = await createTemplate({ name: templateName, content: "" });
    setTemplates([...templates, newTemplate]);
    setSelectedTemplateId(newTemplate.id);
    setTemplateContent("");
    setShowTemplateModal(false);
    setTemplateName("");
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplateId) return;
    await deleteTemplate(selectedTemplateId);
    const remaining = templates.filter(t => t.id !== selectedTemplateId);
    setTemplates(remaining);
    if (remaining.length > 0) {
      setSelectedTemplateId(remaining[0].id);
      setTemplateContent(remaining[0].content);
    } else {
      setSelectedTemplateId("");
      setTemplateContent("");
    }
  };

  // Status operations
  const changeStatus = async (id: string, status: LeadStatus) => {
    await updateLeadStatus(id, status);
    setLeads(leads.map(l => l.id === id ? { ...l, status } : l));
    if (selectedBatchId === "all") {
      setStats(await getOverallStats());
    } else {
      setStats(await getBatchStats(selectedBatchId));
    }
    showSavedBadge();
  };

  const markFollowed = async (id: string) => {
    const lead = leads.find(l => l.id === id);
    if (lead && lead.status === "belum") {
      await updateLeadStatus(id, "sudah");
      setLeads(leads.map(l => l.id === id ? { ...l, status: "sudah" } : l));
      if (selectedBatchId === "all") {
        setStats(await getOverallStats());
      } else {
        setStats(await getBatchStats(selectedBatchId));
      }
      showSavedBadge();
    }
  };

  // Export
  const exportStatus = () => {
    if (!leads.length) return;

    const rows: (string | undefined)[][] = [["No", "Nama", "No WhatsApp", "Kota", "Usia", "Pekerjaan", "Status", "Batch"]];
    leads.forEach((l, i) => {
      const batchName = batches.find(b => b.id === l.batch_id)?.name || "";
      rows.push([(i + 1).toString(), l.name, l.phone, l.city, l.age, l.job, l.status, batchName]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Status");
    const exportName = currentBatch?.name || "all-leads";
    XLSX.writeFile(wb, `${exportName}_status.xlsx`);
  };

  // Filter & search
  const getFilteredData = () => {
    let filtered = leads;
    if (currentFilter !== "all") {
      filtered = filtered.filter(l => l.status === currentFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        l.job.toLowerCase().includes(q)
      );
    }
    return filtered;
  };

  // Preview
  const getPreviewMessage = () => {
    if (!templateContent.trim() || leads.length === 0) return null;
    return replaceVariables(templateContent, leads[0]);
  };

  // Pagination
  const renderTable = () => {
    const filtered = getFilteredData();
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    if (currentPage > totalPages) setCurrentPage(totalPages);

    const start = (currentPage - 1) * PER_PAGE;
    const pageData = filtered.slice(start, start + PER_PAGE);

    const waIcon = (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
      </svg>
    );

    return pageData.map((lead) => {
      const hasTemplate = templateContent.trim().length > 0;
      const hasPhone = isValidPhone(lead.phone);
      const rowClass = lead.status === "sudah" ? "row-sudah" : lead.status === "noaktif" ? "row-noaktif" : "";
      const selectClass = `status-${lead.status}`;

      return (
        <tr key={lead.id} className={rowClass}>
          <td className="col-name">{lead.name}</td>
          <td className="col-phone">{lead.phone}</td>
          <td className="col-city">{lead.city || "-"}</td>
          <td className="col-age">{lead.age || "-"}</td>
          <td className="col-job">{lead.job || "-"}</td>
          <td>
            {hasTemplate && hasPhone ? (
              <a
                className="btn-followup"
                href={generateWALink(lead, templateContent)}
                target="_blank"
                onClick={() => markFollowed(lead.id)}
              >
                {waIcon} FollowUp
              </a>
            ) : (
              <span className="empty-template">{!hasPhone ? "No WA invalid" : "Isi template"}</span>
            )}
          </td>
          <td>
            <select
              className={`status-select ${selectClass}`}
              value={lead.status}
              onChange={(e) => changeStatus(lead.id, e.target.value as LeadStatus)}
            >
              <option value="belum">Belum di followup</option>
              <option value="sudah">Sudah di followup</option>
              <option value="group">Sudah masuk group</option>
              <option value="noaktif">No tidak aktif</option>
            </select>
          </td>
        </tr>
      );
    });
  };

  const renderPagination = () => {
    const filtered = getFilteredData();
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));

    if (totalPages <= 1) return <span className="page-info">{filtered.length} leads</span>;

    const pages: (number | string)[] = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);

    if (start > 1) pages.push(1, "...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) pages.push("...", totalPages);

    return (
      <>
        <button className="page-btn" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>&laquo;</button>
        {pages.map((p, i) => p === "..." ? <span key={i} className="page-info">...</span> : <button key={i} className={`page-btn ${p === currentPage ? "active" : ""}`} onClick={() => setCurrentPage(p as number)}>{p}</button>)}
        <button className="page-btn" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>&raquo;</button>
        <span className="page-info">{filtered.length} leads</span>
      </>
    );
  };

  const getFilterCount = (filter: LeadStatus | "all") => {
    if (filter === "all") return leads.length;
    return leads.filter(l => l.status === filter).length;
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/login";
  };

  if (loading) return <div className="loading-screen">Loading...</div>;

  const previewMessage = getPreviewMessage();

  return (
    <div className="app-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <Link href="/dashboard" className="navbar-back">← Dashboard</Link>
        </div>

        <div className="navbar-center">
          <h1 className="navbar-title-small">
            {currentBatch ? currentBatch.name : "Semua Leads"}
          </h1>
          <div className="navbar-stats-mini">
            <span className="mini-stat-nav">{stats.total} total</span>
            <span className="mini-stat-nav mini-orange">{stats.belum} belum</span>
          </div>
        </div>

        <div className="navbar-right">
          <div className="navbar-user" onClick={() => setShowDropdown(!showDropdown)}>
            <div className="user-avatar">{profile?.business_name?.charAt(0) || "U"}</div>
          </div>

          {showDropdown && (
            <div className="dropdown-menu">
              <Link href="/settings" className="dropdown-item">⚙️ Settings</Link>
              <button onClick={handleLogout} className="dropdown-item">🚪 Logout</button>
            </div>
          )}
        </div>
      </nav>

      {/* Main */}
      <main className="main-content">
        {/* Batch Selector */}
        <div className="batch-selector-section">
          <label>Pilih Batch:</label>
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="batch-selector"
          >
            <option value="all">-- Semua Batch --</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>{b.name} ({b.total_leads} leads)</option>
            ))}
          </select>
        </div>

        {/* Template Section */}
        <div className="template-section">
          <div className="template-header">
            <h3>💬 Template</h3>
            <div className="template-tabs">
              {templates.map((t) => (
                <button key={t.id} className={`template-tab ${selectedTemplateId === t.id ? "active" : ""}`} onClick={() => selectTemplate(t)}>{t.name}</button>
              ))}
              <button className="template-tab template-tab-add" onClick={() => setShowTemplateModal(true)}>+</button>
            </div>
          </div>

          <div className="var-buttons">
            {AVAILABLE_VARIABLES.map((v) => (
              <button key={v.key} className="var-btn" onClick={() => insertVariable(v.key)}>{v.label}</button>
            ))}
          </div>

          <textarea
            ref={textareaRef}
            className="template-textarea"
            placeholder="Ketik template..."
            value={templateContent}
            onChange={(e) => setTemplateContent(e.target.value)}
          />

          <div className="template-actions">
            <button className="btn-save-template" onClick={saveTemplate}>💾 Simpan</button>
            {selectedTemplateId && <button className="btn-delete-template" onClick={handleDeleteTemplate}>🗑️</button>}
          </div>

          {/* Preview */}
          <div className="preview-section">
            <div className="preview-label">📱 Preview:</div>
            {previewMessage ? (
              <div className="preview-bubble">
                {previewMessage}
                <div className="preview-time">{new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</div>
              </div>
            ) : <div className="preview-empty">Isi template untuk preview</div>}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-row">
          <div className="stat-mini stat-total">{stats.total}</div>
          <div className="stat-mini stat-orange">{stats.belum}</div>
          <div className="stat-mini stat-green">{stats.sudah}</div>
          <div className="stat-mini stat-blue">{stats.group}</div>
          <div className="stat-mini stat-red">{stats.noaktif}</div>
        </div>

        {/* Filter Bar */}
        <div className="filter-bar">
          {(["all", "belum", "sudah", "group", "noaktif"] as const).map((f) => (
            <button key={f} className={`filter-btn ${currentFilter === f ? "active" : ""}`} onClick={() => { setCurrentFilter(f); setCurrentPage(1); }}>
              {f === "all" ? "Semua" : f === "noaktif" ? "Tidak Aktif" : f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="filter-count">{getFilterCount(f)}</span>
            </button>
          ))}
          <input className="search-input" placeholder="🔍 Cari..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} />
          <button className="action-btn action-export-small" onClick={exportStatus}>📥 Export</button>
        </div>

        {/* Table */}
        <div className="table-wrapper">
          <div className="table-scroll">
            <table>
              <thead>
                <tr><th>Nama</th><th>No WA</th><th>Kota</th><th>Usia</th><th>Pekerjaan</th><th>FollowUp</th><th>Status</th></tr>
              </thead>
              <tbody>{renderTable()}</tbody>
            </table>
          </div>
          <div className="pagination">{renderPagination()}</div>
        </div>
      </main>

      {/* Saved Badge */}
      <div className={`saved-badge ${showSaved ? "show" : ""}`}>✓ tersimpan</div>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="modal-overlay" onClick={() => setShowTemplateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Template Baru</div>
              <button className="modal-close" onClick={() => setShowTemplateModal(false)}>✕</button>
            </div>
            <input className="modal-input" placeholder="Nama template" value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
            <div className="modal-buttons">
              <button className="action-btn action-secondary" onClick={() => setShowTemplateModal(false)}>Batal</button>
              <button className="action-btn action-primary" onClick={handleCreateTemplate}>Buat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}