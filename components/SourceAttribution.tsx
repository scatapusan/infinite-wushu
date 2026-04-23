import type { AttributionLevel } from "@/lib/types";
import { AlertCircle } from "lucide-react";

type Props = {
  attribution?: AttributionLevel | null;
  source?: string | null;
};

const LABEL: Record<AttributionLevel, string> = {
  "iwuf-official": "IWUF Official",
  "iwuf-aligned": "IWUF-aligned",
  community: "Community knowledge",
  internal: "WuXue-authored",
  unattributed: "Source pending",
};

const STYLE: Record<AttributionLevel, string> = {
  "iwuf-official": "text-cyan border-cyan/30 bg-cyan/5",
  "iwuf-aligned": "text-cyan/80 border-cyan/20 bg-cyan/5",
  community: "text-white/50 border-white/15 bg-white/[0.03]",
  internal: "text-gold border-gold/25 bg-gold/5",
  unattributed: "text-amber-400/80 border-amber-400/30 bg-amber-400/5",
};

export default function SourceAttribution({ attribution, source }: Props) {
  if (!attribution) return null;
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs ${STYLE[attribution]}`}
    >
      {attribution === "unattributed" && <AlertCircle size={11} />}
      <span>{LABEL[attribution]}</span>
      {source && <span className="opacity-60">· {source}</span>}
    </div>
  );
}
