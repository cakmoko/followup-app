"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser, getProfile, updateProfile, updatePassword, signOut } from "@/lib/db";
import { User } from "@/types";
import Link from "next/link";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [businessName, setBusinessName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [error, setError] = useState("");
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
      setBusinessName(profileData?.business_name || "");
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSaveName = async () => {
    setSavingName(true);
    setError("");

    try {
      await updateProfile(businessName);
      showSavedBadge();
    } catch (err: any) {
      setError(err.message);
    }

    setSavingName(false);
  };

  const handleSavePassword = async () => {
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Password tidak sama");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }

    setSavingPassword(true);

    try {
      await updatePassword(newPassword);
      setNewPassword("");
      setConfirmPassword("");
      showSavedBadge();
    } catch (err: any) {
      setError(err.message);
    }

    setSavingPassword(false);
  };

  const showSavedBadge = () => {
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 1500);
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

        <h1 className="navbar-title-center">Settings</h1>

        <div className="navbar-right">
          <div className="navbar-user" onClick={() => setShowDropdown(!showDropdown)}>
            <div className="user-avatar">{profile?.business_name?.charAt(0) || "U"}</div>
          </div>

          {showDropdown && (
            <div className="dropdown-menu">
              <button onClick={handleLogout} className="dropdown-item">🚪 Logout</button>
            </div>
          )}
        </div>
      </nav>

      {/* Main */}
      <main className="main-content">
        {/* Profile Section */}
        <div className="settings-card">
          <h2 className="settings-title">👤 Profile</h2>

          <div className="settings-field">
            <label>Email</label>
            <input type="email" value={user?.email || ""} disabled className="settings-input-disabled" />
            <p className="settings-hint">Email tidak bisa diubah</p>
          </div>

          <div className="settings-field">
            <label>Nama Bisnis / Agency</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="settings-input"
              placeholder="Nama bisnis Anda"
            />
          </div>

          {error && <div className="settings-error">{error}</div>}

          <button onClick={handleSaveName} disabled={savingName} className="action-btn action-primary">
            {savingName ? "Saving..." : "Simpan Nama"}
          </button>
        </div>

        {/* Password Section */}
        <div className="settings-card">
          <h2 className="settings-title">🔒 Password</h2>

          <div className="settings-field">
            <label>Password Baru</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="settings-input"
              placeholder="Minimal 6 karakter"
            />
          </div>

          <div className="settings-field">
            <label>Konfirmasi Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="settings-input"
              placeholder="Masukkan password lagi"
            />
          </div>

          <button onClick={handleSavePassword} disabled={savingPassword || !newPassword} className="action-btn action-primary">
            {savingPassword ? "Saving..." : "Ganti Password"}
          </button>
        </div>
      </main>

      {/* Saved Badge */}
      <div className={`saved-badge ${showSaved ? "show" : ""}`}>✓ tersimpan</div>
    </div>
  );
}