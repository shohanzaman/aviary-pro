"use client";

import { useState } from "react";

const stats = [
  { label: "Total Birds", value: "32", note: "+4 this month", icon: "🐦" },
  { label: "Breeding Pairs", value: "8", note: "3 active nests", icon: "🪺" },
  { label: "Stock Value", value: "৳48,750", note: "12 items", icon: "📦" },
  { label: "This Month Sales", value: "৳26,400", note: "6 sales", icon: "💰" },
];

const modules = [
  ["Birds", "Manage birds, IDs, mutations and status", "🐦"],
  ["Breeding", "Pairs, eggs, hatchings and offspring", "🪺"],
  ["Inventory", "Food, medicine, accessories and stock", "📦"],
  ["Sales", "Invoices, customers and sales history", "🛒"],
  ["Finance", "Income, expenses and profit", "💳"],
  ["Reports", "Business and breeding analytics", "📊"],
];

export default function Home() {
  const [active, setActive] = useState("Dashboard");

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span>🦜</span><div><strong>Aviary Pro</strong><small>Bird Management</small></div></div>
        <nav>
          {["Dashboard", "Birds", "Breeding", "Inventory", "Sales", "Finance", "Reports"].map((item) => (
            <button key={item} className={active === item ? "nav-item active" : "nav-item"} onClick={() => setActive(item)}>
              <span>{({Dashboard:"⌂",Birds:"🐦",Breeding:"🪺",Inventory:"📦",Sales:"🛒",Finance:"৳",Reports:"▥"} as Record<string,string>)[item]}</span>{item}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom"><button className="nav-item"><span>⚙</span>Settings</button></div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div><p className="eyebrow">AVIARY PRO</p><h1>{active}</h1></div>
          <div className="profile"><span className="online" /> SZ</div>
        </header>

        <div className="welcome"><div><h2>Good evening 👋</h2><p>Here&apos;s what&apos;s happening in your aviary today.</p></div><button className="primary">+ Add Bird</button></div>

        <section className="stats-grid">
          {stats.map((s) => <article className="stat-card" key={s.label}><div className="stat-icon">{s.icon}</div><div><p>{s.label}</p><strong>{s.value}</strong><small>{s.note}</small></div></article>)}
        </section>

        <div className="section-title"><h2>Quick Access</h2><span>Manage your aviary</span></div>
        <section className="module-grid">
          {modules.map(([title, desc, icon]) => <button className="module-card" key={title} onClick={() => setActive(title)}><span className="module-icon">{icon}</span><span><strong>{title}</strong><small>{desc}</small></span><b>›</b></button>)}
        </section>

        <div className="bottom-grid">
          <section className="panel"><div className="panel-head"><div><h2>Recent Sales</h2><span>Latest transactions</span></div><button>View all ›</button></div><div className="empty-row"><span>🛒</span><div><strong>No recent sales</strong><small>Sales will appear here when you record them.</small></div></div></section>
          <section className="panel"><div className="panel-head"><div><h2>Breeding Activity</h2><span>Current status</span></div><button>View all ›</button></div><div className="activity"><div><span className="dot green"/><div><strong>Active pairs</strong><small>3 pairs currently nesting</small></div><b>3</b></div><div><span className="dot blue"/><div><strong>Eggs</strong><small>7 eggs under incubation</small></div><b>7</b></div></div></section>
        </div>

        <footer>Aviary Pro • Mobile-first bird management system</footer>
      </section>
    </main>
  );
}
