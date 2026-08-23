"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

const stats = [
  { label: "Total Birds", value: "32", note: "+4 this month", icon: "🐦" },
  { label: "Breeding Pairs", value: "8", note: "3 active nests", icon: "🪺" },
  { label: "Stock Value", value: "৳48,750", note: "12 items", icon: "📦" },
  { label: "This Month Sales", value: "৳26,400", note: "6 sales", icon: "💰" },
];

const modules = [
  ["Birds", "Manage birds, IDs, mutations and status", "🐦", "/birds"],
  ["Breeding", "Pairs, eggs, hatchings and offspring", "🪺", "/breeding"],
  ["Inventory", "Food, medicine, accessories and stock", "📦", "#"],
  ["Sales", "Invoices, customers and sales history", "🛒", "#"],
  ["Finance", "Income, expenses and profit", "💳", "#"],
  ["Reports", "Business and breeding analytics", "📊", "#"],
];

export default function Home() {
  const router = useRouter();
  const [active, setActive] = useState("Dashboard");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [email, setEmail] = useState("");

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (!data.session) { router.replace("/login"); return; }
      setEmail(data.session.user.email ?? "");
      setCheckingAuth(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/login"); else setEmail(session.user.email ?? "");
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, [router]);

  async function logout() { await supabase.auth.signOut(); router.replace("/login"); router.refresh(); }
  if (checkingAuth) return <main className="auth-loading">Loading Aviary Pro…</main>;

  function navigate(item: string, path: string) { setActive(item); if (path !== "#") router.push(path); }

  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span>🦜</span><div><strong>Aviary Pro</strong><small>Bird Management</small></div></div>
      <nav>{["Dashboard", "Birds", "Breeding", "Inventory", "Sales", "Finance", "Reports"].map(item => {
        const path = item === "Dashboard" ? "/" : item === "Birds" ? "/birds" : item === "Breeding" ? "/breeding" : "#";
        return <button key={item} className={active === item ? "nav-item active" : "nav-item"} onClick={() => navigate(item, path)}><span>{({Dashboard:"⌂",Birds:"🐦",Breeding:"🪺",Inventory:"📦",Sales:"🛒",Finance:"৳",Reports:"▥"} as Record<string,string>)[item]}</span>{item}</button>;
      })}</nav>
      <div className="sidebar-bottom"><button className="nav-item" onClick={logout}><span>↪</span>Logout</button></div>
    </aside>
    <section className="content">
      <header className="topbar"><div><p className="eyebrow">AVIARY PRO</p><h1>{active}</h1></div><button className="profile profile-button" title={email} onClick={logout}><span className="online" /> SZ</button></header>
      <div className="welcome"><div><h2>Good evening 👋</h2><p>Here&apos;s what&apos;s happening in your aviary today.</p></div><button className="primary" onClick={() => router.push("/birds")}>+ Add Bird</button></div>
      <section className="stats-grid">{stats.map(s => <article className="stat-card" key={s.label}><div className="stat-icon">{s.icon}</div><div><p>{s.label}</p><strong>{s.value}</strong><small>{s.note}</small></div></article>)}</section>
      <div className="section-title"><h2>Quick Access</h2><span>Manage your aviary</span></div>
      <section className="module-grid">{modules.map(([title, desc, icon, path]) => <button className="module-card" key={title} onClick={() => navigate(title, path)}><span className="module-icon">{icon}</span><span><strong>{title}</strong><small>{desc}</small></span><b>›</b></button>)}</section>
      <div className="bottom-grid"><section className="panel"><div className="panel-head"><div><h2>Recent Sales</h2><span>Latest transactions</span></div><button>View all ›</button></div><div className="empty-row"><span>🛒</span><div><strong>No recent sales</strong><small>Sales will appear here when you record them.</small></div></div></section><section className="panel"><div className="panel-head"><div><h2>Breeding Activity</h2><span>Current status</span></div><button onClick={() => router.push("/breeding")}>View all ›</button></div><div className="activity"><div><span className="dot green"/><div><strong>Active pairs</strong><small>Breeding records will appear here.</small></div></div><div><span className="dot blue"/><div><strong>Eggs</strong><small>Egg tracking will be added next.</small></div></div></div></section></div>
      <footer>Aviary Pro • Mobile-first bird management system</footer>
    </section>
  </main>;
}
