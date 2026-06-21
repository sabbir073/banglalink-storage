"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HardDrive, CreditCard, Building2, BarChart3, Smartphone, Home } from "lucide-react";

const items = [
  { href: "/drive", label: "Web Drive", icon: HardDrive },
  { href: "/subscription", label: "Subscription", icon: CreditCard },
  { href: "/enterprise", label: "B2B Admin", icon: Building2 },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/mobile", label: "MyBL App", icon: Smartphone },
];

export default function DemoNav() {
  const path = usePathname();
  return (
    <div className="h-11 bg-bl-ink text-white flex items-center px-3 gap-1 text-sm overflow-x-auto scroll-thin">
      <Link href="/" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 font-semibold shrink-0">
        <Home size={15} /> <span className="hidden sm:inline">Demo Home</span>
      </Link>
      <span className="w-px h-5 bg-white/15 mx-1" />
      {items.map((it) => {
        const active = path.startsWith(it.href);
        const Icon = it.icon;
        return (
          <Link key={it.href} href={it.href}
            className={"flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shrink-0 " + (active ? "bg-white/15 font-semibold" : "hover:bg-white/10 text-white/80")}>
            <Icon size={15} /> {it.label}
          </Link>
        );
      })}
      <span className="ml-auto text-[11px] text-white/50 pr-2 shrink-0 hidden md:block">Banglalink Cloud · Interactive Demo</span>
    </div>
  );
}
