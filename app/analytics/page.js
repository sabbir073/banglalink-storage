"use client";
import ModuleShell from "@/components/ModuleShell";
import { Card, Badge } from "@/components/ui";
import { KPIS, SUBS_TREND, CHANNEL_MIX, TIER_UPTAKE, REVENUE_BY_TIER, SYNC_ACTIVITY } from "@/lib/mockData";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Users, Database, TrendingUp, Percent, ArrowUpRight } from "lucide-react";

const COLORS = ["#F36F21", "#FDB913", "#FF9A4D", "#B8470A", "#5B5B66"];

export default function Analytics() {
  const KPI = ({ icon: I, label, value, delta }) => (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="bl-gradient-soft w-9 h-9 rounded-xl grid place-items-center text-bl-orange"><I size={18} /></div>
        {delta && <Badge tone="green"><ArrowUpRight size={12} /> {delta}</Badge>}
      </div>
      <div className="text-2xl font-extrabold text-bl-ink mt-2">{value}</div>
      <div className="text-xs text-bl-slate">{label}</div>
    </Card>
  );
  return (
    <ModuleShell title="Operator Analytics" subtitle="Subscriber, storage, revenue and sync reporting across all channels. Figures are illustrative.">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KPI icon={Users} label="Active subscribers" value={(KPIS.activeSubscribers / 1000).toFixed(0) + "K"} delta="12.8%" />
        <KPI icon={Database} label="Storage under mgmt" value={KPIS.storagePB + " PB"} delta="6.1%" />
        <KPI icon={TrendingUp} label="Monthly revenue" value={"৳" + KPIS.monthlyRevenue + " Cr"} delta="9.4%" />
        <KPI icon={Percent} label="Base attach rate" value={KPIS.attachRate + "%"} delta="1.2%" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="p-5 lg:col-span-2">
          <div className="font-bold text-bl-ink mb-3">Active subscribers (000s)</div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SUBS_TREND}>
                <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F36F21" stopOpacity={0.4} /><stop offset="100%" stopColor="#F36F21" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" /><XAxis dataKey="m" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip />
                <Area type="monotone" dataKey="subs" stroke="#F36F21" strokeWidth={2.5} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <div className="font-bold text-bl-ink mb-3">Acquisition by channel</div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={CHANNEL_MIX} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={2}>
                  {CHANNEL_MIX.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mt-5">
        <Card className="p-5">
          <div className="font-bold text-bl-ink mb-3">Tier uptake (000s)</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TIER_UPTAKE}><CartesianGrid strokeDasharray="3 3" stroke="#eee" /><XAxis dataKey="tier" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip />
                <Bar dataKey="takers" radius={[6, 6, 0, 0]}>{TIER_UPTAKE.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar></BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <div className="font-bold text-bl-ink mb-3">Revenue by tier (৳ Cr)</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={REVENUE_BY_TIER}><CartesianGrid strokeDasharray="3 3" stroke="#eee" /><XAxis dataKey="tier" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip />
                <Bar dataKey="rev" radius={[6, 6, 0, 0]} fill="#FDB913" /></BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <div className="font-bold text-bl-ink mb-3">Sync activity (daily, 000s)</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SYNC_ACTIVITY}><CartesianGrid strokeDasharray="3 3" stroke="#eee" /><XAxis dataKey="d" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="uploads" stackId="a" fill="#F36F21" radius={[0, 0, 0, 0]} /><Bar dataKey="restores" stackId="a" fill="#FDB913" radius={[6, 6, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <div className="text-xs text-bl-slate mt-4">Reports available: active subscriber (channel-wise), storage utilization, subscription uptake, revenue & bundle performance, enterprise usage, sync activity, customer behavior — exportable to CSV/BI.</div>
    </ModuleShell>
  );
}
