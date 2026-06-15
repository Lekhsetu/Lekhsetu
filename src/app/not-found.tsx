import Link from "next/link";

export default function NotFound() {
  return (
    <div className="pt-24 min-h-screen bg-paper flex items-center justify-center px-6 text-center">
      <div>
        <p className="font-display text-8xl font-black text-border mb-4">404</p>
        <h1 className="font-display text-2xl font-bold text-ink mb-2">Page not found</h1>
        <p className="text-muted mb-6">This story may have moved or doesn&apos;t exist yet.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/"
            className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-full hover:opacity-90 transition-all"
            style={{ background: "#0B0907", color: "#FDFBF7" }}>
            Go home
          </Link>
          <Link href="/explore"
            className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-full border border-border text-ink hover:border-saffron transition-all">
            Browse stories
          </Link>
        </div>
      </div>
    </div>
  );
}
