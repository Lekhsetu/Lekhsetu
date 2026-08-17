"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, CheckCircle, AlertCircle, User, PenLine, BookOpen, Lock, ExternalLink, ShieldCheck, Trash2, Eye, EyeOff, Upload, Info } from "lucide-react";
import Navbar from "@/components/Navbar";
import Avatar from "@/components/Avatar";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfileWithUsernameChange, checkUsernameAvailable, fetchStoriesByAuthor, getUsernameCooldown, setSecurityAnswers, verifyRecoveryAnswers, uploadAvatar, removeAvatar } from "@/services/profiles";
import type { Story } from "@/types";
import { CATEGORIES } from "@/constants";
import { timeAgo } from "@/utils/time";
import { hasPin, setPin as savePin, removePin, verifyPin, SECURITY_QUESTIONS, getPinVault, savePinVault, removePinVault, generateSalt, hashSecurityAnswer } from "@/utils/pin";
import { supabase } from "@/lib/supabase";
import { KeyRound } from "lucide-react";

export default function SettingsPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername]       = useState("");
  const [bio, setBio]                 = useState("");
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [error, setError]             = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError]     = useState("");
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [activeTab, setActiveTab]     = useState<"profile" | "stories" | "security">("profile");
  const [myStories, setMyStories]     = useState<Story[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(false);

  // Quick-unlock PIN
  const [pinSet, setPinSet]           = useState(false);
  const [currentPin, setCurrentPin]   = useState("");
  const [newPin, setNewPin]           = useState("");
  const [confirmPin, setConfirmPin]   = useState("");
  const [pinError, setPinError]       = useState("");
  const [pinSaved, setPinSaved]       = useState(false);
  const [pinBusy, setPinBusy]         = useState(false);

  // PIN sign-in vault (device-local password vault unlocked by PIN + security questions)
  const [vaultEnabled, setVaultEnabled] = useState(false);

  // Account recovery questions (server-side, used for "forgot password/PIN")
  const [recoveryA1, setRecoveryA1]     = useState("");
  const [recoveryA2, setRecoveryA2]     = useState("");
  const [recoveryError, setRecoveryError] = useState("");
  const [recoverySaved, setRecoverySaved] = useState(false);
  const [recoveryBusy, setRecoveryBusy] = useState(false);

  // Change PIN & password (verified via security questions, no current password needed)
  const [changeStep, setChangeStep]     = useState<"verify" | "update">("verify");
  const [changeA1, setChangeA1]         = useState("");
  const [changeA2, setChangeA2]         = useState("");
  const [changeNewPin, setChangeNewPin] = useState("");
  const [changeConfirmPin, setChangeConfirmPin] = useState("");
  const [changeNewPassword, setChangeNewPassword] = useState("");
  const [changeConfirmPassword, setChangeConfirmPassword] = useState("");
  const [showChangePin, setShowChangePin] = useState(false);
  const [showChangeConfirmPin, setShowChangeConfirmPin] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showChangeConfirmPassword, setShowChangeConfirmPassword] = useState(false);
  const [changeError, setChangeError]   = useState("");
  const [changeSaved, setChangeSaved]   = useState(false);
  const [changeBusy, setChangeBusy]     = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
  }, [user, loading, router]);

  useEffect(() => {
    if (profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayName(profile.display_name || profile.full_name || "");
      setUsername(profile.username || "");
      setBio(profile.bio || "");
    }
  }, [profile]);

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPinSet(hasPin(user.id));
      setVaultEnabled(getPinVault()?.email === user.email);
    }
  }, [user]);

  const resetPinForm = () => {
    setCurrentPin(""); setNewPin(""); setConfirmPin(""); setPinError("");
  };

  const handleSavePin = async () => {
    if (!user) return;
    setPinError("");
    if (newPin.length !== 6) { setPinError("PIN must be exactly 6 digits"); return; }
    if (newPin !== confirmPin) { setPinError("PINs do not match"); return; }
    if (pinSet) {
      const ok = await verifyPin(user.id, currentPin);
      if (!ok) { setPinError("Current PIN is incorrect"); return; }
    }
    setPinBusy(true);
    await savePin(user.id, newPin);
    setPinBusy(false);
    setPinSet(true);
    resetPinForm();
    setPinSaved(true);
    setTimeout(() => setPinSaved(false), 3000);
  };

  const handleRemovePin = async () => {
    if (!user) return;
    setPinError("");
    const ok = await verifyPin(user.id, currentPin);
    if (!ok) { setPinError("Current PIN is incorrect"); return; }
    setPinBusy(true);
    removePin(user.id);
    setPinBusy(false);
    setPinSet(false);
    resetPinForm();
  };

  const handleRemoveVault = () => {
    removePinVault();
    setVaultEnabled(false);
  };

  const hasRecoveryAnswers = !!profile?.security_answers;

  const handleSaveRecovery = async () => {
    if (!user || !supabase) return;
    setRecoveryError("");
    if (!recoveryA1.trim() || !recoveryA2.trim()) { setRecoveryError("Answer both security questions"); return; }

    setRecoveryBusy(true);
    const salt = generateSalt();
    const answers = {
      [SECURITY_QUESTIONS[0].id]: await hashSecurityAnswer(salt, recoveryA1),
      [SECURITY_QUESTIONS[1].id]: await hashSecurityAnswer(salt, recoveryA2),
    };
    const { error: err } = await setSecurityAnswers(user.id, salt, answers);
    setRecoveryBusy(false);
    if (err) { setRecoveryError("Could not save your security questions"); return; }

    await refreshProfile();
    setRecoveryA1(""); setRecoveryA2("");
    setRecoverySaved(true);
    setTimeout(() => setRecoverySaved(false), 3000);
  };

  const resetChangeForm = () => {
    setChangeStep("verify");
    setChangeA1(""); setChangeA2("");
    setChangeNewPin(""); setChangeConfirmPin("");
    setChangeNewPassword(""); setChangeConfirmPassword("");
    setChangeError("");
  };

  const handleVerifyChange = async () => {
    if (!user || !user.email) return;
    setChangeError("");
    if (!changeA1.trim() || !changeA2.trim()) { setChangeError("Answer both security questions"); return; }

    setChangeBusy(true);
    const ok = await verifyRecoveryAnswers(user.email, {
      [SECURITY_QUESTIONS[0].id]: changeA1,
      [SECURITY_QUESTIONS[1].id]: changeA2,
    });
    setChangeBusy(false);
    if (!ok) { setChangeError("Those answers don't match our records"); return; }
    setChangeStep("update");
  };

  const handleSaveChange = async () => {
    if (!user || !user.email || !supabase) return;
    setChangeError("");

    const wantsPin = !!(changeNewPin || changeConfirmPin);
    const wantsPassword = !!(changeNewPassword || changeConfirmPassword);
    if (!wantsPin && !wantsPassword) { setChangeError("Enter a new PIN or password (or both)"); return; }
    if (wantsPin) {
      if (changeNewPin.length !== 6) { setChangeError("PIN must be exactly 6 digits"); return; }
      if (changeNewPin !== changeConfirmPin) { setChangeError("PINs do not match"); return; }
    }
    if (wantsPassword) {
      if (changeNewPassword.length < 8) { setChangeError("Password must be at least 8 characters"); return; }
      if (changeNewPassword !== changeConfirmPassword) { setChangeError("Passwords do not match"); return; }
    }
    setChangeBusy(true);

    try {
      if (wantsPassword) {
        const { error: err } = await supabase.auth.updateUser({ password: changeNewPassword });
        if (err) {
          setChangeError(err.message || "Could not update your password");
          return;
        }
      }

      if (wantsPin) {
        if (wantsPassword) {
          await savePinVault(user.email, changeNewPassword, changeNewPin, [SECURITY_QUESTIONS[0].id, SECURITY_QUESTIONS[1].id], [changeA1, changeA2]);
          setVaultEnabled(true);
        } else {
          await savePin(user.id, changeNewPin);
          setPinSet(true);
        }
      }

      setChangeNewPin(""); setChangeConfirmPin("");
      setChangeNewPassword(""); setChangeConfirmPassword("");
      setChangeSaved(true);
      setTimeout(() => { setChangeSaved(false); resetChangeForm(); }, 2500);
    } catch (e) {
      setChangeError(e instanceof Error ? e.message : "Something went wrong, please try again");
    } finally {
      setChangeBusy(false);
    }
  };

  useEffect(() => {
    if (activeTab === "stories" && user && myStories.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStoriesLoading(true);
      fetchStoriesByAuthor(user.id).then(s => {
        setMyStories(s);
        setStoriesLoading(false);
      });
    }
  }, [activeTab, user, myStories.length]);

  const { canChange: canChangeUsername, nextChangeDate } = getUsernameCooldown(profile);
  const usernameLocked = !canChangeUsername;

  const sameAsDisplayName = !!username.trim() && !!displayName.trim()
    && username.trim().toLowerCase() === displayName.trim().toLowerCase();

  // Username availability check
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!username || !user || username === profile?.username) { setUsernameError(""); return; }
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      setUsernameError("3–20 chars: lowercase, numbers, underscore only");
      return;
    }
    if (sameAsDisplayName) { setUsernameError(""); return; }
    setCheckingUsername(true);
    const t = setTimeout(async () => {
      const available = await checkUsernameAvailable(username, user.id);
      setUsernameError(available ? "" : "Username already exists");
      setCheckingUsername(false);
    }, 600);
    return () => clearTimeout(t);
  }, [username, user, profile?.username, sameAsDisplayName]);

  const handleSave = async () => {
    if (!user || usernameError || checkingUsername || sameAsDisplayName) return;
    const usernameChanged = username.trim() !== profile?.username;
    if (usernameChanged && usernameLocked) return;
    setSaving(true); setError(""); setSaved(false);
    const { error: err } = await updateProfileWithUsernameChange(user.id, {
      display_name: displayName.trim(),
      full_name: displayName.trim(),
      username: username.trim(),
      bio: bio.trim(),
    }, usernameChanged);
    if (err) { setError(err.message); setSaving(false); return; }
    await refreshProfile();
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { setAvatarError("Please choose an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { setAvatarError("Image must be under 5MB"); return; }
    setAvatarError("");
    setAvatarUploading(true);
    const { error: err } = await uploadAvatar(user.id, file);
    if (err) setAvatarError(err);
    else await refreshProfile();
    setAvatarUploading(false);
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    setAvatarUploading(true);
    await removeAvatar(user.id);
    await refreshProfile();
    setAvatarUploading(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-paper flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-gold animate-spin" style={{ borderTopColor: "transparent" }} />
    </div>
  );


  return (
    <div className="min-h-screen bg-paper">
      <Navbar theme="light" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <Link href={profile?.username ? `/profile/${profile.username}` : "/"}
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors mb-8">
          <ArrowLeft size={14} /> Back to profile
        </Link>

        <div className="grid md:grid-cols-[260px_1fr] gap-8">
          {/* Sidebar */}
          <div>
            <div className="rounded-2xl p-6 mb-4 text-center" style={{ background: "#0B0907" }}>
              <div className="mx-auto mb-3" style={{ width: 80, height: 80 }}>
                <Avatar src={profile?.avatar_url} name={displayName || username || "U"} size={80} />
              </div>
              <p className="font-display font-bold text-cream truncate">{displayName || username || "Your name"}</p>
              <p className="text-xs mb-4" style={{ color: "#6B6354" }}>@{username || "username"}</p>
              {profile?.username && (
                <Link href={`/profile/${profile.username}`}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors"
                  style={{ border: "1px solid rgba(245,166,35,0.25)", color: "#F5A623" }}>
                  View public profile <ExternalLink size={11} />
                </Link>
              )}
            </div>

            <nav className="flex md:flex-col gap-1 rounded-2xl p-1.5 border border-border">
              {([
                { id: "profile" as const, label: "Profile", Icon: User },
                { id: "stories" as const, label: "My Stories", Icon: BookOpen },
                { id: "security" as const, label: "Security", Icon: ShieldCheck },
              ]).map(({ id, label, Icon }) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  className="flex-1 flex items-center gap-2.5 px-4 py-2.5 text-sm rounded-xl transition-all text-left"
                  style={activeTab === id
                    ? { background: "rgba(245,166,35,0.12)", color: "#F5A623" }
                    : { color: "#6B6354" }}>
                  <Icon size={15} />{label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div>
            <h1 className="font-display text-3xl font-bold text-ink mb-6">
              {activeTab === "profile" ? "Edit profile" : activeTab === "stories" ? "My Stories" : "Security"}
            </h1>

            {activeTab === "profile" && (
              <div className="space-y-4">
                {/* Avatar card */}
                <div className="rounded-2xl p-5 border border-border flex items-center gap-4">
                  <Avatar src={profile?.avatar_url} name={displayName || profile?.username || "U"} size={64} />
                  <div className="flex-1">
                    <label className="flex items-center gap-1.5 text-xs font-medium mb-2" style={{ color: "#6B6354" }}>
                      Profile picture
                      <span tabIndex={0} title="Best results: center your face or logo in the frame, at least 200×200px. JPG or PNG, up to 5MB. We'll crop it to a circle."
                        className="inline-flex" style={{ color: "#6B6354" }}>
                        <Info size={12} />
                      </span>
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-full font-semibold cursor-pointer transition-colors hover:bg-saffron/10"
                        style={{ border: "1px solid rgba(245,166,35,0.4)", color: "#F5A623" }}>
                        {avatarUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                        {profile?.avatar_url ? "Change photo" : "Upload photo"}
                        <input type="file" accept="image/*" className="hidden" disabled={avatarUploading} onChange={handleAvatarChange} />
                      </label>
                      {profile?.avatar_url && (
                        <button onClick={handleRemoveAvatar} disabled={avatarUploading}
                          className="text-xs px-4 py-2 rounded-full disabled:opacity-40 transition-colors"
                          style={{ border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                          Remove
                        </button>
                      )}
                    </div>
                    {avatarError && (
                      <p className="text-xs mt-2 flex items-center gap-1" style={{ color: "#dc2626" }}>
                        <AlertCircle size={11} /> {avatarError}
                      </p>
                    )}
                    <p className="text-xs mt-2" style={{ color: "#3A3028" }}>Center your face or logo, at least 200×200px. JPG or PNG, up to 5MB.</p>
                  </div>
                </div>

                {/* Display name card */}
                <div className="rounded-2xl p-5 border border-border">
                  <label className="block text-xs font-medium mb-2" style={{ color: "#6B6354" }}>Display name</label>
                  <input
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Your full name or pen name"
                    maxLength={50}
                    className="w-full bg-transparent text-sm px-4 py-3 rounded-xl border border-border focus:outline-none focus:border-saffron transition-colors text-ink"
                  />
                  <p className="text-xs mt-2" style={{ color: "#6B6354" }}>This is the name shown on your stories and profile. You can change it anytime.</p>
                </div>

                {/* Username card */}
                <div className="rounded-2xl p-5 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium" style={{ color: "#6B6354" }}>Username</label>
                    {usernameLocked && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "#6B6354" }}>
                        <Lock size={11} /> Locked
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#6B6354" }}>@</span>
                    <input
                      value={username}
                      onChange={e => setUsername(e.target.value.toLowerCase())}
                      placeholder="your_username"
                      maxLength={20}
                      disabled={usernameLocked}
                      className={`w-full bg-transparent text-sm pl-8 pr-10 py-3 rounded-xl border focus:outline-none focus:border-saffron transition-colors text-ink disabled:opacity-50 ${
                        usernameError || sameAsDisplayName ? "border-red-400" : "border-border"
                      }`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {checkingUsername && <Loader2 size={14} className="animate-spin" style={{ color: "#6B6354" }} />}
                      {!checkingUsername && !usernameError && !sameAsDisplayName && username && username !== profile?.username && !usernameLocked && (
                        <CheckCircle size={14} style={{ color: "#16a34a" }} />
                      )}
                    </div>
                  </div>
                  {sameAsDisplayName ? (
                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "#dc2626" }}>
                      <AlertCircle size={11} /> Username and display name cannot be the same
                    </p>
                  ) : usernameError && (
                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "#dc2626" }}>
                      <AlertCircle size={11} /> {usernameError}
                    </p>
                  )}
                  <p className="text-xs mt-2" style={{ color: "#3A3028" }}>
                    lekhsetu.com/profile/{username || "username"}
                  </p>
                  {usernameLocked && nextChangeDate ? (
                    <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: "#F5A623" }}>
                      <Lock size={11} /> You can change your username again on {nextChangeDate.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}.
                    </p>
                  ) : (
                    <p className="text-xs mt-2" style={{ color: "#3A3028" }}>
                      You can change your username once every 2 months.
                    </p>
                  )}
                </div>

                {/* Bio card */}
                <div className="rounded-2xl p-5 border border-border">
                  <label className="block text-xs font-medium mb-2" style={{ color: "#6B6354" }}>Bio</label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="Tell readers a bit about yourself…"
                    rows={4}
                    maxLength={200}
                    className="w-full bg-transparent text-sm px-4 py-3 rounded-xl border border-border focus:outline-none focus:border-saffron resize-none text-ink"
                  />
                  <p className="text-xs text-right mt-1" style={{ color: "#6B6354" }}>{bio.length}/200</p>
                </div>

                {error && (
                  <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(220,38,38,0.06)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.2)" }}>
                    {error}
                  </p>
                )}

                {saved && (
                  <p className="text-xs px-3 py-2 rounded-lg flex items-center gap-2"
                    style={{ background: "rgba(22,163,74,0.06)", color: "#16a34a", border: "1px solid rgba(22,163,74,0.2)" }}>
                    <CheckCircle size={12} /> Profile updated successfully
                  </p>
                )}

                <button onClick={handleSave} disabled={saving || !!usernameError || checkingUsername || sameAsDisplayName || (username.trim() !== profile?.username && usernameLocked)}
                  className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm disabled:opacity-40 transition-colors hover:bg-saffron/10"
                  style={{ border: "1px solid rgba(245,166,35,0.4)", color: "#F5A623" }}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            )}

            {activeTab === "stories" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <p className="text-sm text-muted">{myStories.length} published stories</p>
                  <Link href="/write"
                    className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-full font-semibold"
                    style={{ background: "#F5A623", color: "#0B0907" }}>
                    <PenLine size={12} /> New story
                  </Link>
                </div>

                {storiesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="animate-pulse h-20 rounded-xl bg-border" />
                    ))}
                  </div>
                ) : myStories.length === 0 ? (
                  <div className="text-center py-16">
                    <PenLine size={32} className="mx-auto mb-4" style={{ color: "#3A3028" }} />
                    <p className="text-ink font-display text-xl font-bold mb-2">No stories yet</p>
                    <Link href="/write"
                      className="inline-flex items-center gap-2 mt-4 text-sm px-5 py-2.5 rounded-full font-semibold"
                      style={{ background: "#F5A623", color: "#0B0907" }}>
                      Write your first story
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myStories.map(story => {
                      const cat = CATEGORIES.find(c => c.id === story.category);
                      return (
                        <div key={story.id} className="group flex items-start gap-4 p-4 rounded-xl border border-border transition-colors hover:border-saffron/30">
                          <div className="flex-1 min-w-0">
                            <Link href={`/story/${story.id}`}
                              className="font-display font-bold text-ink group-hover:text-saffron transition-colors text-sm leading-snug line-clamp-1 block mb-1">
                              {story.title}
                            </Link>
                            <div className="flex items-center gap-3 flex-wrap">
                              {cat && (
                                <span className="text-xs px-2 py-0.5 rounded-full"
                                  style={{ background: `${cat.color}18`, color: cat.color }}>
                                  {cat.emoji} {cat.label}
                                </span>
                              )}
                              <span className="text-xs text-muted">{timeAgo(story.created_at)}</span>
                              <span className="text-xs text-muted">{story.views_count ?? 0} reads</span>
                              {story.anonymous && <span className="text-xs text-muted">Anonymous</span>}
                            </div>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <Link href={`/write?edit=${story.id}`}
                              className="text-xs px-3 py-1.5 rounded-full"
                              style={{ border: "1px solid rgba(245,166,35,0.2)", color: "#F5A623" }}>
                              Edit
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-4">
                <div className="rounded-2xl p-5 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium" style={{ color: "#6B6354" }}>Quick-unlock PIN</label>
                    {pinSet && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "#16a34a" }}>
                        <CheckCircle size={11} /> Enabled
                      </span>
                    )}
                  </div>
                  <p className="text-xs mb-4" style={{ color: "#3A3028" }}>
                    Set a 6-digit PIN to quickly re-enter Lekhsetu on this device without typing your password again.
                    This is stored only on this device and does not replace your account password.
                  </p>

                  {pinSet && (
                    <div className="mb-3">
                      <label className="block text-xs font-medium mb-2" style={{ color: "#6B6354" }}>Current PIN</label>
                      <input
                        type="password" inputMode="numeric" maxLength={6} value={currentPin}
                        onChange={e => setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="••••••"
                        className="w-40 bg-transparent text-sm px-4 py-3 rounded-xl border border-border focus:outline-none focus:border-saffron transition-colors text-ink tracking-[0.4em]"
                      />
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-3 mb-2">
                    <div>
                      <label className="block text-xs font-medium mb-2" style={{ color: "#6B6354" }}>{pinSet ? "New PIN" : "PIN"}</label>
                      <input
                        type="password" inputMode="numeric" maxLength={6} value={newPin}
                        onChange={e => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="6 digits"
                        className="w-full bg-transparent text-sm px-4 py-3 rounded-xl border border-border focus:outline-none focus:border-saffron transition-colors text-ink tracking-[0.4em]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-2" style={{ color: "#6B6354" }}>Confirm PIN</label>
                      <input
                        type="password" inputMode="numeric" maxLength={6} value={confirmPin}
                        onChange={e => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="6 digits"
                        className="w-full bg-transparent text-sm px-4 py-3 rounded-xl border border-border focus:outline-none focus:border-saffron transition-colors text-ink tracking-[0.4em]"
                      />
                    </div>
                  </div>

                  {pinError && (
                    <p className="text-xs mt-2 flex items-center gap-1" style={{ color: "#dc2626" }}>
                      <AlertCircle size={11} /> {pinError}
                    </p>
                  )}
                  {pinSaved && (
                    <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: "#16a34a" }}>
                      <CheckCircle size={11} /> PIN saved
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-4">
                    <button onClick={handleSavePin} disabled={pinBusy || newPin.length !== 6 || confirmPin.length !== 6 || (pinSet && currentPin.length !== 6)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm disabled:opacity-40 transition-all hover:scale-105 active:scale-95"
                      style={{ background: "#F5A623", color: "#0B0907" }}>
                      {pinBusy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      {pinSet ? "Update PIN" : "Set PIN"}
                    </button>
                    {pinSet && (
                      <button onClick={handleRemovePin} disabled={pinBusy || currentPin.length !== 6}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm disabled:opacity-40 transition-colors"
                        style={{ border: "1px solid rgba(239,68,68,0.25)", color: "#dc2626" }}>
                        <Trash2 size={14} /> Remove PIN
                      </button>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl p-5 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 text-xs font-medium" style={{ color: "#6B6354" }}>
                      <ShieldCheck size={13} /> Account recovery questions
                    </label>
                    {hasRecoveryAnswers && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "#16a34a" }}>
                        <CheckCircle size={11} /> Set
                      </span>
                    )}
                  </div>
                  <p className="text-xs mb-4" style={{ color: "#3A3028" }}>
                    Answer both questions so you can recover your account if you ever forget your password or PIN.
                    Only a secured hash of your answers is stored, never the answers themselves.
                  </p>

                  <div className="space-y-3 mb-3">
                    {SECURITY_QUESTIONS.map((q, i) => (
                      <div key={q.id}>
                        <label className="block text-xs font-medium mb-2" style={{ color: "#6B6354" }}>{q.label}</label>
                        <input
                          type="text" value={[recoveryA1, recoveryA2][i]}
                          onChange={e => [setRecoveryA1, setRecoveryA2][i](e.target.value)}
                          placeholder="Your answer"
                          className="w-full bg-transparent text-sm px-4 py-3 rounded-xl border border-border focus:outline-none focus:border-saffron transition-colors text-ink"
                        />
                      </div>
                    ))}
                  </div>

                  {recoveryError && (
                    <p className="text-xs mt-2 flex items-center gap-1" style={{ color: "#dc2626" }}>
                      <AlertCircle size={11} /> {recoveryError}
                    </p>
                  )}
                  {recoverySaved && (
                    <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: "#16a34a" }}>
                      <CheckCircle size={11} /> Recovery questions saved
                    </p>
                  )}

                  <button onClick={handleSaveRecovery}
                    disabled={recoveryBusy || !recoveryA1.trim() || !recoveryA2.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm disabled:opacity-40 transition-all hover:scale-105 active:scale-95 mt-4"
                    style={{ background: "#F5A623", color: "#0B0907" }}>
                    {recoveryBusy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {hasRecoveryAnswers ? "Update recovery answers" : "Save recovery answers"}
                  </button>
                </div>

                <div className="rounded-2xl p-5 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 text-xs font-medium" style={{ color: "#6B6354" }}>
                      <KeyRound size={13} /> Change PIN & password
                    </label>
                    {vaultEnabled && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "#16a34a" }}>
                        <CheckCircle size={11} /> PIN sign-in enabled
                      </span>
                    )}
                  </div>
                  <p className="text-xs mb-4" style={{ color: "#3A3028" }}>
                    Answer your two security questions, then change your PIN, your password, or both, whichever you need.
                  </p>

                  {changeStep === "verify" ? (
                    <>
                      <div className="space-y-3 mb-3">
                        {SECURITY_QUESTIONS.map((q, i) => (
                          <div key={q.id}>
                            <label className="block text-xs font-medium mb-2" style={{ color: "#6B6354" }}>{q.label}</label>
                            <input
                              type="text" value={[changeA1, changeA2][i]}
                              onChange={e => [setChangeA1, setChangeA2][i](e.target.value)}
                              placeholder="Your answer"
                              className="w-full bg-transparent text-sm px-4 py-3 rounded-xl border border-border focus:outline-none focus:border-saffron transition-colors text-ink"
                            />
                          </div>
                        ))}
                      </div>

                      {changeError && (
                        <p className="text-xs mt-2 flex items-center gap-1" style={{ color: "#dc2626" }}>
                          <AlertCircle size={11} /> {changeError}
                        </p>
                      )}

                      <button onClick={handleVerifyChange}
                        disabled={changeBusy || !changeA1.trim() || !changeA2.trim()}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm disabled:opacity-40 transition-all hover:scale-105 active:scale-95 mt-4"
                        style={{ background: "#F5A623", color: "#0B0907" }}>
                        {changeBusy ? <Loader2 size={14} className="animate-spin" /> : null}
                        Continue
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="grid sm:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-medium mb-2" style={{ color: "#6B6354" }}>New PIN</label>
                          <div className="relative">
                            <input
                              type={showChangePin ? "text" : "password"} inputMode="numeric" maxLength={6} value={changeNewPin}
                              onChange={e => setChangeNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                              placeholder="6 digits"
                              className="w-full bg-transparent text-sm px-4 py-3 pr-10 rounded-xl border border-border focus:outline-none focus:border-saffron transition-colors text-ink tracking-[0.4em]"
                            />
                            <button type="button" onClick={() => setShowChangePin(v => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: "#6B6354" }}>
                              {showChangePin ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-2" style={{ color: "#6B6354" }}>Confirm PIN</label>
                          <div className="relative">
                            <input
                              type={showChangeConfirmPin ? "text" : "password"} inputMode="numeric" maxLength={6} value={changeConfirmPin}
                              onChange={e => setChangeConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                              placeholder="6 digits"
                              className="w-full bg-transparent text-sm px-4 py-3 pr-10 rounded-xl border border-border focus:outline-none focus:border-saffron transition-colors text-ink tracking-[0.4em]"
                            />
                            <button type="button" onClick={() => setShowChangeConfirmPin(v => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: "#6B6354" }}>
                              {showChangeConfirmPin ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-medium mb-2" style={{ color: "#6B6354" }}>New password</label>
                          <div className="relative">
                            <input
                              type={showChangePassword ? "text" : "password"} value={changeNewPassword}
                              onChange={e => setChangeNewPassword(e.target.value)}
                              placeholder="Min 8 characters"
                              className="w-full bg-transparent text-sm px-4 py-3 pr-10 rounded-xl border border-border focus:outline-none focus:border-saffron transition-colors text-ink"
                            />
                            <button type="button" onClick={() => setShowChangePassword(v => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: "#6B6354" }}>
                              {showChangePassword ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-2" style={{ color: "#6B6354" }}>Confirm password</label>
                          <div className="relative">
                            <input
                              type={showChangeConfirmPassword ? "text" : "password"} value={changeConfirmPassword}
                              onChange={e => setChangeConfirmPassword(e.target.value)}
                              placeholder="Re-enter new password"
                              className="w-full bg-transparent text-sm px-4 py-3 pr-10 rounded-xl border border-border focus:outline-none focus:border-saffron transition-colors text-ink"
                            />
                            <button type="button" onClick={() => setShowChangeConfirmPassword(v => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: "#6B6354" }}>
                              {showChangeConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {changeError && (
                        <p className="text-xs mt-2 flex items-center gap-1" style={{ color: "#dc2626" }}>
                          <AlertCircle size={11} /> {changeError}
                        </p>
                      )}
                      {changeSaved && (
                        <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: "#16a34a" }}>
                          <CheckCircle size={11} /> Saved
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-4">
                        <button onClick={handleSaveChange}
                          disabled={changeBusy || (!changeNewPin && !changeConfirmPin && !changeNewPassword && !changeConfirmPassword)}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm disabled:opacity-40 transition-all hover:scale-105 active:scale-95"
                          style={{ background: "#F5A623", color: "#0B0907" }}>
                          {changeBusy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                          Save changes
                        </button>
                        <button onClick={resetChangeForm}
                          className="text-xs font-medium transition-colors" style={{ color: "#6B6354" }}>
                          Cancel
                        </button>
                      </div>
                    </>
                  )}

                  {vaultEnabled && (
                    <button onClick={handleRemoveVault}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-colors mt-4"
                      style={{ border: "1px solid rgba(239,68,68,0.25)", color: "#dc2626" }}>
                      <Trash2 size={14} /> Turn off PIN sign-in on this device
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
