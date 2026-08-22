"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/");
    });
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (result.error) {
      setError(result.error.message);
      setLoading(false);
      return;
    }

    if (mode === "signup" && !result.data.session) {
      setMessage("Account created. Check your email to confirm your account, then log in.");
      setMode("login");
      setLoading(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">🦜</div>
          <p className="eyebrow">AVIARY PRO</p>
          <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
          <p>Bird management made simple.</p>
        </div>

        <div className="auth-tabs">
          <button className={mode === "login" ? "auth-tab active" : "auth-tab"} onClick={() => { setMode("login"); setError(""); setMessage(""); }}>
            Login
          </button>
          <button className={mode === "signup" ? "auth-tab active" : "auth-tab"} onClick={() => { setMode("signup"); setError(""); setMessage(""); }}>
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>Email address</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />

          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 characters" minLength={6} required autoComplete={mode === "login" ? "current-password" : "new-password"} />

          {error && <div className="auth-message error">{error}</div>}
          {message && <div className="auth-message success">{message}</div>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Please wait…" : mode === "login" ? "Login to Aviary Pro" : "Create account"}
          </button>
        </form>

        <small className="auth-footer">Your account is secured by Supabase Authentication.</small>
      </section>
    </main>
  );
}
