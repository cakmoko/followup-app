"use client";

import { useState } from "react";
import { signIn, resetPassword } from "@/lib/db";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn(email, password);
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message || "Login gagal");
    }

    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResetSuccess("");
    setResetLoading(true);

    try {
      await resetPassword(resetEmail);
      setResetSuccess("Email reset password telah dikirim. Silakan cek inbox Anda.");
      setShowReset(false);
      setResetEmail("");
    } catch (err: any) {
      setError(err.message || "Gagal mengirim email reset password");
    }

    setResetLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2.5">
            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
          </svg>
        </div>
        <h1 className="auth-title">FollowUp<span>Tool</span></h1>
        <p className="auth-subtitle">Masuk untuk mengelola follow-up WhatsApp</p>

        {showReset ? (
          <form onSubmit={handleResetPassword} className="auth-form">
            {error && <div className="auth-error">{error}</div>}
            <p style={{ marginBottom: "1rem", color: "#666", textAlign: "center" }}>
              Masukkan email Anda untuk reset password
            </p>

            <div className="auth-field">
              <label>Email</label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="email@contoh.com"
                required
              />
            </div>

            <button type="submit" className="auth-btn" disabled={resetLoading}>
              {resetLoading ? "Loading..." : "Kirim Email Reset"}
            </button>

            <button
              type="button"
              className="auth-btn-secondary"
              onClick={() => setShowReset(false)}
            >
              Kembali ke Login
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="auth-error">{error}</div>}
            {resetSuccess && <div className="auth-success">{resetSuccess}</div>}

            <div className="auth-field">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@contoh.com"
                required
              />
            </div>

            <div className="auth-field">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                required
              />
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? "Loading..." : "Masuk"}
            </button>

            <button
              type="button"
              className="auth-link-btn"
              onClick={() => setShowReset(true)}
            >
              Lupa Password?
            </button>
          </form>
        )}

        <div className="auth-divider">
          <span>atau</span>
        </div>

        <Link href="/register" className="auth-register-btn">
          Belum punya akun? <strong>Daftar Sekarang</strong>
        </Link>
      </div>
    </div>
  );
}