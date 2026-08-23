"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Bird = { id: string; bird_code: string; name: string | null; species: string; mutation: string | null; sex: string; status: string };
type Pair = { id: string; pair_code: string; male_bird_id: string; female_bird_id: string; status: "Active" | "Resting" | "Completed" | "Separated"; paired_date: string; nest_number: number; notes: string | null };

const empty = { pair_code: "", male_bird_id: "", female_bird_id: "", status: "Active" as Pair["status"], paired_date: new Date().toISOString().slice(0, 10), nest_number: "1", notes: "" };

export default function BreedingPage() {
  const router = useRouter();
  const [birds, setBirds] = useState<Bird[]>([]);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) { router.replace("/login"); return; }
    const [{ data: birdData, error: birdError }, { data: pairData, error: pairError }] = await Promise.all([
      supabase.from("birds").select("id,bird_code,name,species,mutation,sex,status").order("bird_code"),
      supabase.from("breeding_pairs").select("*").order("created_at", { ascending: false }),
    ]);
    if (birdError) setMessage(birdError.message);
    if (pairError) setMessage(pairError.message);
    setBirds((birdData ?? []) as Bird[]);
    setPairs((pairData ?? []) as Pair[]);
    setLoading(false);
  }

  const males = useMemo(() => birds.filter(b => b.sex === "Male" && !["Sold", "Deceased", "Transferred"].includes(b.status)), [birds]);
  const females = useMemo(() => birds.filter(b => b.sex === "Female" && !["Sold", "Deceased", "Transferred"].includes(b.status)), [birds]);
  const birdLabel = (id: string) => { const b = birds.find(x => x.id === id); return b ? `${b.bird_code}${b.name ? ` — ${b.name}` : ""} (${b.species}${b.mutation ? ` / ${b.mutation}` : ""})` : "Unknown bird"; };

  function openAdd() { setEditingId(null); setForm(empty); setMessage(""); setShowForm(true); }
  function openEdit(p: Pair) { setEditingId(p.id); setForm({ pair_code: p.pair_code, male_bird_id: p.male_bird_id, female_bird_id: p.female_bird_id, status: p.status, paired_date: p.paired_date, nest_number: String(p.nest_number), notes: p.notes ?? "" }); setMessage(""); setShowForm(true); }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!form.pair_code.trim() || !form.male_bird_id || !form.female_bird_id) { setMessage("Pair ID, male bird and female bird are required."); return; }
    if (form.male_bird_id === form.female_bird_id) { setMessage("Male and female birds must be different."); return; }
    setSaving(true); setMessage("");
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) { router.replace("/login"); setSaving(false); return; }
    const payload = { pair_code: form.pair_code.trim(), male_bird_id: form.male_bird_id, female_bird_id: form.female_bird_id, status: form.status, paired_date: form.paired_date, nest_number: Math.max(1, Number(form.nest_number) || 1), notes: form.notes.trim() || null };
    const result = editingId ? await supabase.from("breeding_pairs").update(payload).eq("id", editingId) : await supabase.from("breeding_pairs").insert({ ...payload, user_id: user.id });
    if (result.error) setMessage(result.error.message); else { setShowForm(false); setForm(empty); setEditingId(null); await load(); }
    setSaving(false);
  }

  async function remove(id: string) { if (!window.confirm("Delete this breeding pair?")) return; const { error } = await supabase.from("breeding_pairs").delete().eq("id", id); if (error) setMessage(error.message); else await load(); }

  const filtered = pairs.filter(p => { const q = search.toLowerCase().trim(); return !q || [p.pair_code, birdLabel(p.male_bird_id), birdLabel(p.female_bird_id), p.status].join(" ").toLowerCase().includes(q); });
  const activeCount = pairs.filter(p => p.status === "Active").length;

  return <main className="content birds-page">
    <header className="topbar"><div><p className="eyebrow">AVIARY PRO</p><h1>Breeding</h1></div><button className="profile" onClick={() => router.push("/")}>SZ</button></header>
    <section className="birds-toolbar"><div><h2>Breeding Pair Management</h2><p>Create and manage male/female pairs, pairing dates and nest numbers.</p></div><button className="primary" onClick={openAdd}>+ Add Pair</button></section>
    <section className="bird-summary"><div><span>Total Pairs</span><strong>{pairs.length}</strong></div><div><span>Active Pairs</span><strong>{activeCount}</strong></div><div><span>Male Birds</span><strong>{males.length}</strong></div><div><span>Female Birds</span><strong>{females.length}</strong></div></section>
    {showForm && <form className="bird-form panel" onSubmit={save}><div className="panel-head"><div><h2>{editingId ? "Edit Breeding Pair" : "Create Breeding Pair"}</h2><span>Select birds already registered in the Birds module.</span></div><button type="button" onClick={() => setShowForm(false)}>✕</button></div>
      <div className="form-grid"><label>Pair ID *<input value={form.pair_code} onChange={e => setForm({...form, pair_code:e.target.value})} placeholder="PAIR-001" /></label><label>Male Bird *<select value={form.male_bird_id} onChange={e => setForm({...form, male_bird_id:e.target.value})}><option value="">Select male</option>{males.map(b => <option key={b.id} value={b.id}>{birdLabel(b.id)}</option>)}</select></label><label>Female Bird *<select value={form.female_bird_id} onChange={e => setForm({...form, female_bird_id:e.target.value})}><option value="">Select female</option>{females.map(b => <option key={b.id} value={b.id}>{birdLabel(b.id)}</option>)}</select></label><label>Status<select value={form.status} onChange={e => setForm({...form, status:e.target.value as Pair["status"]})}><option>Active</option><option>Resting</option><option>Completed</option><option>Separated</option></select></label><label>Paired Date<input type="date" value={form.paired_date} onChange={e => setForm({...form, paired_date:e.target.value})} /></label><label>Nest Number<input type="number" min="1" value={form.nest_number} onChange={e => setForm({...form, nest_number:e.target.value})} /></label><label className="wide">Notes<textarea rows={3} value={form.notes} onChange={e => setForm({...form, notes:e.target.value})} /></label></div>
      {message && <div className="auth-message error">{message}</div>}<div className="form-actions"><button type="button" className="secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="primary" disabled={saving}>{saving ? "Saving..." : editingId ? "Update Pair" : "Save Pair"}</button></div></form>}
    <section className="panel birds-table-panel"><div className="filters"><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search pair ID or bird..." /></div>{message && !showForm && <div className="auth-message error">{message}</div>}{loading ? <div className="table-empty">Loading breeding pairs...</div> : filtered.length === 0 ? <div className="table-empty"><span>🪺</span><strong>No breeding pairs yet</strong><small>Add a male and female bird pair to start breeding records.</small><button className="primary" onClick={openAdd}>+ Add First Pair</button></div> : <div className="table-wrap"><table><thead><tr><th>Pair ID</th><th>Male</th><th>Female</th><th>Paired Date</th><th>Nest</th><th>Status</th><th>Action</th></tr></thead><tbody>{filtered.map(p => <tr key={p.id}><td><strong>{p.pair_code}</strong></td><td>{birdLabel(p.male_bird_id)}</td><td>{birdLabel(p.female_bird_id)}</td><td>{p.paired_date}</td><td>{p.nest_number}</td><td><span className={`status-pill ${p.status.toLowerCase()}`}>{p.status}</span></td><td><button className="table-action" onClick={() => openEdit(p)}>Edit</button><button className="table-delete" onClick={() => remove(p.id)}>Delete</button></td></tr>)}</tbody></table></div>}</section>
  </main>;
}
