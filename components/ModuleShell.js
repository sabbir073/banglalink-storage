"use client";
import DemoNav from "@/components/DemoNav";
import { Toaster } from "@/lib/toast";

export default function ModuleShell({ title, subtitle, children, actions }) {
  return (
    <div className="min-h-screen bg-bl-mist flex flex-col">
      <DemoNav />
      <Toaster />
      <div className="max-w-6xl w-full mx-auto px-5 py-6 flex-1">
        {(title || actions) && (
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h1 className="text-2xl font-extrabold text-bl-ink">{title}</h1>
              {subtitle && <p className="text-sm text-bl-slate mt-1">{subtitle}</p>}
            </div>
            {actions}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
