export const ZH_RATE = 0.8;

export function speakChinese(text: string): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = ZH_RATE;
  window.speechSynthesis.speak(utterance);
}

/** Returns true once voices have loaded and at least one zh voice exists. */
export function hasZhVoice(): boolean {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;
  return window.speechSynthesis.getVoices().some((v) => v.lang.startsWith("zh"));
}
