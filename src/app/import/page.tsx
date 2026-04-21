"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import * as XLSX from "xlsx";
import { getUser, getProfile, getTemplates, createBatch, createLeads, signOut, findColumns } from "@/lib/db";
import { Template, User, Lead, LeadStatus } from "@/types";
import Link from "next/link";

function ImportContent() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  const [fileName, setFileName] = useState("");
  const [batchName, setBatchName] = useState("");
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [colMap, setColMap] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [dragover, setDragover] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

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

      const templatesData = await getTemplates();
      setTemplates(templatesData);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as any[];

        if (json.length < 2) {
          alert("File kosong!");
          return;
        }

        const headers = json[0];
        const map = findColumns(headers);
        setColMap(map);
        setPreviewData(json.slice(1, 11)); // Preview 10 rows
        setFileName(file.name);
        setBatchName(file.name.replace(/\.[^.]+$/, "")); // Remove extension
      } catch (err: any) {
        alert("Gagal membaca file: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (!batchName.trim()) {
      alert("Nama batch harus diisi");
      return;
    }

    setImporting(true);

    try {
      // Read file again for full data
      const fileInput = fileInputRef.current;
      if (!fileInput?.files?.length) return;

      const file = fileInput.files[0];
      const reader = new FileReader();

      reader.onload = async (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as any[];

        // Create batch
        const batch = await createBatch(batchName, file.name);

        // Create leads
        const leads: Partial<Lead>[] = [];
        for (let i = 1; i < json.length; i++) {
          const row = json[i];
          const name = (row[colMap.name] || "").toString().trim();
          const phone = (row[colMap.phone] || "").toString().trim();
          const city = (row[colMap.city] || "").toString().trim();
          const age = (row[colMap.age] || "").toString().trim();
          const job = (row[colMap.job] || "").toString().trim();

          if (!name && !phone) continue;

          leads.push({ name, phone, city, age, job, status: "belum" });
        }

        await createLeads(batch.id, leads);

        setImporting(false);
        window.location.href = `/followup?batch=${batch.id}`;
      };

      reader.readAsArrayBuffer(file);
    } catch (err: any) {
      alert("Gagal import: " + err.message);
      setImporting(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/login";
  };

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <div className="app-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <Link href="/dashboard" className="navbar-back">← Dashboard</Link>
        </div>

        <h1 className="navbar-title-center">Import Data</h1>

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
        {/* Upload Zone */}
        <div
          className={`upload-zone ${dragover ? "dragover" : ""}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
          onDragLeave={() => setDragover(false)}
          onDrop={(e) => { e.preventDefault(); setDragover(false); if (e.dataTransfer.files.length) processFile(e.dataTransfer.files[0]); }}
        >
          <span className="upload-icon">📊</span>
          <div className="upload-title">Upload File Excel (.xlsx)</div>
          <div className="upload-sub">Drag & drop atau klik untuk pilih file</div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: "none" }}
            onChange={(e) => { if (e.target.files?.length) processFile(e.target.files[0]); }}
          />
        </div>

        {/* Preview & Batch Name */}
        {previewData.length > 0 && (
          <>
            {/* Batch Name */}
            <div className="batch-name-section">
              <label>Nama Batch:</label>
              <input
                type="text"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                className="batch-name-input"
                placeholder="Nama batch untuk data ini"
              />
              <p className="batch-name-hint">Nama file: {fileName}</p>
            </div>

            {/* Column Detection */}
            <div className="column-detection">
              <h3>Kolom Terdeteksi:</h3>
              <div className="detected-columns">
                <span className="col-badge col-name">Nama: kolom {colMap?.name}</span>
                <span className="col-badge col-phone">Telepon: kolom {colMap?.phone}</span>
                <span className="col-badge col-city">Kota: kolom {colMap?.city}</span>
                <span className="col-badge col-age">Usia: kolom {colMap?.age}</span>
                <span className="col-badge col-job">Pekerjaan: kolom {colMap?.job}</span>
              </div>
            </div>

            {/* Preview Table */}
            <div className="preview-table-section">
              <h3>Preview Data (10 baris pertama)</h3>
              <div className="preview-table-wrapper">
                <table className="preview-table">
                  <thead>
                    <tr>
                      <th>Nama</th>
                      <th>Telepon</th>
                      <th>Kota</th>
                      <th>Usia</th>
                      <th>Pekerjaan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, i) => (
                      <tr key={i}>
                        <td>{(row[colMap?.name] || "").toString().trim() || "-"}</td>
                        <td>{(row[colMap?.phone] || "").toString().trim() || "-"}</td>
                        <td>{(row[colMap?.city] || "").toString().trim() || "-"}</td>
                        <td>{(row[colMap?.age] || "").toString().trim() || "-"}</td>
                        <td>{(row[colMap?.job] || "").toString().trim() || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Import Button */}
            <div className="import-actions">
              <button
                onClick={handleImport}
                disabled={importing || !batchName.trim()}
                className="action-btn action-primary action-large"
              >
                {importing ? "Importing..." : "✓ Import Data"}
              </button>
              <button
                onClick={() => { setPreviewData([]); setFileName(""); setBatchName(""); }}
                className="action-btn action-secondary"
              >
                ✕ Batal
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function ImportPage() {
  return (
    <Suspense fallback={<div className="loading-screen">Loading...</div>}>
      <ImportContent />
    </Suspense>
  );
}