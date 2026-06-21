"use client";
import { X } from "lucide-react";

export function Button({ children, variant = "primary", size = "md", className = "", ...p }) {
  const base = "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition active:scale-[.98] disabled:opacity-50 disabled:pointer-events-none";
  const sizes = { sm: "text-sm px-3 py-1.5", md: "text-sm px-4 py-2.5", lg: "text-base px-5 py-3" };
  const variants = {
    primary: "bl-gradient text-white shadow-soft hover:brightness-105",
    solid: "bg-bl-ink text-white hover:bg-black",
    outline: "border border-bl-line bg-white text-bl-ink hover:bg-bl-mist",
    ghost: "text-bl-slate hover:bg-bl-mist hover:text-bl-ink",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };
  return <button className={base + " " + sizes[size] + " " + variants[variant] + " " + className} {...p}>{children}</button>;
}

export function Modal({ open, onClose, title, children, width = "max-w-lg", footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-bl-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className={"relative bg-white rounded-2xl shadow-pop w-full " + width + " animate-pop"}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-bl-line">
          <h3 className="font-bold text-bl-ink">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bl-mist text-bl-slate"><X size={18} /></button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-bl-line flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export function Badge({ children, tone = "gray" }) {
  const tones = {
    gray: "bg-bl-mist text-bl-slate", green: "bg-green-100 text-green-700",
    orange: "bg-orange-100 text-bl-deep", red: "bg-red-100 text-red-600",
    blue: "bg-blue-100 text-blue-700", yellow: "bg-amber-100 text-amber-700",
  };
  return <span className={"inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full " + tones[tone]}>{children}</span>;
}

export function Card({ children, className = "" }) {
  return <div className={"bg-white rounded-2xl border border-bl-line shadow-soft " + className}>{children}</div>;
}

export function Progress({ value, max = 100, tone = "bl-gradient" }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="h-2 w-full bg-bl-line rounded-full overflow-hidden">
      <div className={tone + " h-full rounded-full transition-all"} style={{ width: pct + "%" }} />
    </div>
  );
}
