import { Cloud } from "lucide-react";

export function Logo({ size = 36, withText = true, light = false }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className="bl-gradient rounded-xl grid place-items-center shadow-soft" style={{ width: size, height: size }}>
        <Cloud size={size * 0.56} className="text-white" strokeWidth={2.4} fill="rgba(255,255,255,.25)" />
      </div>
      {withText && (
        <div className="leading-none">
          <div className={"font-extrabold tracking-tight " + (light ? "text-white" : "text-bl-ink")} style={{ fontSize: size * 0.46 }}>
            banglalink <span className="text-bl-orange">cloud</span>
          </div>
          <div className={"text-[10px] font-medium tracking-wide " + (light ? "text-white/70" : "text-bl-slate")}>
            STORAGE FOR TELCO BUNDLE
          </div>
        </div>
      )}
    </div>
  );
}
