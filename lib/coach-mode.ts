"use client";

const COACH_COOKIE = "wuxue_coach";
const COACH_KEY = "wuxue:coach-mode";
const ONE_YEAR = 365 * 24 * 60 * 60;

export function isCoachMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(COACH_KEY) === "1";
}

export function setCoachMode(enabled: boolean): void {
  if (typeof window === "undefined") return;
  if (enabled) {
    localStorage.setItem(COACH_KEY, "1");
    document.cookie = `${COACH_COOKIE}=1; path=/; SameSite=Lax; max-age=${ONE_YEAR}`;
  } else {
    localStorage.removeItem(COACH_KEY);
    document.cookie = `${COACH_COOKIE}=; path=/; SameSite=Lax; max-age=0`;
  }
}
