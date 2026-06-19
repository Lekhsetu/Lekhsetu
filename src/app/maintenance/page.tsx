export default function MaintenancePage() {
  return (
    <html lang="en">
      <head>
        <title>Lekhsetu — We'll be right back</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #FDFBF7;
            color: #0B0907;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
          }
          .card {
            text-align: center;
            max-width: 480px;
            width: 100%;
          }
          .logo {
            font-size: 32px;
            font-weight: 900;
            letter-spacing: -1px;
            margin-bottom: 32px;
            color: #0B0907;
          }
          .logo span { color: #F5A623; }
          .icon {
            font-size: 56px;
            margin-bottom: 24px;
            display: block;
          }
          h1 {
            font-size: 26px;
            font-weight: 800;
            margin-bottom: 12px;
            color: #0B0907;
          }
          p {
            font-size: 16px;
            color: #6B6354;
            line-height: 1.6;
            margin-bottom: 8px;
          }
          .badge {
            display: inline-block;
            margin-top: 32px;
            background: #F5A62318;
            color: #B8851A;
            border: 1px solid #F5A62340;
            border-radius: 999px;
            padding: 8px 20px;
            font-size: 13px;
            font-weight: 600;
          }
          .divider {
            width: 48px;
            height: 3px;
            background: #F5A623;
            border-radius: 2px;
            margin: 24px auto;
          }
        `}</style>
      </head>
      <body>
        <div className="card">
          <div className="logo">Lekh<span>setu</span></div>
          <span className="icon">🛠️</span>
          <h1>We&apos;re upgrading Lekhsetu</h1>
          <div className="divider" />
          <p>We&apos;re making some improvements to bring you a better experience.</p>
          <p>The site will be back up shortly — thank you for your patience.</p>
          <div className="badge">Back soon ✦</div>
        </div>
      </body>
    </html>
  );
}
