"use client";

type Props = {
  onCancel: () => void;
  onConfirm: () => void;
};

export default function FormExitConfirm({ onCancel, onConfirm }: Props) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-md px-6">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#0d1328] p-8 space-y-5">
        <p
          className="font-black text-white text-center"
          style={{ fontSize: "3rem", lineHeight: 1.1 }}
        >
          Exit and lose progress?
        </p>
        <p
          className="text-white/70 text-center"
          style={{ fontSize: "1.75rem" }}
        >
          Your session won&apos;t be saved.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="rounded-3xl bg-[#22D3EE] font-black uppercase tracking-widest text-black active:scale-[0.97]"
            style={{ height: "5rem", fontSize: "1.75rem" }}
          >
            KEEP GOING
          </button>
          <button
            onClick={onConfirm}
            className="rounded-3xl border border-[#FF3355]/40 bg-[#FF3355]/10 font-black uppercase tracking-widest text-[#FF3355] active:scale-[0.97]"
            style={{ height: "5rem", fontSize: "1.75rem" }}
          >
            EXIT
          </button>
        </div>
      </div>
    </div>
  );
}
