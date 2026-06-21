"use client";
import { useEffect, useState } from "react";

let listeners = [];
let counter = 0;
export function toast(message, opts = {}) {
  const t = { id: ++counter, message, type: opts.type || "info", icon: opts.icon || null };
  listeners.forEach((l) => l(t));
}

export function Toaster() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const l = (t) => {
      setItems((s) => [...s, t]);
      setTimeout(() => setItems((s) => s.filter((x) => x.id !== t.id)), 3200);
    };
    listeners.push(l);
    return () => { listeners = listeners.filter((x) => x !== l); };
  }, []);
  const colors = {
    info: "border-bl-line", success: "border-green-300", error: "border-red-300",
    sms: "border-blue-300", push: "border-orange-300",
  };
  const tags = { sms: "SMS", push: "PUSH", success: "", error: "", info: "" };
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-80">
      {items.map((t) => (
        <div key={t.id} className={"bg-white rounded-xl shadow-pop border-l-4 px-4 py-3 text-sm animate-slideup flex items-start gap-2 " + (colors[t.type] || colors.info)}>
          {tags[t.type] ? <span className="text-[10px] font-bold mt-0.5 px-1.5 py-0.5 rounded bg-bl-mist text-bl-slate">{tags[t.type]}</span> : null}
          <span className="text-bl-ink">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
