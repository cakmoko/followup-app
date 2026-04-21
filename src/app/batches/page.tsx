"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser, getProfile, getBatches, getBatchStats, deleteBatch, signOut } from "@/lib/db";
import { Batch, User } from "@/types";
import Link from "next/link";

export default function BatchesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchStats, setBatchStats] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
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

      const batchesData = await getBatches();
      setBatches(batchesData);

      const statsMap: Record<string, any> = {};
      for (const batch of batchesData) {
        statsMap[batch.id] = await getBatchStats(batch.id);
      }
      setBatchStats(statsMap);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleDelete = async (batchId: string, batchName: string) => {
    if (!confirm(`Hapus batch "${batchName}"?\nSemua leads dalam batch ini akan dihapus.`)) return;

    await deleteBatch(batchId);
    loadData();
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/login";
  };

  const getProgressPercentage = (batchId: string) => {
    const s = batchStats[batchId];
    if (!s || s.total === 0) return 0;
    const done = s.sudah + s.group;
    return Math.round((done / s.total) * 100);
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

        <h1 className="navbar-title-center">Daftar Batch</h1>

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
        <div className="batches-header">
          <Link href="/import" className="action-btn action-primary">+ Import Batch Baru</Link>
        </div>

        {batches.length === 0 ? (
          <div className="empty-state-full">
            <div className="empty-icon">📋</div>
            <p>Belum ada batch data</p>
            <Link href="/import" className="action-btn action-primary">Import Data Pertama</Link>
          </div>
        ) : (
          <div className="batch-list-full">
            {batches.map((batch) => {
              const s = batchStats[batch.id] || { total: 0, belum: 0, sudah: 0, group: 0, noaktif: 0 };
              const progress = getProgressPercentage(batch.id);

              return (
                <div key={batch.id} className="batch-card">
                  <div className="batch-card-header">
                    <div className="batch-name-large">{batch.name}</div>
                    <div className="batch-file">{batch.file_name}</div>
                  </div>

                  <div className="batch-card-meta">
                    <span>📅 {new Date(batch.created_at).toLocaleDateString("id-ID")}</span>
                    <span>👥 {batch.total_leads} leads</span>
                  </div>

                  <div className="batch-stats-row">
                    <div className="mini-stat mini-stat-orange">
                      <span className="mini-label">Belum</span>
                      <span className="mini-value">{s.belum}</span>
                    </div>
                    <div className="mini-stat mini-stat-green">
                      <span className="mini-label">Sudah</span>
                      <span className="mini-value">{s.sudah}</span>
                    </div>
                    <div className="mini-stat mini-stat-blue">
                      <span className="mini-label">Group</span>
                      <span className="mini-value">{s.group}</span>
                    </div>
                    <div className="mini-stat mini-stat-red">
                      <span className="mini-label">Tidak Aktif</span>
                      <span className="mini-value">{s.noaktif}</span>
                    </div>
                  </div>

                  <div className="batch-progress-large">
                    <div className="progress-bar-large">
                      <div className="progress-fill-large" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="progress-label">
                      {s.sudah + s.group} dari {s.total} di followup ({progress}%)
                    </div>
                  </div>

                  <div className="batch-card-actions">
                    <Link href={`/followup?batch=${batch.id}`} className="action-btn action-success">
                      💬 Mulai FollowUp
                    </Link>
                    <button
                      onClick={() => handleDelete(batch.id, batch.name)}
                      className="action-btn action-danger"
                    >
                      🗑️ Hapus
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}