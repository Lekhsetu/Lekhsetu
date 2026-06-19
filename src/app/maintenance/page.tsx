export default function MaintenancePage() {
  return (
    <div style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: "#FDFBF7",
      color: "#0B0907",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
    }}>
      <div style={{ textAlign: "center", maxWidth: 480, width: "100%" }}>
        <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1, marginBottom: 32 }}>
          Lekh<span style={{ color: "#F5A623" }}>setu</span>
        </div>
        <div style={{ fontSize: 56, marginBottom: 24 }}>🛠️</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12 }}>
          We&apos;re upgrading Lekhsetu
        </h1>
        <div style={{ width: 48, height: 3, background: "#F5A623", borderRadius: 2, margin: "24px auto" }} />
        <p style={{ fontSize: 16, color: "#6B6354", lineHeight: 1.6, marginBottom: 8 }}>
          We&apos;re making some improvements to bring you a better experience.
        </p>
        <p style={{ fontSize: 16, color: "#6B6354", lineHeight: 1.6 }}>
          The site will be back up shortly — thank you for your patience.
        </p>
        <div style={{
          display: "inline-block",
          marginTop: 32,
          background: "rgba(245,166,35,0.1)",
          color: "#B8851A",
          border: "1px solid rgba(245,166,35,0.25)",
          borderRadius: 999,
          padding: "8px 20px",
          fontSize: 13,
          fontWeight: 600,
        }}>
          Back soon ✦
        </div>
      </div>
    </div>
  );
}
