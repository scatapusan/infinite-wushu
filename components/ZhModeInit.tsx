"use client";

import { useEffect } from "react";
import { getChineseDisplayMode } from "@/lib/chinese-display";

export default function ZhModeInit() {
  useEffect(() => {
    const mode = getChineseDisplayMode();
    document.body.setAttribute("data-zh-mode", mode);
  }, []);
  return null;
}
