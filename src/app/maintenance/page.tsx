export default function MaintenancePage() {
  return (
    <div style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: "#FDFBF7",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
    }}>
      <div style={{ textAlign: "center", maxWidth: 520 }}>

        <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-1px", marginBottom: 48, color: "#0B0907" }}>
          Lekh<span style={{ color: "#F5A623" }}>setu</span>
        </div>

        <div style={{ fontSize: 64, marginBottom: 32, lineHeight: 1 }}>✍️</div>

        <h1 style={{
          fontSize: 30,
          fontWeight: 800,
          color: "#0B0907",
          marginBottom: 16,
          lineHeight: 1.3,
        }}>
          Something better is coming
        </h1>

        <p style={{ fontSize: 17, color: "#6B6354", lineHeight: 1.7, marginBottom: 12 }}>
          We are working hard behind the scenes to bring you a much better Lekhsetu.
        </p>

        <p style={{ fontSize: 17, color: "#6B6354", lineHeight: 1.7, marginBottom: 40 }}>
          The site will be back up very soon. Thank you for your patience.
        </p>

        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          background: "rgba(245,166,35,0.1)",
          border: "1px solid rgba(245,166,35,0.3)",
          borderRadius: 14,
          padding: "14px 24px",
        }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#F5A623", display: "inline-block", animation: "pulse 1.5s infinite" }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#B8851A" }}>Upgrade in progress</span>
        </div>

        <p style={{ marginTop: 48, fontSize: 13, color: "#B5A898" }}>
          lekhsetu.com
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
