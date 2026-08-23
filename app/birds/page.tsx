"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Bird = {
  id: string;
  user_id: string;
  bird_code: string;
  name: string | null;
  species: string;
  mutation: string | null;
  sex: "Male" | "Female" | "Unknown";
  date_of_birth: string | null;
  ring_id: string | null;
  status: "Active" | "Breeding" | "Sold" | "Deceased" | "Transferred";
  purchase_price: number;
  notes: string | null;
};

type FormState = Omit<Bird, "id" | "user_id" | "purchase_price"> & { purchase_price: string };

const emptyForm: FormState = {
  bird_code: "",
  name: "",
  species: "",
  mutation: "",
  sex: "Unknown",
  date_of_birth: "",
  ring_id: "",
  status: "Active",
  purchase_price: "0",
  notes: "",
};

export default function BirdsPage() {
  const router = useRouter();
  const [birds, setBirds] = useState<Bird[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadBirds();
  }, []);

  async function loadBirds() {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("birds")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) setMessage(error.message);
    else setBirds((data ?? []) as Bird[]);
    setLoading(false);
  }

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setShowForm(true);
  }

  function openEdit(bird: Bird) {
    setEditingId(bird.id);
    setForm({
      bird_code: bird.bird_code,
      name: bird.name ?? "",
      species: bird.species,
      mutation: bird.mutation ?? "",
      sex: bird.sex,
      date_of_birth: bird.date_of_birth ?? "",
      ring_id: bird.ring_id ?? "",
      status: bird.status,
      purchase_price: String(bird.purchase_price ?? 0),
      notes: bird.notes ?? "",
    });
    setMessage("");
    setShowForm(true);
  }

  async function saveBird(event: FormEvent) {
    event.preventDefault();
    if (!form.bird_code.trim() || !form.species.trim()) {
      setMessage("Bird ID and Species are required.");
      return;
    }

    setSaving(true);
    setMessage("");
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      router.replace("/login");
      setSaving(false);
      return;
    }

    const payload = {
      bird_code: form.bird_code.trim(),
      name: form.name?.trim() || null,
      species: form.species.trim(),
      mutation: form.mutation?.trim() || null,
      sex: form.sex,
      date_of_birth: form.date_of_birth || null,
      ring_id: form.ring_id?.trim() || null,
      status: form.status,
      purchase_price: Number(form.purchase_price) || 0,
      notes: form.notes?.trim() || null,
    };

    const result = editingId
      ? await supabase.from("birds").update(payload).eq("id", editingId)
      : await supabase.from("birds").insert({ ...payload, user_id: user.id });

    if (result.error) setMessage(result.error.message);
    else {
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      await loadBirds();
    }
    setSaving(false);
  }

  async function deleteBird(id: string) {
    if (!window.confirm("Delete this bird record? This cannot be undone.")) return;
    const { error } = await supabase.from("birds").delete().eq("id", id);
    if (error) setMessage(error.message);
    else await loadBirds();
  }

  const filteredBirds = useMemo(() => {
    const q = search.trim().toLowerCase();
    return birds.filter((bird) => {
      const matchesStatus = statusFilter === "All" || bird.status === statusFilter;
      const text = [bird.bird_code, bird.name, bird.species, bird.mutation, bird.ring_id]
        .filter(Boolean).join(" ").toLowerCase();
      return matchesStatus && (!q || text.includes(q));
    });
  }, [birds, search, statusFilter]);

  return (
    <main className="content birds-page">
      <header className="topbar">
        <div><p className="eyebrow">AVIARY PRO</p><h1>Birds</h1></div>
        <button className="profile" onClick={() => router.push("/")} title="Dashboard">SZ</button>
      </header>

      <section className="birds-toolbar">
        <div>
          <h2>Bird Management</h2>
          <p>Manage IDs, species, mutations, ownership and status.</p>
        </div>
        <button className="primary" onClick={openAdd}>+ Add Bird</button>
      </section>

      <section className="bird-summary">
        <div><span>Total Birds</span><strong>{birds.length}</strong></div>
        <div><span>Active</span><strong>{birds.filter(b => b.status === "Active").length}</strong></div>
        <div><span>Breeding</span><strong>{birds.filter(b => b.status === "Breeding").length}</strong></div>
        <div><span>Sold</span><strong>{birds.filter(b => b.status === "Sold").length}</strong></div>
      </section>

      {showForm && (
        <form className="bird-form panel" onSubmit={saveBird}>
          <div className="panel-head"><div><h2>{editingId ? "Edit Bird" : "Add New Bird"}</h2><span>All fields marked * are required.</span></div><button type="button" onClick={() => setShowForm(false)}>✕</button></div>
          <div className="form-grid">
            <label>Bird ID *<input value={form.bird_code} onChange={e => setForm({...form, bird_code: e.target.value})} placeholder="e.g. AP-001" /></label>
            <label>Name<input value={form.name ?? ""} onChange={e => setForm({...form, name: e.target.value})} placeholder="Optional name" /></label>
            <label>Species *<input value={form.species} onChange={e => setForm({...form, species: e.target.value})} placeholder="Cockatiel" /></label>
            <label>Mutation<input value={form.mutation ?? ""} onChange={e => setForm({...form, mutation: e.target.value})} placeholder="Lutino, Pied..." /></label>
            <label>Sex<select value={form.sex} onChange={e => setForm({...form, sex: e.target.value as FormState["sex"]})}><option>Unknown</option><option>Male</option><option>Female</option></select></label>
            <label>Date of Birth<input type="date" value={form.date_of_birth ?? ""} onChange={e => setForm({...form, date_of_birth: e.target.value})} /></label>
            <label>Ring ID<input value={form.ring_id ?? ""} onChange={e => setForm({...form, ring_id: e.target.value})} /></label>
            <label>Status<select value={form.status} onChange={e => setForm({...form, status: e.target.value as FormState["status"]})}><option>Active</option><option>Breeding</option><option>Sold</option><option>Deceased</option><option>Transferred</option></select></label>
            <label>Purchase Price<input type="number" min="0" step="0.01" value={form.purchase_price} onChange={e => setForm({...form, purchase_price: e.target.value})} /></label>
            <label className="wide">Notes<textarea value={form.notes ?? ""} onChange={e => setForm({...form, notes: e.target.value})} rows={3} /></label>
          </div>
          {message && <div className="auth-message error">{message}</div>}
          <div className="form-actions"><button type="button" className="secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="primary" disabled={saving}>{saving ? "Saving..." : editingId ? "Update Bird" : "Save Bird"}</button></div>
        </form>
      )}

      <section className="panel birds-table-panel">
        <div className="filters"><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Bird ID, species, mutation..." /><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option>All</option><option>Active</option><option>Breeding</option><option>Sold</option><option>Deceased</option><option>Transferred</option></select></div>
        {message && !showForm && <div className="auth-message error">{message}</div>}
        {loading ? <div className="table-empty">Loading birds...</div> : filteredBirds.length === 0 ? <div className="table-empty"><span>🐦</span><strong>No bird records yet</strong><small>Add your first bird to start building the aviary database.</small><button className="primary" onClick={openAdd}>+ Add First Bird</button></div> : (
          <div className="table-wrap"><table><thead><tr><th>Bird ID</th><th>Species</th><th>Mutation</th><th>Sex</th><th>Ring ID</th><th>Status</th><th>Price</th><th>Action</th></tr></thead><tbody>{filteredBirds.map(bird => <tr key={bird.id}><td><strong>{bird.bird_code}</strong>{bird.name && <small>{bird.name}</small>}</td><td>{bird.species}</td><td>{bird.mutation || "—"}</td><td>{bird.sex}</td><td>{bird.ring_id || "—"}</td><td><span className={`status-pill ${bird.status.toLowerCase()}`}>{bird.status}</span></td><td>৳{Number(bird.purchase_price).toLocaleString()}</td><td><button className="table-action" onClick={() => openEdit(bird)}>Edit</button><button className="table-delete" onClick={() => deleteBird(bird.id)}>Delete</button></td></tr>)}</tbody></table></div>
        )}
      </section>
    </main>
  );
}
