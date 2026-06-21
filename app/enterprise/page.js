"use client";
import { useState } from "react";
import ModuleShell from "@/components/ModuleShell";
import { Button, Card, Modal, Badge, Progress } from "@/components/ui";
import { toast } from "@/lib/toast";
import { EMPLOYEES } from "@/lib/mockData";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { Building2, Users, HardDrive, Layers, UserPlus, Search, Shield, MoreHorizontal, Upload, Check, Loader2, Power, Trash2, Pencil } from "lucide-react";

const ROLE_TONE = { Admin: "orange", Manager: "blue", Member: "gray" };

export default function Enterprise() {
  const [emps, setEmps] = useState(EMPLOYEES);
  const [q, setQ] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [quotaEmp, setQuotaEmp] = useState(null);

  const filtered = emps.filter((e) => (e.name + e.email + e.dept).toLowerCase().includes(q.toLowerCase()));
  const totalQuota = emps.reduce((a, e) => a + e.quota, 0);
  const totalUsed = emps.reduce((a, e) => a + e.used, 0);
  const depts = [...new Set(emps.map((e) => e.dept))];
  const deptData = depts.map((d) => ({ dept: d, used: emps.filter((e) => e.dept === d).reduce((a, e) => a + e.used, 0) }));

  function toggleStatus(id) {
    setEmps((s) => s.map((e) => e.id === id ? { ...e, status: e.status === "active" ? "suspended" : "active" } : e));
    toast("Access updated");
  }
  function removeEmp(id) { setEmps((s) => s.filter((e) => e.id !== id)); toast("Employee removed", { type: "error" }); }
  function bulkAdd(lines) {
    const added = lines.map((line, i) => {
      const email = line.trim();
      const name = email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      return { id: Date.now() + i, name, email, dept: "Unassigned", role: "Member", quota: 50, used: 0, status: "active" };
    });
    setEmps((s) => [...s, ...added]); setBulkOpen(false);
    toast(added.length + " employees onboarded", { type: "success" });
    setTimeout(() => toast("Onboarding invites sent to " + added.length + " employees.", { type: "push" }), 500);
  }
  function setQuota(id, val) { setEmps((s) => s.map((e) => e.id === id ? { ...e, quota: val } : e)); setQuotaEmp(null); toast("Quota updated"); }

  const KPI = ({ icon: I, label, value, sub }) => (
    <Card className="p-4"><div className="flex items-center gap-2 text-bl-slate text-sm"><I size={16} className="text-bl-orange" /> {label}</div>
      <div className="text-2xl font-extrabold text-bl-ink mt-1">{value}</div><div className="text-xs text-bl-slate">{sub}</div></Card>
  );

  return (
    <ModuleShell title="Enterprise (B2B) Admin" subtitle="Organization-level cloud management for Acme Logistics Ltd. — provisioning is simulated."
      actions={<Button onClick={() => setBulkOpen(true)}><UserPlus size={16} /> Bulk onboard</Button>}>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KPI icon={Users} label="Employees" value={emps.length} sub={emps.filter((e) => e.status === "active").length + " active"} />
        <KPI icon={HardDrive} label="Storage used" value={totalUsed + " GB"} sub={"of " + totalQuota + " GB allocated"} />
        <KPI icon={Layers} label="Departments" value={depts.length} sub="across organization" />
        <KPI icon={Shield} label="Org plan" value="2 TB" sub="Enterprise · annual" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="font-bold text-bl-ink flex items-center gap-2"><Users size={18} className="text-bl-orange" /> Employees</div>
            <div className="relative">
              <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-bl-slate" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="bg-bl-mist rounded-lg pl-8 pr-3 py-1.5 text-sm outline-none focus:ring-2 ring-bl-orange/30" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-bl-slate border-b border-bl-line">
                <th className="py-2 font-semibold">Employee</th><th className="font-semibold">Dept</th><th className="font-semibold">Role</th><th className="font-semibold">Storage</th><th className="font-semibold">Status</th><th></th>
              </tr></thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="border-b border-bl-line last:border-0 hover:bg-bl-mist">
                    <td className="py-2.5"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bl-gradient-soft text-bl-deep grid place-items-center font-bold text-xs">{e.name[0]}</div><div><div className="font-semibold text-bl-ink">{e.name}</div><div className="text-[11px] text-bl-slate">{e.email}</div></div></div></td>
                    <td className="text-bl-slate">{e.dept}</td>
                    <td><Badge tone={ROLE_TONE[e.role]}>{e.role}</Badge></td>
                    <td className="min-w-[120px]"><div className="w-24"><Progress value={e.used} max={e.quota} /></div><div className="text-[11px] text-bl-slate mt-0.5">{e.used}/{e.quota} GB</div></td>
                    <td>{e.status === "active" ? <Badge tone="green">Active</Badge> : <Badge tone="red">Suspended</Badge>}</td>
                    <td><div className="flex justify-end gap-1">
                      <button onClick={() => setQuotaEmp(e)} title="Quota" className="p-1.5 rounded-lg hover:bg-white text-bl-slate"><Pencil size={14} /></button>
                      <button onClick={() => toggleStatus(e.id)} title="Toggle access" className="p-1.5 rounded-lg hover:bg-white text-bl-slate"><Power size={14} /></button>
                      <button onClick={() => removeEmp(e.id)} title="Remove" className="p-1.5 rounded-lg hover:bg-white text-bl-slate hover:text-red-500"><Trash2 size={14} /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <div className="font-bold text-bl-ink mb-2">Usage by department</div>
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData}><XAxis dataKey="dept" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="used" radius={[6, 6, 0, 0]}>{deptData.map((_, i) => <Cell key={i} fill="#F36F21" />)}</Bar></BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="p-5">
            <div className="font-bold text-bl-ink mb-2 flex items-center gap-2"><Shield size={16} className="text-bl-orange" /> Roles (RBAC)</div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between"><Badge tone="orange">Admin</Badge><span className="text-bl-slate text-xs">Full org control, billing, provisioning</span></div>
              <div className="flex items-center justify-between"><Badge tone="blue">Manager</Badge><span className="text-bl-slate text-xs">Team quota & usage management</span></div>
              <div className="flex items-center justify-between"><Badge tone="gray">Member</Badge><span className="text-bl-slate text-xs">Personal storage only</span></div>
            </div>
          </Card>
        </div>
      </div>

      <BulkModal open={bulkOpen} onClose={() => setBulkOpen(false)} onAdd={bulkAdd} />
      <QuotaModal emp={quotaEmp} onClose={() => setQuotaEmp(null)} onSave={setQuota} />
    </ModuleShell>
  );
}

function BulkModal({ open, onClose, onAdd }) {
  const [text, setText] = useState("rahim@acme.com.bd\nkarim@acme.com.bd\nsadia@acme.com.bd");
  const [busy, setBusy] = useState(false);
  function go() { setBusy(true); setTimeout(() => { setBusy(false); onAdd(text.split("\n").filter((l) => l.trim())); }, 900); }
  return (
    <Modal open={open} onClose={onClose} title="Bulk employee onboarding" width="max-w-lg"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={go} disabled={busy}>{busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Onboard</Button></>}>
      <p className="text-sm text-bl-slate">Paste one email per line, or upload a CSV. Each employee is provisioned a cloud account with default quota.</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} className="mt-3 w-full border border-bl-line rounded-xl px-3 py-2.5 text-sm font-mono outline-none focus:ring-2 ring-bl-orange/30" />
      <div className="mt-2 border-2 border-dashed border-bl-line rounded-xl py-4 text-center text-sm text-bl-slate flex items-center justify-center gap-2"><Upload size={16} /> Drop employees.csv here (demo)</div>
    </Modal>
  );
}

function QuotaModal({ emp, onClose, onSave }) {
  const [val, setVal] = useState(50);
  if (!emp) return null;
  return (
    <Modal open={!!emp} onClose={onClose} title={"Storage quota — " + emp.name}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={() => onSave(emp.id, Number(val))}><Check size={15} /> Save</Button></>}>
      <label className="text-sm font-semibold text-bl-ink">Allocated storage (GB)</label>
      <input type="range" min="10" max="500" step="10" defaultValue={emp.quota} onChange={(e) => setVal(e.target.value)} className="w-full mt-3 accent-bl-orange" />
      <div className="text-center text-2xl font-extrabold text-bl-ink mt-2">{val} GB</div>
    </Modal>
  );
}
