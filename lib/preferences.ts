"use client";

const QUICK_MODE_KEY = "wuxue:quick-mode";
const HAND_TRACKING_KEY = "wuxue:hand-tracking";
const SHOW_REFERENCE_KEY = "wuxue:show-reference";
const LEG_CLASSIFIER_DEBUG_KEY = "wuxue:leg-classifier-debug";

function isMobileUA(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/** Quick Mode: single-view capture, marks score as preliminary. Default off. */
export function isQuickMode(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(QUICK_MODE_KEY) === "1";
}

export function setQuickMode(enabled: boolean): void {
  if (typeof window === "undefined") return;
  if (enabled) window.localStorage.setItem(QUICK_MODE_KEY, "1");
  else window.localStorage.removeItem(QUICK_MODE_KEY);
}

/**
 * Hand tracking: default enabled on desktop, disabled on mobile.
 * Returns null when unset — callers should pick the UA default.
 */
export function getHandTrackingPref(): boolean | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(HAND_TRACKING_KEY);
  if (raw === null) return null;
  return raw === "1";
}

export function isHandTrackingEnabled(): boolean {
  const pref = getHandTrackingPref();
  if (pref !== null) return pref;
  return !isMobileUA();
}

export function setHandTracking(enabled: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HAND_TRACKING_KEY, enabled ? "1" : "0");
}

/** Clear explicit hand-tracking preference, falling back to UA default. */
export function resetHandTracking(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(HAND_TRACKING_KEY);
}

/** Reference skeleton overlay: default ON. */
export function showReferenceSkeleton(): boolean {
  if (typeof window === "undefined") return true;
  const raw = window.localStorage.getItem(SHOW_REFERENCE_KEY);
  return raw !== "0";
}

export function setShowReferenceSkeleton(enabled: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SHOW_REFERENCE_KEY, enabled ? "1" : "0");
}

/** Dev-only leg classifier debug overlay. Default OFF. */
export function showLegClassifierDebug(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(LEG_CLASSIFIER_DEBUG_KEY) === "1";
}

export function setLegClassifierDebug(enabled: boolean): void {
  if (typeof window === "undefined") return;
  if (enabled) window.localStorage.setItem(LEG_CLASSIFIER_DEBUG_KEY, "1");
  else window.localStorage.removeItem(LEG_CLASSIFIER_DEBUG_KEY);
}
