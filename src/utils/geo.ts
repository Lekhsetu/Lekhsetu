import { STATE_LANGUAGE_MAP } from "@/constants";

const LANG_KEY = "lekhsetu_lang";
const GEO_PROMPT_KEY = "lekhsetu_geo_prompted";

export type DetectedLocation = {
  country: string | null;
  city: string | null;
  state: string | null;
  languageCode: string | null;
};

/** Reader's preferred reading language, used to pick the matching translation of a story. */
export function getPreferredLanguage(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LANG_KEY);
}

export function setPreferredLanguage(code: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LANG_KEY, code);
}

export function hasBeenPromptedForLocation(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(GEO_PROMPT_KEY) === "1";
}

export function markLocationPrompted() {
  if (typeof window === "undefined") return;
  localStorage.setItem(GEO_PROMPT_KEY, "1");
}

/**
 * Requests browser geolocation permission and reverse-geocodes the
 * coordinates via BigDataCloud's free, key-less client API to determine
 * the reader's country/state/city and a matching content language.
 */
export function detectLocation(): Promise<DetectedLocation | null> {
  return new Promise(resolve => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`
          );
          const data = await res.json();
          const state: string | null = data.principalSubdivision ?? null;
          const country: string | null = data.countryName ?? null;
          const city: string | null = data.city || data.locality || null;
          const languageCode = state ? STATE_LANGUAGE_MAP[state.toLowerCase()] ?? null : null;
          resolve({ country, city, state, languageCode });
        } catch {
          resolve(null);
        }
      },
      () => resolve(null),
      { timeout: 8000 }
    );
  });
}
