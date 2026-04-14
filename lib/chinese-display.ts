"use client";

import { useEffect, useState } from "react";

export type ChineseDisplayMode = "english" | "pinyin" | "characters" | "full";

const KEY = "wuxue:chinese-display";
const DEFAULT: ChineseDisplayMode = "full";

export const CHINESE_DISPLAY_MODES: {
  value: ChineseDisplayMode;
  label: string;
}[] = [
  { value: "english", label: "English Only" },
  { value: "pinyin", label: "Show Pinyin" },
  { value: "characters", label: "Show Characters" },
  { value: "full", label: "Full Chinese" },
];

export function getChineseDisplayMode(): ChineseDisplayMode {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const v = window.localStorage.getItem(KEY) as ChineseDisplayMode | null;
    if (v === "english" || v === "pinyin" || v === "characters" || v === "full") {
      return v;
    }
  } catch {
    // ignore
  }
  return DEFAULT;
}

export function setChineseDisplayMode(mode: ChineseDisplayMode) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, mode);
    document.body.setAttribute("data-zh-mode", mode);
  } catch {
    // ignore
  }
}

export function useChineseDisplay(): [
  ChineseDisplayMode,
  (m: ChineseDisplayMode) => void,
] {
  const [mode, setMode] = useState<ChineseDisplayMode>(DEFAULT);

  useEffect(() => {
    const current = getChineseDisplayMode();
    setMode(current);
    document.body.setAttribute("data-zh-mode", current);
  }, []);

  const update = (m: ChineseDisplayMode) => {
    setMode(m);
    setChineseDisplayMode(m);
  };

  return [mode, update];
}
