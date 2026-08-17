// Every category a story can be written or filed under. The first 10 are the
// emotionally resonant, life-experience categories the platform first launched
// with; the rest reopen the wider topic range (knowledge, tech, art, fiction,
// and more) so Lekhsetu covers anything someone genuinely wants to write,
// not just personal-failure narratives. IDs map to existing DB values so no
// migration is needed for stories already published under them.
export const CATEGORIES = [
  { id: "firstjob",    label: "First Job",         emoji: "🧑‍💼", color: "#15803d" },
  { id: "failure",     label: "Failure & Comeback", emoji: "🔁", color: "#b91c1c" },
  { id: "love",        label: "Love & Heartbreak",  emoji: "💔", color: "#db2777" },
  { id: "family",      label: "Family",             emoji: "👨‍👩‍👧", color: "#b45309" },
  { id: "studentlife", label: "Student Life",       emoji: "🏫", color: "#2563eb" },
  { id: "startup",     label: "Career & Business",  emoji: "🚀", color: "#4338ca" },
  { id: "immigration", label: "New Beginnings",     emoji: "🌍", color: "#0e7490" },
  { id: "mentalhealth",label: "Mental Health",      emoji: "🧠", color: "#7c3aed" },
  { id: "confessions", label: "Confessions",        emoji: "🤫", color: "#6d28d9" },
  { id: "life",        label: "Life Lessons",       emoji: "🌱", color: "#e8751a" },
  { id: "career",          label: "Career",             emoji: "💼", color: "#1a6b5e" },
  { id: "knowledge",       label: "Knowledge",          emoji: "📚", color: "#7a5c2e" },
  { id: "tech",            label: "Technology",         emoji: "⚡", color: "#2563eb" },
  { id: "finance",         label: "Finance",            emoji: "💰", color: "#16a34a" },
  { id: "health",          label: "Wellbeing",          emoji: "🧘", color: "#9333ea" },
  { id: "relationships",   label: "Relationships",      emoji: "❤️", color: "#dc2626" },
  { id: "heartbreak",      label: "Heartbreak",         emoji: "💔", color: "#9f1239" },
  { id: "marriage",        label: "Marriage",           emoji: "💍", color: "#c026d3" },
  { id: "friendship",      label: "Friendship",         emoji: "🤝", color: "#0d9488" },
  { id: "parenting",       label: "Parenting",          emoji: "👶", color: "#f59e0b" },
  { id: "layoff",          label: "Layoffs",            emoji: "📉", color: "#b91c1c" },
  { id: "success",         label: "Success",            emoji: "🏆", color: "#ca8a04" },
  { id: "motivation",      label: "Motivation",         emoji: "🔥", color: "#ea4335" },
  { id: "selfimprovement", label: "Self Improvement",   emoji: "📈", color: "#059669" },
  { id: "entrepreneurship",label: "Entrepreneurship",   emoji: "🏗️", color: "#3730a3" },
  { id: "job",             label: "Job Search",         emoji: "🧳", color: "#0f766e" },
  { id: "education",       label: "Education",          emoji: "🎓", color: "#1d4ed8" },
  { id: "exams",           label: "Exam Journeys",      emoji: "📝", color: "#0891b2" },
  { id: "travel",          label: "Travel",             emoji: "✈️", color: "#0284c7" },
  { id: "culture",         label: "Culture",            emoji: "🪔", color: "#ea580c" },
  { id: "spirituality",    label: "Spirituality",       emoji: "🙏", color: "#a16207" },
  { id: "nostalgia",       label: "Nostalgia",          emoji: "🕰️", color: "#a8a29e" },
  { id: "smalltown",       label: "Small Town",         emoji: "🏡", color: "#a16207" },
  { id: "women",           label: "Women's Stories",    emoji: "👩", color: "#e11d48" },
  { id: "lgbtq",           label: "LGBTQ+",             emoji: "🌈", color: "#9333ea" },
  { id: "socialissues",    label: "Social Issues",      emoji: "⚖️", color: "#475569" },
  { id: "army",            label: "Armed Forces",       emoji: "🎖️", color: "#4d7c0f" },
  { id: "sports",          label: "Sports",             emoji: "🏅", color: "#d97706" },
  { id: "art",             label: "Art",                emoji: "🎨", color: "#be185d" },
  { id: "music",           label: "Music",              emoji: "🎵", color: "#7e22ce" },
  { id: "writing",         label: "Writing & Poetry",   emoji: "✍️", color: "#92400e" },
  { id: "books",           label: "Books",              emoji: "📖", color: "#854d0e" },
  { id: "cinema",          label: "Cinema",             emoji: "🎬", color: "#9333ea" },
  { id: "food",            label: "Food",               emoji: "🍲", color: "#c2410c" },
  { id: "fashion",         label: "Fashion",            emoji: "👗", color: "#db2777" },
  { id: "fiction",         label: "Fiction",            emoji: "📜", color: "#44403c" },
  { id: "nature",          label: "Nature",             emoji: "🌿", color: "#16a34a" },
  { id: "science",         label: "Science",            emoji: "🔬", color: "#0369a1" },
  { id: "history",         label: "History",            emoji: "🏺", color: "#78350f" },
  { id: "politics",        label: "Politics",           emoji: "🏛️", color: "#374151" },
];

// Kept for backward compatibility with the CATEGORIES.find(...) ?? LEGACY_CATEGORIES.find(...)
// lookup pattern used elsewhere. Everything it used to hold now lives in CATEGORIES above.
export const LEGACY_CATEGORIES: typeof CATEGORIES = [];

// Maps an Indian state/region name (as commonly returned by reverse-geocoding
// services) to the language code readers there are most likely to prefer,
// used to auto-show the matching translation of a multi-language story.
export const STATE_LANGUAGE_MAP: Record<string, string> = {
  "karnataka": "kn",
  "kerala": "ml",
  "lakshadweep": "ml",
  "maharashtra": "mr",
  "goa": "mr",
  "delhi": "hi",
  "uttar pradesh": "hi",
  "bihar": "hi",
  "madhya pradesh": "hi",
  "rajasthan": "hi",
  "haryana": "hi",
  "jharkhand": "hi",
  "chhattisgarh": "hi",
  "uttarakhand": "hi",
  "himachal pradesh": "hi",
};

export const LANGUAGES = [
  { code: "en", label: "English",   native: "English"  },
  { code: "hi", label: "Hindi",     native: "हिंदी"    },
  { code: "kn", label: "Kannada",   native: "ಕನ್ನಡ"    },
  { code: "mr", label: "Marathi",   native: "मराठी"    },
  { code: "ml", label: "Malayalam", native: "മലയാളം"  },
];
