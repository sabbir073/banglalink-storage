"use client";
import { useState } from "react";
import Link from "next/link";
import ModuleShell from "@/components/ModuleShell";
import { Button, Card, Modal, Badge, Progress } from "@/components/ui";
import { toast } from "@/lib/toast";
import { PLANS, FAMILY_MEMBERS } from "@/lib/mockData";
import { Check, Crown, Users, Plus, CreditCard, Loader2, ShieldCheck, Snowflake, Package, Gift, ArrowUpDown, Zap, UserPlus, Trash2 } from "lucide-react";

const CYCLES = [["monthly", "Monthly"], ["half", "Half-yearly"], ["yearly", "Yearly"]];
const LIFECYCLE = ["Active", "Grace period", "Frozen", "Expired"];

export default function Subscription() {
  const [cycle, setCycle] = useState("monthly");
  const [sell, setSell] = useState("bundle");
  const [buy, setBuy] = useState(null);
  const [paying, setPaying] = useState(false);
  const [current, setCurrent] = useState("100gb");
  const [members, setMembers] = useState(FAMILY_MEMBERS);
  const [addOpen, setAddOpen] = useState(false);
  const [lifecycle, setLifecycle] = useState(0);

  function purchase() {
    setPaying(true);
    setTimeout(() => {
      setPaying(false); setCurrent(buy.id);
      toast("Payment successful — " + buy.name + " activated", { type: "success" });
      setTimeout(() => toast("Your " + buy.name + " cloud plan is now active. Quota updated instantly.", { type: "push" }), 600);
      setTimeout(() => toast("BL: Tk " + buy[cycle] + " charged. Cloud " + buy.storage + " active. Validity " + cycleLabel(cycle) + ".", { type: "sms" }), 1200);
      setBuy(null);
    }, 1300);
  }
  function addMember(name, number) {
    setMembers((m) => [...m, { id: Date.now(), name, number, role: "Member", used: 0, status: "active" }]);
    setAddOpen(false); toast(name + " added to family pack", { type: "success" });
    setTimeout(() => toast("Cloud storage shared with " + name + ".", { type: "push" }), 500);
  }

  return (
    <ModuleShell title="Subscription & Billing" subtitle="Buy, bundle, share and manage cloud storage plans. Billing here is simulated.">
      {/* current plan */}
      <Card className="p-5 mb-5 bl-gradient text-white border-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-white/80 text-sm flex items-center gap-1.5"><Crown size={15} /> Current plan</div>
            <div className="text-2xl font-extrabold mt-0.5">{PLANS.find((p) => p.id === current)?.storage} Cloud</div>
            <div className="text-white/85 text-sm mt-1">Renews 22 Jul 2026 · {LIFECYCLE[lifecycle]}</div>
          </div>
          <div className="text-right">
            <div className="text-white/80 text-xs">Lifecycle demo</div>
            <button onClick={() => setLifecycle((l) => (l + 1) % LIFECYCLE.length)} className="mt-1 bg-white/15 hover:bg-white/25 rounded-lg px-3 py-2 text-sm font-semibold inline-flex items-center gap-2">
              <Snowflake size={15} /> Simulate next state
            </button>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          {LIFECYCLE.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={"h-1.5 rounded-full " + (i <= lifecycle ? "bg-white" : "bg-white/30")} />
              <div className={"text-[11px] mt-1 " + (i === lifecycle ? "text-white font-bold" : "text-white/70")}>{s}</div>
            </div>
          ))}
        </div>
        {lifecycle >= 1 && <div className="mt-3 text-sm bg-white/15 rounded-lg px-3 py-2">{lifecycleNote(lifecycle)}</div>}
      </Card>

      {/* sell mode + cycle */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="inline-flex bg-white border border-bl-line rounded-xl p-1">
          {[["bundle", "Bundled with telco pack", Package], ["addon", "Standalone add-on", Gift]].map(([v, l, I]) => (
            <button key={v} onClick={() => setSell(v)} className={"flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold " + (sell === v ? "bl-gradient text-white" : "text-bl-slate")}><I size={15} /> {l}</button>
          ))}
        </div>
        <div className="inline-flex bg-white border border-bl-line rounded-xl p-1">
          {CYCLES.map(([v, l]) => (
            <button key={v} onClick={() => setCycle(v)} className={"px-3 py-2 rounded-lg text-sm font-semibold " + (cycle === v ? "bl-gradient text-white" : "text-bl-slate")}>{l}{v !== "monthly" && <span className="ml-1 text-[10px] opacity-80">save</span>}</button>
          ))}
        </div>
      </div>

      {/* plans */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {PLANS.map((p) => {
          const active = current === p.id;
          return (
            <Card key={p.id} className={"p-4 relative " + (p.popular ? "ring-2 ring-bl-orange" : "")}>
              {p.popular && <span className="absolute -top-2 left-1/2 -translate-x-1/2 bl-gradient text-white text-[10px] font-bold px-2 py-0.5 rounded-full">MOST POPULAR</span>}
              <div className="text-sm font-bold text-bl-slate">{p.tag}</div>
              <div className="text-2xl font-extrabold text-bl-ink mt-1">{p.storage}</div>
              <div className="mt-2"><span className="text-2xl font-extrabold text-bl-ink">Tk {p[cycle]}</span><span className="text-xs text-bl-slate">/{cycleLabel(cycle)}</span></div>
              <ul className="mt-3 space-y-1.5 text-xs text-bl-slate">
                <li className="flex gap-1.5"><Check size={14} className="text-green-500" /> Auto photo & file backup</li>
                <li className="flex gap-1.5"><Check size={14} className="text-green-500" /> Multi-device sync</li>
                <li className="flex gap-1.5"><Check size={14} className="text-green-500" /> Secure sharing</li>
                {sell === "bundle" && <li className="flex gap-1.5"><Zap size={14} className="text-bl-orange" /> Free with eligible pack</li>}
              </ul>
              {active ? <div className="mt-4 text-center text-sm font-bold text-green-600 flex items-center justify-center gap-1"><Check size={15} /> Current plan</div>
                : <Button className="w-full mt-4" size="sm" onClick={() => setBuy(p)}>{PLANS.findIndex((x) => x.id === p.id) > PLANS.findIndex((x) => x.id === current) ? "Upgrade" : "Choose"}</Button>}
            </Card>
          );
        })}
      </div>
      <div className="text-xs text-bl-slate mt-2 flex items-center gap-1.5"><ArrowUpDown size={13} /> Quota upgrades/downgrades apply instantly and are pro-rated. Non-Banglalink customers can also subscribe by paying directly.</div>

      {/* family pack */}
      <Card className="p-5 mt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-bl-ink"><Users size={18} className="text-bl-orange" /> Family Pack — shared storage</div>
          <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}><UserPlus size={15} /> Add member</Button>
        </div>
        <p className="text-sm text-bl-slate mt-1">Members added to your family pack share the bundled cloud storage. Up to 5 members.</p>
        <div className="mt-3 divide-y divide-bl-line">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 py-2.5">
              <div className="w-9 h-9 rounded-full bl-gradient-soft text-bl-deep grid place-items-center font-bold">{m.name[0]}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-bl-ink truncate">{m.name} {m.role === "Owner" && <Badge tone="orange">Owner</Badge>}</div>
                <div className="text-xs text-bl-slate">{m.number}</div>
              </div>
              <div className="w-28 hidden sm:block"><Progress value={m.used} max={100} /><div className="text-[11px] text-bl-slate mt-1">{m.used} GB used</div></div>
              {m.role !== "Owner" && <button onClick={() => setMembers((x) => x.filter((y) => y.id !== m.id))} className="p-2 rounded-lg hover:bg-bl-mist text-bl-slate hover:text-red-500"><Trash2 size={15} /></button>}
            </div>
          ))}
        </div>
      </Card>

      {/* purchase modal */}
      <Modal open={!!buy} onClose={() => setBuy(null)} title="Confirm purchase" width="max-w-md"
        footer={<><Button variant="ghost" onClick={() => setBuy(null)}>Cancel</Button><Button onClick={purchase} disabled={paying}>{paying ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />} Pay Tk {buy?.[cycle]}</Button></>}>
        {buy && (
          <div>
            <div className="flex items-center justify-between bg-bl-mist rounded-xl px-4 py-3">
              <div><div className="font-bold text-bl-ink">{buy.storage} Cloud</div><div className="text-xs text-bl-slate">{cycleLabel(cycle)} · {sell === "bundle" ? "Bundled" : "Add-on"}</div></div>
              <div className="text-xl font-extrabold text-bl-ink">Tk {buy[cycle]}</div>
            </div>
            <div className="mt-3 text-sm font-semibold text-bl-ink">Payment method</div>
            <div className="mt-2 space-y-2">
              {["Balance / Mobile (BL)", "bKash", "Card"].map((m, i) => (
                <label key={m} className="flex items-center gap-3 border border-bl-line rounded-xl px-3 py-2.5 cursor-pointer hover:bg-bl-mist">
                  <input type="radio" name="pay" defaultChecked={i === 0} className="accent-bl-orange" /> <span className="text-sm text-bl-ink">{m}</span>
                </label>
              ))}
            </div>
            <div className="text-xs text-bl-slate mt-3 flex items-center gap-1.5"><ShieldCheck size={13} className="text-green-500" /> Charge validated against eligibility; cloud account provisioned instantly via middleware API.</div>
          </div>
        )}
      </Modal>

      <AddMemberModal open={addOpen} onClose={() => setAddOpen(false)} onAdd={addMember} />
    </ModuleShell>
  );
}

function AddMemberModal({ open, onClose, onAdd }) {
  const [name, setName] = useState(""); const [number, setNumber] = useState("");
  return (
    <Modal open={open} onClose={onClose} title="Add family member"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={() => onAdd(name || "New Member", number || "+8801700000000")}><Plus size={15} /> Add</Button></>}>
      <label className="text-sm font-semibold text-bl-ink">Name</label>
      <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 w-full border border-bl-line rounded-xl px-3 py-2.5 outline-none focus:ring-2 ring-bl-orange/30" placeholder="Family member name" />
      <label className="text-sm font-semibold text-bl-ink mt-3 block">Mobile number</label>
      <input value={number} onChange={(e) => setNumber(e.target.value)} className="mt-1.5 w-full border border-bl-line rounded-xl px-3 py-2.5 outline-none focus:ring-2 ring-bl-orange/30" placeholder="+8801XXXXXXXXX" />
    </Modal>
  );
}

function cycleLabel(c) { return c === "monthly" ? "month" : c === "half" ? "6 months" : "year"; }
function lifecycleNote(l) {
  return [
    "",
    "Subscription expired into grace period. Uploads still allowed; reminders sent via SMS & push.",
    "Account frozen. Uploads/sync paused; existing data retained and viewable. Renew to restore.",
    "Subscription expired. Data retained until deletion timeline; final warning issued before removal.",
  ][l];
}
