"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, PenLine, LogOut, Settings, User, ChevronDown, LayoutDashboard, ShieldAlert, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Avatar from "@/components/Avatar";

export default function Navbar({ theme = "dark" }: { theme?: "dark" | "light" }) {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setProfileOpen(false);
    router.push("/");
  };

  const displayName = profile?.display_name || profile?.full_name || user?.email?.split("@")[0] || "U";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled ? "bg-ink/95 backdrop-blur-md border-b border-gold-dim py-3" : "py-5"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center group flex-shrink-0">
          <img src={theme === "light" && !scrolled ? "/logo-horizontal-light.png" : "/logo-horizontal-dark.png"} alt="Lekhsetu"
            className="h-9 w-auto transition-transform duration-500 group-hover:scale-105"
            style={{ transitionTimingFunction: "cubic-bezier(0.34,1.56,0.64,1)" }} />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { label: "Stories", href: "/explore" },
            { label: "Write", href: "/write" },
            { label: "About", href: "/about" },
            { label: "FAQ", href: "/faq" },
          ].map(nav => (
            <Link key={nav.label} href={nav.href}
              className="relative text-sm text-muted hover:text-cream-dim transition-colors tracking-wide py-1 group">
              {nav.label}
              <span className="absolute bottom-0 left-0 h-px bg-gold w-0 group-hover:w-full transition-all duration-300 ease-out" />
            </Link>
          ))}
          <Link href="/revenue-sharing"
            className="relative flex items-center gap-1.5 text-sm transition-colors tracking-wide py-1 group"
            style={{ color: "#F5A623" }}>
            <Sparkles size={13} className="animate-pulse" />
            Revenue Sharing
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold tracking-wide"
              style={{ background: "rgba(245,166,35,0.15)", color: "#F5A623" }}>
              Coming soon
            </span>
            <span className="absolute bottom-0 left-0 h-px bg-gold w-0 group-hover:w-full transition-all duration-300 ease-out" />
          </Link>
        </div>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link href="/write"
                className="flex items-center gap-1.5 bg-gold hover:bg-gold-light text-ink font-semibold text-sm px-5 py-2.5 rounded-full transition-all duration-200 hover:scale-105 active:scale-95">
                <PenLine size={14} /> Write
              </Link>
              <div ref={profileRef} className="relative">
                <button onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-full transition-all"
                  style={{ border: "1px solid rgba(245,166,35,0.2)", color: "#B8AE98" }}>
                  <Avatar src={profile?.avatar_url} name={displayName} size={24} />
                  <span className="text-xs max-w-[100px] truncate">{displayName}</span>
                  <ChevronDown size={12} />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-xl py-1 shadow-xl z-50"
                    style={{ background: "#1E1810", border: "1px solid rgba(245,166,35,0.15)" }}>
                    {profile?.username && (
                      <Link href={`/profile/${profile.username}`} onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm transition-colors hover:text-gold"
                        style={{ color: "#B8AE98" }}>
                        <User size={13} /> My Profile
                      </Link>
                    )}
                    <Link href="/dashboard" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm transition-colors hover:text-gold"
                      style={{ color: "#B8AE98" }}>
                      <LayoutDashboard size={13} /> Dashboard
                    </Link>
                    <Link href="/settings" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm transition-colors hover:text-gold"
                      style={{ color: "#B8AE98" }}>
                      <Settings size={13} /> Settings
                    </Link>
                    {profile?.is_admin && (
                      <Link href="/admin" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm transition-colors hover:text-gold"
                        style={{ color: "#F5A623" }}>
                        <ShieldAlert size={13} /> Admin
                      </Link>
                    )}
                    <div className="my-1 border-t" style={{ borderColor: "rgba(245,166,35,0.08)" }} />
                    <button onClick={handleSignOut}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-left transition-colors hover:text-gold"
                      style={{ color: "#6B6354" }}>
                      <LogOut size={13} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/auth" className="text-sm text-muted hover:text-cream transition-colors px-3 py-2">Sign in</Link>
              <Link href="/auth?mode=signup"
                className="flex items-center gap-1.5 bg-gold hover:bg-gold-light text-ink font-semibold text-sm px-5 py-2.5 rounded-full transition-all duration-200 hover:scale-105 active:scale-95">
                <PenLine size={14} /> Start writing
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg transition-colors"
          style={{ color: "#6B6354" }} aria-label="Menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ${open ? "max-h-[32rem] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="px-6 py-5 space-y-1 border-t border-gold-dim" style={{ background: "rgba(11,9,7,0.98)" }}>
          {[
            { label: "Browse Stories", href: "/explore" },
            { label: "Write a Story", href: "/write" },
            { label: "About", href: "/about" },
            { label: "FAQ", href: "/faq" },
          ].map(nav => (
            <Link key={nav.label} href={nav.href} onClick={() => setOpen(false)}
              className="block px-3 py-3 rounded-xl text-cream-dim hover:text-gold hover:bg-gold-dim transition-colors text-sm">
              {nav.label}
            </Link>
          ))}
          <Link href="/revenue-sharing" onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-3 rounded-xl hover:bg-gold-dim transition-colors text-sm font-medium"
            style={{ color: "#F5A623" }}>
            <Sparkles size={14} className="animate-pulse" />
            Revenue Sharing
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold tracking-wide ml-auto"
              style={{ background: "rgba(245,166,35,0.15)", color: "#F5A623" }}>
              Coming soon
            </span>
          </Link>
          <div className="pt-3 border-t border-gold-dim space-y-2">
            {user ? (
              <>
                <p className="px-3 text-xs" style={{ color: "#6B6354" }}>
                  Signed in as {displayName}
                </p>
                {profile?.username && (
                  <Link href={`/profile/${profile.username}`} onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm w-full rounded-xl transition-colors"
                    style={{ color: "#B8AE98" }}>
                    <User size={14} /> My Profile
                  </Link>
                )}
                <Link href="/dashboard" onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm w-full rounded-xl transition-colors"
                  style={{ color: "#B8AE98" }}>
                  <LayoutDashboard size={14} /> Dashboard
                </Link>
                <Link href="/settings" onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm w-full rounded-xl transition-colors"
                  style={{ color: "#B8AE98" }}>
                  <Settings size={14} /> Settings
                </Link>
                {profile?.is_admin && (
                  <Link href="/admin" onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm w-full rounded-xl transition-colors"
                    style={{ color: "#F5A623" }}>
                    <ShieldAlert size={14} /> Admin
                  </Link>
                )}
                <button onClick={() => { handleSignOut(); setOpen(false); }}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm w-full rounded-xl transition-colors"
                  style={{ color: "#6B6354" }}>
                  <LogOut size={14} /> Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth" onClick={() => setOpen(false)}
                  className="block px-3 py-2.5 text-sm rounded-xl transition-colors text-center"
                  style={{ border: "1px solid rgba(245,166,35,0.2)", color: "#B8AE98" }}>
                  Sign in
                </Link>
                <Link href="/auth?mode=signup" onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 bg-gold text-ink font-semibold px-5 py-3 rounded-xl text-sm">
                  <PenLine size={14} /> Create free account
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
