import type { Metadata } from "next";
import { fetchStoryById } from "@/services/stories";
import StoryView from "./StoryView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const story = await fetchStoryById(id);

  if (!story) {
    return { title: "Story not found: Lekhsetu" };
  }

  const title = `${story.title}: Lekhsetu`;
  const description = story.excerpt || "Read this real story on Lekhsetu.";
  const authorName = story.anonymous
    ? "Anonymous"
    : story.profiles?.display_name || story.profiles?.full_name || story.profiles?.username || "Anonymous";

  return {
    title,
    description,
    authors: [{ name: authorName }],
    openGraph: {
      type: "article",
      title,
      description,
      publishedTime: story.created_at,
      modifiedTime: story.updated_at,
      tags: story.tags,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function StoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StoryView id={id} />;
}
