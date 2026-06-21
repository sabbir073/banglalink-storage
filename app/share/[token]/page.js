"use client";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Brand";
import { Button } from "@/components/ui";
import { FileIconBox } from "@/components/drive/FileIcon";
import { fmtBytes, fileKind } from "@/lib/format";
import { Download, ShieldCheck, Clock, Loader2, AlertTriangle, Eye } from "lucide-react";

export default function SharePage({ params }) {
  const { token } = params;
  const [state, setState] = useState({ loading: true });
  useEffect(() => {
    fetch("/api/shares/" + token).then(async (r) => {
      if (!r.ok) { const e = await r.json(); setState({ loading: false, error: e.error }); }
      else setState({ loading: false, data: await r.json() });
    });
  }, [token]);

  const raw = "/api/shares/" + token + "/raw";

  return (
    <div className="min-h-screen bg-bl-mist">
      <header className="h-16 bg-white border-b border-bl-line flex items-center px-6"><Logo size={32} /></header>
      <div className="max-w-2xl mx-auto px-4 py-10">
        {state.loading ? (
          <div className="grid place-items-center h-60 text-bl-slate"><Loader2 className="animate-spin" /></div>
        ) : state.error ? (
          <div className="bg-white rounded-2xl border border-bl-line shadow-soft p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-50 grid place-items-center mx-auto text-red-500"><AlertTriangle size={28} /></div>
            <h2 className="mt-4 text-xl font-bold text-bl-ink">{state.error}</h2>
            <p className="text-sm text-bl-slate mt-1">This secure link is no longer accessible. Ask the owner to share it again.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-bl-line shadow-soft overflow-hidden">
            <div className="bl-gradient px-6 py-5 text-white flex items-center gap-2">
              <ShieldCheck size={20} /> <span className="font-semibold">Shared securely via Banglalink Cloud</span>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4">
                <FileIconBox type={state.data.file.type} name={state.data.file.name} size={34} />
                <div className="min-w-0">
                  <div className="font-bold text-bl-ink truncate">{state.data.file.name}</div>
                  <div className="text-sm text-bl-slate">{fmtBytes(state.data.file.size)}</div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1 bg-bl-mist px-2.5 py-1 rounded-full text-bl-slate">
                  {state.data.permission === "download" ? <Download size={13} /> : <Eye size={13} />}
                  {state.data.permission === "download" ? "View & download" : "View only"}
                </span>
                {state.data.expiresAt && (
                  <span className="inline-flex items-center gap-1 bg-bl-mist px-2.5 py-1 rounded-full text-bl-slate">
                    <Clock size={13} /> Expires {new Date(state.data.expiresAt).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="mt-5 bg-bl-mist rounded-xl p-3 grid place-items-center min-h-[220px] max-h-[55vh] overflow-auto">
                {fileKind(state.data.file.type, state.data.file.name) === "image" ? <img src={raw} alt="" className="max-h-[50vh] rounded-lg" /> :
                 fileKind(state.data.file.type, state.data.file.name) === "pdf" ? <iframe src={raw} className="w-full h-[50vh] rounded-lg bg-white" /> :
                 fileKind(state.data.file.type, state.data.file.name) === "video" ? <video src={raw} controls className="max-h-[50vh] rounded-lg" /> :
                 <div className="text-center text-bl-slate py-8"><FileIconBox type={state.data.file.type} name={state.data.file.name} size={36} /><div className="mt-2 text-sm">Preview not available inline.</div></div>}
              </div>

              {state.data.permission === "download" ? (
                <Button className="w-full mt-5" size="lg" onClick={() => window.open(raw + "?download=1", "_blank")}><Download size={18} /> Download file</Button>
              ) : (
                <div className="mt-5 text-center text-sm text-bl-slate flex items-center justify-center gap-1.5"><Eye size={15} /> Download is disabled for this link.</div>
              )}
            </div>
          </div>
        )}
        <p className="text-center text-xs text-bl-slate mt-6">Protected by Banglalink Cloud · access controlled & encrypted.</p>
      </div>
    </div>
  );
}
