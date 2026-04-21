"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser, getProfile, getBatches, getBatchStats, getOverallStats, signOut } from "@/lib/db";
import { User, Batch } from "@/types";
import Link from "next/link";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [stats, setStats] = useState({ total: 0, belum: 0, sudah: 0, group: 0, noaktif: 0 });
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

      // Get stats for each batch
      const statsMap: Record<string, any> = {};
      for (const batch of batchesData) {
        statsMap[batch.id] = await getBatchStats(batch.id);
      }
      setBatchStats(statsMap);

      // Get overall stats
      const overallStats = await getOverallStats();
      setStats(overallStats);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
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
          <div className="navbar-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2.5">
              <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
            </svg>
          </div>
          <h1 className="navbar-title">FollowUp<span>Tool</span></h1>
        </div>

        <div className="navbar-right">
          <div className="navbar-user" onClick={() => setShowDropdown(!showDropdown)}>
            <div className="user-avatar">
              {profile?.business_name?.charAt(0) || user?.email?.charAt(0) || "U"}
            </div>
            <span className="user-name">{profile?.business_name || user?.email}</span>
          </div>

          {showDropdown && (
            <div className="dropdown-menu">
              <Link href="/settings" className="dropdown-item">⚙️ Settings</Link>
              <button onClick={handleLogout} className="dropdown-item">🚪 Logout</button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Leads</div>
          </div>
          <div className="stat-card stat-orange">
            <div className="stat-value">{stats.belum}</div>
            <div className="stat-label">Belum FollowUp</div>
          </div>
          <div className="stat-card stat-green">
            <div className="stat-value">{stats.sudah}</div>
            <div className="stat-label">Sudah FollowUp</div>
          </div>
          <div className="stat-card stat-blue">
            <div className="stat-value">{stats.group}</div>
            <div className="stat-label">Masuk Group</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <Link href="/import" className="action-btn action-primary">📥 Import Data Baru</Link>
          <Link href="/followup" className="action-btn action-success">💬 Mulai FollowUp</Link>
          <Link href="/batches" className="action-btn action-secondary">📋 Daftar Batch</Link>
        </div>

        {/* Batch List */}
        <div className="section-card">
          <h2 className="section-title">Batch Terbaru</h2>

          {batches.length === 0 ? (
            <div className="empty-state">
              <p>Belum ada batch data</p>
              <Link href="/import" className="action-btn action-primary">Import Data Pertama</Link>
            </div>
          ) : (
            <div className="batch-list">
              {batches.slice(0, 5).map((batch) => {
                const s = batchStats[batch.id] || { total: 0, belum: 0, sudah: 0, group: 0, noaktif: 0 };
                const progress = getProgressPercentage(batch.id);

                return (
                  <div key={batch.id} className="batch-item">
                    <div className="batch-info">
                      <div className="batch-name">{batch.name}</div>
                      <div className="batch-meta">
                        {new Date(batch.created_at).toLocaleDateString("id-ID")} • {batch.total_leads} leads
                      </div>
                    </div>

                    <div className="batch-progress">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                      </div>
                      <div className="progress-text">
                        {s.sudah + s.group}/{s.total} ({progress}%)
                      </div>
                    </div>

                    <Link href={`/followup?batch=${batch.id}`} className="batch-action">
                      Mulai
                    </Link>
                  </div>
                );
              })}

              {batches.length > 5 && (
                <Link href="/batches" className="see-all-link">
                  Lihat semua batch ({batches.length})
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}