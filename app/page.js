"use client";
import Link from "next/link";
import { Logo } from "@/components/Brand";
import { HardDrive, CreditCard, Building2, BarChart3, Smartphone, ArrowRight, ShieldCheck, Server, RefreshCw, CheckCircle2 } from "lucide-react";

const modules = [
  { href: "/login", label: "Consumer Web Drive", desc: "Google-Drive-style portal: login/SSO, upload, preview, share, folders, quota.", icon: HardDrive, tag: "Real S3 files" },
  { href: "/subscription", label: "Subscription & Billing", desc: "Plans, bundle vs add-on, family pack, quota up/down, grace & freeze, payment.", icon: CreditCard, tag: "Simulated" },
  { href: "/enterprise", label: "B2B Enterprise Admin", desc: "Org dashboard, bulk onboarding, RBAC, departments, usage reporting.", icon: Building2, tag: "Simulated" },
  { href: "/analytics", label: "Operator Analytics", desc: "Active subscribers, channel mix, tier uptake, revenue, sync activity.", icon: BarChart3, tag: "Simulated" },
  { href: "/mobile", label: "MyBL / Ryze App", desc: "In-app cloud widget, storage balance, purchase journey, push & redirect.", icon: Smartphone, tag: "Simulated" },
];

const pillars = [
  { icon: Server, t: "Scalable object storage", d: "Multi-tenant, dynamic quota, S3-backed today; custom storage adapter ready." },
  { icon: ShieldCheck, t: "Security & residency", d: "Encryption in transit/at rest, RBAC, share access-control with expiry." },
  { icon: RefreshCw, t: "Sync & backup", d: "Auto photo/file backup, multi-device, resume on unstable network." },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="bl-gradient text-white">
        <div className="max-w-6xl mx-auto px-6 pt-8 pb-16">
          <div className="flex items-center justify-between">
            <Logo size={40} light />
            <span className="text-xs font-semibold bg-white/15 px-3 py-1.5 rounded-full">Interactive Demo · v1</span>
          </div>
          <div className="mt-14 max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">Personal cloud storage, built for Banglalink subscribers.</h1>
            <p className="mt-4 text-white/90 text-lg">A telecom-grade storage platform — backup, sync, share and bundle cloud storage across MyBL, Ryze, web and desktop. Explore each part of the solution below.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/login"><span className="inline-flex items-center gap-2 bg-white text-bl-deep font-bold px-5 py-3 rounded-xl shadow-soft hover:bg-white/90">Launch Web Drive <ArrowRight size={18} /></span></Link>
              <Link href="/analytics"><span className="inline-flex items-center gap-2 bg-white/15 text-white font-bold px-5 py-3 rounded-xl hover:bg-white/25">View Analytics</span></Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/90">
              {["Meets 100% of RFP capability areas","99.9% availability target","Data residency aware"].map((x) => (
                <span key={x} className="inline-flex items-center gap-1.5"><CheckCircle2 size={16} /> {x}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-9">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pillars.map((p) => (
            <div key={p.t} className="bg-white rounded-2xl border border-bl-line shadow-soft p-5">
              <div className="bl-gradient-soft w-10 h-10 rounded-xl grid place-items-center text-bl-orange"><p.icon size={20} /></div>
              <div className="mt-3 font-bold text-bl-ink">{p.t}</div>
              <div className="text-sm text-bl-slate mt-1">{p.d}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-xl font-bold text-bl-ink">Explore the modules</h2>
        <p className="text-bl-slate text-sm mt-1">Each card is a working part of the demo. Files in the Web Drive are stored for real; other flows are clickable simulations.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
          {modules.map((m) => (
            <Link key={m.href} href={m.href}>
              <div className="group bg-white rounded-2xl border border-bl-line shadow-soft p-5 h-full hover:shadow-pop transition cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="bl-gradient w-11 h-11 rounded-xl grid place-items-center text-white"><m.icon size={22} /></div>
                  <span className={"text-[11px] font-bold px-2 py-1 rounded-full " + (m.tag.includes("Real") ? "bg-green-100 text-green-700" : "bg-bl-mist text-bl-slate")}>{m.tag}</span>
                </div>
                <div className="mt-3 font-bold text-bl-ink flex items-center gap-1">{m.label}</div>
                <div className="text-sm text-bl-slate mt-1">{m.desc}</div>
                <div className="mt-3 text-bl-orange text-sm font-semibold inline-flex items-center gap-1 group-hover:gap-2 transition-all">Open <ArrowRight size={15} /></div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="text-center text-xs text-bl-slate pb-8">Prepared for Banglalink Digital Communications Ltd. · Demo build — not production.</div>
    </div>
  );
}
