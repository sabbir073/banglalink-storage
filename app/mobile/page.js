"use client";
import { useState } from "react";
import Link from "next/link";
import ModuleShell from "@/components/ModuleShell";
import { Button } from "@/components/ui";
import { toast } from "@/lib/toast";
import { PLANS } from "@/lib/mockData";
import { Cloud, Bell, Home, Grid3x3, User, Wifi, Battery, Signal, ChevronRight, Check, Loader2, ArrowUpRight, ShieldCheck, Image as ImageIcon, RefreshCw, Upload } from "lucide-react";

export default function Mobile() {
  const [tab, setTab] = useState("cloud");
  const [buying, setBuying] = useState(false);
  const [plan, setPlan] = useState("100gb");
  const used = 41, total = 100;
  const pct = (used / total) * 100;

  function buy(p) {
    setBuying(true);
    setTimeout(() => { setBuying(false); setPlan(p.id); toast("Cloud " + p.storage + " activated in MyBL", { type: "success" });
      setTimeout(() => toast("Your cloud storage is ready. Tap Manage Cloud to start backing up.", { type: "push" }), 600); }, 1200);
  }

  return (
    <ModuleShell title="MyBL / Ryze App Integration" subtitle="How cloud storage appears inside the MyBL super-app — SSO, balance, purchase journey, push & redirect.">
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* phone */}
        <div className="flex justify-center">
          <div className="relative w-[320px] h-[660px] bg-bl-ink rounded-[44px] p-3 shadow-pop">
            <div className="w-full h-full bg-white rounded-[34px] overflow-hidden flex flex-col relative">
              {/* status bar */}
              <div className="bl-gradient text-white px-5 pt-3 pb-4">
                <div className="flex items-center justify-between text-[11px]"><span>9:41</span><div className="flex items-center gap-1"><Signal size={12} /><Wifi size={12} /><Battery size={14} /></div></div>
                <div className="flex items-center justify-between mt-3">
                  <div><div className="text-xs text-white/80">Welcome back</div><div className="font-bold">Mahedi Hasan</div></div>
                  <button onClick={() => toast("3 new notifications", { type: "push" })} className="relative"><Bell size={20} /><span className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full" /></button>
                </div>
              </div>

              {/* body */}
              <div className="flex-1 overflow-auto scroll-thin bg-bl-mist">
                {tab === "home" && (
                  <div className="p-4 space-y-3">
                    <div className="bg-white rounded-2xl p-4 shadow-soft"><div className="text-xs text-bl-slate">Balance</div><div className="text-2xl font-extrabold text-bl-ink">৳ 248.50</div></div>
                    <button onClick={() => setTab("cloud")} className="w-full bg-white rounded-2xl p-4 shadow-soft flex items-center gap-3">
                      <div className="bl-gradient w-11 h-11 rounded-xl grid place-items-center text-white"><Cloud size={22} /></div>
                      <div className="text-left flex-1"><div className="font-bold text-bl-ink">Banglalink Cloud</div><div className="text-xs text-bl-slate">{used} GB of {total} GB used</div></div>
                      <ChevronRight size={18} className="text-bl-slate" />
                    </button>
                    <div className="grid grid-cols-4 gap-2">
                      {["Recharge", "Packs", "Cloud", "Support"].map((x) => (
                        <button key={x} onClick={() => x === "Cloud" && setTab("cloud")} className="bg-white rounded-xl p-2 shadow-soft text-[11px] text-bl-slate flex flex-col items-center gap-1"><div className="w-8 h-8 bl-gradient-soft rounded-lg grid place-items-center text-bl-orange"><Grid3x3 size={15} /></div>{x}</button>
                      ))}
                    </div>
                  </div>
                )}

                {tab === "cloud" && (
                  <div className="p-4 space-y-3">
                    {/* storage ring */}
                    <div className="bg-white rounded-2xl p-4 shadow-soft flex items-center gap-4">
                      <Ring pct={pct} />
                      <div><div className="font-bold text-bl-ink">{PLANS.find((p) => p.id === plan)?.storage} plan</div><div className="text-xs text-bl-slate">{used} GB used · {total - used} GB free</div>
                        <div className="text-[11px] text-green-600 font-semibold mt-1 flex items-center gap-1"><ShieldCheck size={12} /> Active · renews 22 Jul</div></div>
                    </div>

                    <Link href="/drive"><div className="bg-bl-ink text-white rounded-2xl p-3.5 flex items-center gap-3 shadow-soft">
                      <RefreshCw size={18} /><div className="flex-1 text-sm font-semibold">Manage Cloud</div><ArrowUpRight size={16} /></div></Link>

                    <div className="grid grid-cols-3 gap-2">
                      {[["Photos", ImageIcon], ["Backup", Upload], ["Files", Cloud]].map(([l, I]) => (
                        <Link key={l} href="/drive"><div className="bg-white rounded-xl p-3 shadow-soft text-center"><div className="w-9 h-9 bl-gradient-soft rounded-lg grid place-items-center text-bl-orange mx-auto"><I size={17} /></div><div className="text-[11px] text-bl-slate mt-1">{l}</div></div></Link>
                      ))}
                    </div>

                    <div className="text-xs font-bold text-bl-ink mt-1">Upgrade your storage</div>
                    {PLANS.slice(1, 4).map((p) => (
                      <div key={p.id} className="bg-white rounded-xl p-3 shadow-soft flex items-center justify-between">
                        <div><div className="text-sm font-bold text-bl-ink">{p.storage}</div><div className="text-[11px] text-bl-slate">৳{p.monthly}/mo</div></div>
                        {plan === p.id ? <span className="text-xs font-bold text-green-600 flex items-center gap-1"><Check size={13} /> Active</span>
                          : <button onClick={() => buy(p)} disabled={buying} className="bl-gradient text-white text-xs font-bold px-3 py-1.5 rounded-lg">{buying ? <Loader2 size={13} className="animate-spin" /> : "Buy"}</button>}
                      </div>
                    ))}
                  </div>
                )}

                {tab === "account" && (
                  <div className="p-4 space-y-3">
                    <div className="bg-white rounded-2xl p-4 shadow-soft flex items-center gap-3"><div className="w-12 h-12 bl-gradient rounded-full grid place-items-center text-white font-bold">M</div><div><div className="font-bold text-bl-ink">Mahedi Hasan</div><div className="text-xs text-bl-slate">+880 1711 000001</div></div></div>
                    {["Single Sign-On linked", "Cloud: 100 GB active", "Notifications: On"].map((x) => (
                      <div key={x} className="bg-white rounded-xl p-3 shadow-soft text-sm text-bl-ink flex items-center gap-2"><Check size={15} className="text-green-500" /> {x}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* tab bar */}
              <div className="bg-white border-t border-bl-line grid grid-cols-3">
                {[["home", "Home", Home], ["cloud", "Cloud", Cloud], ["account", "Me", User]].map(([id, l, I]) => (
                  <button key={id} onClick={() => setTab(id)} className={"py-2.5 flex flex-col items-center gap-0.5 text-[11px] " + (tab === id ? "text-bl-orange font-bold" : "text-bl-slate")}><I size={19} /> {l}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* explainer */}
        <div className="space-y-3">
          {[
            ["Single Sign-On", "Users enter cloud instantly with their MyBL/Ryze identity — no separate login.", ShieldCheck],
            ["Storage balance & status", "Quota, usage and subscription validity are shown in-app via real-time APIs.", Cloud],
            ["In-app purchase journey", "Buy or renew cloud packs without leaving MyBL; entitlement provisions instantly.", ArrowUpRight],
            ["Push & SMS notifications", "Backup complete, storage threshold, expiry reminders and promos.", Bell],
            ["Redirect to full experience", "“Manage Cloud” deep-links to the web GUI or native sync app via SSO.", RefreshCw],
          ].map(([t, d, I]) => (
            <div key={t} className="bg-white rounded-2xl border border-bl-line shadow-soft p-4 flex gap-3">
              <div className="bl-gradient-soft w-10 h-10 rounded-xl grid place-items-center text-bl-orange shrink-0"><I size={19} /></div>
              <div><div className="font-bold text-bl-ink">{t}</div><div className="text-sm text-bl-slate mt-0.5">{d}</div></div>
            </div>
          ))}
          <div className="text-xs text-bl-slate flex items-center gap-2 px-1"><Bell size={13} /> Tap the bell or buy a pack on the phone to trigger demo notifications.</div>
        </div>
      </div>
    </ModuleShell>
  );
}

function Ring({ pct }) {
  const r = 26, c = 2 * Math.PI * r, off = c - (pct / 100) * c;
  return (
    <svg width="68" height="68" className="shrink-0">
      <circle cx="34" cy="34" r={r} fill="none" stroke="#E7E8EF" strokeWidth="7" />
      <circle cx="34" cy="34" r={r} fill="none" stroke="#F36F21" strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 34 34)" />
      <text x="34" y="38" textAnchor="middle" fontSize="14" fontWeight="800" fill="#16161D">{Math.round(pct)}%</text>
    </svg>
  );
}
