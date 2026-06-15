"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronDown, HelpCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const FAQS: { category: string; items: { q: string; a: string }[] }[] = [
  {
    category: "Getting started",
    items: [
      { q: "What is Lekhsetu?", a: "A home for real, first-hand stories, written by people in the language they think in, and read by people in the language they understand best." },
      { q: "How do I create an account?", a: "Tap \"Sign in\" in the top navigation, then switch to \"Sign up\". You'll choose a username and can fill in your name and bio anytime from Settings." },
      { q: "What's the fastest way to sign in next time?", a: "Set up a quick-unlock PIN from Settings → Security. It lets you sign back in on this device without typing your password each time." },
    ],
  },
  {
    category: "Finding & reading stories",
    items: [
      { q: "Where do I browse stories?", a: "Go to \"Stories\" in the navigation to open Explore. From there you can search by keyword, filter by category, and switch between languages." },
      { q: "Can I read a story in my own language even if the writer published it in a different one?", a: "Yes. If the writer published versions in multiple languages, use the language switcher on the story page to pick one. If your language isn't available, the story is translated for you automatically based on your language preference." },
      { q: "How does Lekhsetu pick my language automatically?", a: "When you allow location access (the prompt in the corner of the screen), we match your region to a language and remember it. You can change this anytime from your browser's location settings." },
      { q: "What's the 🕊️ button for?", a: "It's a one-tap \"this moved me\" reaction. Tap once to send it, tap again to take it back." },
      { q: "How do I leave a comment?", a: "Scroll to the Comments section at the bottom of any story, sign in if you haven't already, and write your reply." },
      { q: "How does Lekhsetu decide what shows up on my Explore feed and the homepage sidebar?", a: "It's based on real reader activity, claps, comments, and reads across the platform, blended with recency so fresh stories still get seen." },
      { q: "How do I report inappropriate content?", a: "Open the story, use the report option, and choose a reason. Our moderation team reviews every report." },
    ],
  },
  {
    category: "Writing & publishing",
    items: [
      { q: "Where do I start writing?", a: "Tap \"Write\" in the navigation. You'll get a title, category, tags, and a rich text editor for your story." },
      { q: "Can I save a draft and come back later?", a: "Yes, your story autosaves as a draft. Unfinished drafts appear in your Dashboard under \"Your stories\" so you can pick up where you left off." },
      { q: "Can I publish the same story in multiple languages at once?", a: "Yes. Open \"Translate & publish\" before publishing and pick any other languages. Your story goes live as one article that readers can switch between by language, it won't appear as multiple separate posts." },
      { q: "What's the Series toggle for?", a: "Turn it on if your story is part of a multi-part series. Add a series title and part number so readers can find and follow the rest." },
      { q: "Can I publish without anyone knowing it's me?", a: "Yes. Toggle \"Anonymous\" before publishing to hide your name and profile from readers. We keep an internal record only for moderation and legal purposes, as explained in our Privacy Policy." },
      { q: "How do I edit or delete a story after publishing?", a: "Go to your Dashboard, find the story, and use the Edit or Delete options. If it was published in multiple languages, editing or deleting affects all of them together since they're one post." },
    ],
  },
  {
    category: "Your profile & dashboard",
    items: [
      { q: "What's the difference between Dashboard and Profile?", a: "Dashboard (only visible to you) shows your stories with reads, claps, and comments for each. Profile is your public page that other readers see, showing your published stories, bio, and stats." },
      { q: "How do I add or change my profile picture?", a: "Go to Settings → Profile and use \"Upload photo\" under Profile picture. A square JPG or PNG works best." },
      { q: "How do I share my profile or a story?", a: "Use the Share button on your profile page or on any story to copy a link or share it directly, great for inviting friends to read or follow your writing." },
      { q: "Can I change my username?", a: "Yes, from Settings → Profile. Usernames can be changed once every 2 months." },
    ],
  },
  {
    category: "Account & security",
    items: [
      { q: "I forgot my password, what do I do?", a: "Use the \"Forgot password\" link on the sign-in page. You'll verify your identity using your security questions to reset it." },
      { q: "How do account recovery questions work?", a: "Set them up once in Settings → Security. They let you reset your password or PIN without needing email access." },
      { q: "Can I delete my account?", a: "Yes. Contact us and we'll delete your account and associated data, as described in our Privacy Policy." },
    ],
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 text-left px-4 sm:px-5 py-4 transition-colors hover:bg-black/[0.02]">
        <span className="font-display font-semibold text-ink text-sm sm:text-base">{q}</span>
        <ChevronDown size={16} className={`flex-shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`px-4 sm:px-5 overflow-hidden transition-all duration-300 ${open ? "max-h-60 pb-4 opacity-100" : "max-h-0 opacity-0"}`}>
        <p className="text-sm leading-7 text-muted">{a}</p>
      </div>
    </div>
  );
}

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-paper">
      <Navbar theme="light" />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-rule w-10" />
            <span className="text-xs tracking-widest uppercase flex items-center gap-1.5" style={{ color: "#F5A623" }}>
              <HelpCircle size={12} /> Help
            </span>
          </div>
          <h1 className="font-display text-4xl font-bold text-ink mb-3">Help & how to use Lekhsetu</h1>
          <p className="text-muted">A quick guide to everything you can do on Lekhsetu, reading, writing, your profile, and your account.</p>
        </div>

        <div className="space-y-8">
          {FAQS.map(group => (
            <section key={group.category}>
              <h2 className="text-xs tracking-widest uppercase mb-3" style={{ color: "#6B6354" }}>{group.category}</h2>
              <div className="space-y-2.5">
                {group.items.map(item => <FaqItem key={item.q} q={item.q} a={item.a} />)}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 pt-8 border-t border-border">
          <p className="text-sm text-muted">
            Still have questions? Reach us at <span style={{ color: "#F5A623" }}>lekhsetu@gmail.com</span>, or read our{" "}
            <Link href="/about" className="hover:text-saffron transition-colors underline">About page</Link>,{" "}
            <Link href="/privacy" className="hover:text-saffron transition-colors underline">Privacy Policy</Link>, or{" "}
            <Link href="/terms" className="hover:text-saffron transition-colors underline">Terms of Service</Link>.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
