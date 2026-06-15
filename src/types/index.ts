export type Profile = {
  id: string;
  username: string;
  display_name: string;
  full_name: string;
  bio: string;
  avatar_url?: string;
  country?: string;
  city?: string;
  preferred_categories?: string[];
  preferred_language?: string;
  onboarding_completed?: boolean;
  is_admin?: boolean;
  is_banned?: boolean;
  username_changed_at?: string;
  security_salt?: string | null;
  security_answers?: Record<string, string> | null;
  created_at: string;
};

export type Story = {
  id: string;
  author_id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  language: string;
  tags: string[];
  read_time: number;
  published: boolean;
  featured: boolean;
  likes_count: number;
  views_count: number;
  anonymous: boolean;
  series_title?: string;
  series_part?: number;
  translation_group_id?: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
};

export type Comment = {
  id: string;
  story_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Pick<Profile, "display_name" | "full_name" | "username" | "avatar_url">;
};

