import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/explore`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${siteUrl}/about`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/faq`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/feedback`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/revenue-sharing`, changeFrequency: "monthly", priority: 0.3 },
  ];

  if (!supabase) return staticRoutes;

  const { data } = await supabase
    .from("stories")
    .select("id, updated_at")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(1000);

  const storyRoutes: MetadataRoute.Sitemap = (data ?? []).map(s => ({
    url: `${siteUrl}/story/${s.id}`,
    lastModified: s.updated_at ?? undefined,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...storyRoutes];
}
