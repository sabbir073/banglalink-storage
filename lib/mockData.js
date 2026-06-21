// Mock data for the SIMULATED modules (subscription, B2B, analytics, mobile).
// Figures seeded from the Banglalink RFP projections where relevant.

export const PLANS = [
  { id: "10gb",  name: "10 GB",  storage: "10 GB",  monthly: 29,  half: 149,  yearly: 269,  tag: "Starter", popular: false, takers: 670000 },
  { id: "100gb", name: "100 GB", storage: "100 GB", monthly: 99,  half: 499,  yearly: 899,  tag: "Popular", popular: true,  takers: 134000 },
  { id: "250gb", name: "250 GB", storage: "250 GB", monthly: 199, half: 999,  yearly: 1799, tag: "Value",   popular: false, takers: 60000 },
  { id: "500gb", name: "500 GB", storage: "500 GB", monthly: 349, half: 1799, yearly: 3199, tag: "Pro",     popular: false, takers: 120000 },
  { id: "1tb",   name: "1 TB",   storage: "1 TB",   monthly: 599, half: 2999, yearly: 5499, tag: "Max",     popular: false, takers: 25000 },
];

export const FAMILY_MEMBERS = [
  { id: 1, name: "Mahedi Hasan", number: "+8801711000001", role: "Owner", used: 41, status: "active" },
  { id: 2, name: "Ayesha Rahman", number: "+8801711000002", role: "Member", used: 12, status: "active" },
  { id: 3, name: "Tanvir Ahmed", number: "+8801711000003", role: "Member", used: 7, status: "active" },
];

export const EMPLOYEES = [
  { id: 1, name: "Rakib Hossain", email: "rakib@acme.com.bd", dept: "Engineering", role: "Admin", quota: 100, used: 64, status: "active" },
  { id: 2, name: "Nusrat Jahan", email: "nusrat@acme.com.bd", dept: "Marketing", role: "Member", quota: 50, used: 31, status: "active" },
  { id: 3, name: "Imran Khan", email: "imran@acme.com.bd", dept: "Sales", role: "Member", quota: 50, used: 12, status: "active" },
  { id: 4, name: "Fatema Begum", email: "fatema@acme.com.bd", dept: "Finance", role: "Manager", quota: 75, used: 58, status: "active" },
  { id: 5, name: "Sajid Islam", email: "sajid@acme.com.bd", dept: "Engineering", role: "Member", quota: 50, used: 5, status: "suspended" },
  { id: 6, name: "Habiba Akter", email: "habiba@acme.com.bd", dept: "HR", role: "Member", quota: 25, used: 18, status: "active" },
];

// ---- Analytics (operator dashboard) ----
export const KPIS = {
  activeSubscribers: 1014360,   // sum of monthly takers across tiers (RFP)
  storagePB: 38.6,
  monthlyRevenue: 14.7,         // BDT crore (illustrative)
  attachRate: 8.4,              // % of base
};

export const SUBS_TREND = [
  { m: "Jan", subs: 412 }, { m: "Feb", subs: 498 }, { m: "Mar", subs: 567 },
  { m: "Apr", subs: 641 }, { m: "May", subs: 763 }, { m: "Jun", subs: 884 },
  { m: "Jul", subs: 947 }, { m: "Aug", subs: 1014 },
];

export const CHANNEL_MIX = [
  { name: "MyBL App", value: 46 }, { name: "Ryze", value: 22 },
  { name: "Web Portal", value: 18 }, { name: "USSD/SMS", value: 9 }, { name: "Retail", value: 5 },
];

export const TIER_UPTAKE = [
  { tier: "10GB", takers: 670 }, { tier: "100GB", takers: 134 }, { tier: "250GB", takers: 60 },
  { tier: "500GB", takers: 120 }, { tier: "1TB", takers: 25 },
];

export const REVENUE_BY_TIER = [
  { tier: "10GB", rev: 1.94 }, { tier: "100GB", rev: 1.33 }, { tier: "250GB", rev: 1.19 },
  { tier: "500GB", rev: 4.19 }, { tier: "1TB", rev: 1.50 },
];

export const SYNC_ACTIVITY = [
  { d: "Mon", uploads: 320, restores: 40 }, { d: "Tue", uploads: 410, restores: 52 },
  { d: "Wed", uploads: 388, restores: 47 }, { d: "Thu", uploads: 470, restores: 61 },
  { d: "Fri", uploads: 520, restores: 73 }, { d: "Sat", uploads: 610, restores: 95 },
  { d: "Sun", uploads: 560, restores: 80 },
];
