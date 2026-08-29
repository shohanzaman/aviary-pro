export default function DashboardPage() {
  return (
    <main className="container">
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Aviary Pro Dashboard</h1>
        <p className="subtle">Milestone 1 foundation is connected. Google account, Guest Mode, realtime data, bird registry, breeding, orders and weather will be activated in the next modules.</p>
        <div className="grid" style={{ marginTop: 16 }}>
          <div className="card"><strong>Birds</strong><div className="subtle">Registry foundation ready</div></div>
          <div className="card"><strong>Breeding</strong><div className="subtle">Pair database ready</div></div>
          <div className="card"><strong>Orders</strong><div className="subtle">Customer/order database ready</div></div>
          <div className="card"><strong>Weather</strong><div className="subtle">Integration planned</div></div>
        </div>
      </div>
    </main>
  );
}
