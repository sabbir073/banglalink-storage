// Async metadata data-access layer.
// Backend = Supabase when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set (required on Vercel);
// otherwise a local JSON file (good for local dev). Object bytes live in S3/mock storage, not here.
import fs from "fs";
import path from "path";
import { supabaseEnabled, getSupabase } from "@/lib/supabaseClient";

export function uid(prefix = "id") {
  return prefix + "-" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}
export function dbMode() { return supabaseEnabled() ? "supabase" : "local"; }

const DEFAULT_FOLDERS = [
  { id: "root", name: "My Drive", parentId: null },
  { id: "f-photos", name: "Photos", parentId: "root" },
  { id: "f-docs", name: "Documents", parentId: "root" },
  { id: "f-work", name: "Work", parentId: "root" },
];

/* ---------------- row mappers (Supabase snake_case <-> app camelCase) ---------------- */
const fileFromRow = (r) => r && ({ id: r.id, name: r.name, size: Number(r.size || 0), type: r.type, folderId: r.folder_id, key: r.key, createdAt: Number(r.created_at), starred: !!r.starred, trashed: !!r.trashed });
const folderFromRow = (r) => r && ({ id: r.id, name: r.name, parentId: r.parent_id, createdAt: Number(r.created_at) });
const shareFromRow = (r) => r && ({ token: r.token, fileId: r.file_id, permission: r.permission, createdAt: Number(r.created_at), expiresAt: r.expires_at ? Number(r.expires_at) : null, revoked: !!r.revoked });

function buildBreadcrumb(allFolders, folderId) {
  const map = new Map(allFolders.map((f) => [f.id, f]));
  const crumbs = []; let cur = map.get(folderId);
  while (cur) { crumbs.unshift({ id: cur.id, name: cur.name }); cur = cur.parentId ? map.get(cur.parentId) : null; }
  return crumbs;
}

// Surface Supabase errors clearly instead of returning null (which used to crash on .map).
function ok(res, label) {
  if (res.error) {
    const m = res.error.message || String(res.error);
    const hint = /relation .* does not exist|schema cache|Could not find the table/i.test(m)
      ? " — tables missing? Run supabase-schema.sql in the Supabase SQL editor."
      : "";
    throw new Error("Supabase " + label + " failed: " + m + hint);
  }
  return res.data;
}

/* ============================ LOCAL JSON BACKEND ============================ */
const DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DIR, "db.json");
function lread() {
  try { return JSON.parse(fs.readFileSync(FILE, "utf8")); }
  catch {
    const seed = { folders: DEFAULT_FOLDERS.map((f) => ({ ...f, createdAt: Date.now() })), files: [], shares: [] };
    lwrite(seed); return seed;
  }
}
function lwrite(d) { fs.mkdirSync(DIR, { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(d, null, 2)); }

const local = {
  async listChildren(folderId) {
    const d = lread();
    return {
      folders: d.folders.filter((f) => f.parentId === folderId),
      files: d.files.filter((f) => f.folderId === folderId && !f.trashed),
      breadcrumb: buildBreadcrumb(d.folders, folderId),
    };
  },
  async quota() {
    const d = lread(); const live = d.files.filter((f) => !f.trashed);
    return { used: live.reduce((a, f) => a + (f.size || 0), 0), fileCount: live.length };
  },
  async createFolder(name, parentId) {
    const folder = { id: uid("fld"), name, parentId: parentId || "root", createdAt: Date.now() };
    const d = lread(); d.folders.push(folder); lwrite(d); return folder;
  },
  async renameFolder(id, name) { const d = lread(); const f = d.folders.find((x) => x.id === id); if (f) f.name = name; lwrite(d); },
  async deleteFolderTree(id) {
    const d = lread(); const ids = new Set([id]); let added = true;
    while (added) { added = false; for (const f of d.folders) if (f.parentId && ids.has(f.parentId) && !ids.has(f.id)) { ids.add(f.id); added = true; } }
    const keys = d.files.filter((f) => ids.has(f.folderId)).map((f) => f.key);
    d.files = d.files.filter((f) => !ids.has(f.folderId));
    d.folders = d.folders.filter((f) => !ids.has(f.id)); lwrite(d); return { keys };
  },
  async listFiles(folderId) { const d = lread(); return folderId ? d.files.filter((f) => f.folderId === folderId) : d.files; },
  async getFile(id) { return lread().files.find((x) => x.id === id) || null; },
  async createFile(meta) { const d = lread(); d.files.push(meta); lwrite(d); return meta; },
  async updateFile(id, patch) { const d = lread(); const f = d.files.find((x) => x.id === id); if (f) Object.assign(f, patch); lwrite(d); },
  async deleteFile(id) {
    const d = lread(); const f = d.files.find((x) => x.id === id);
    d.files = d.files.filter((x) => x.id !== id); d.shares = d.shares.filter((s) => s.fileId !== id); lwrite(d);
    return f ? { key: f.key } : null;
  },
  async getShare(token) { return lread().shares.find((x) => x.token === token) || null; },
  async createShare(share) { const d = lread(); d.shares.push(share); lwrite(d); return share; },
  async revokeShare(token) { const d = lread(); const s = d.shares.find((x) => x.token === token); if (s) s.revoked = true; lwrite(d); },
};

/* ============================ SUPABASE BACKEND ============================ */
const sb = {
  async listChildren(folderId) {
    const c = getSupabase();
    const allFolders = (ok(await c.from("folders").select("*"), "list folders") || []).map(folderFromRow);
    const files = (ok(await c.from("files").select("*").eq("folder_id", folderId), "list files") || []).map(fileFromRow).filter((f) => !f.trashed);
    return {
      folders: allFolders.filter((f) => f.parentId === folderId),
      files,
      breadcrumb: buildBreadcrumb(allFolders, folderId),
    };
  },
  async quota() {
    const data = (ok(await getSupabase().from("files").select("size,trashed"), "quota") || []).filter((r) => !r.trashed);
    return { used: data.reduce((a, r) => a + Number(r.size || 0), 0), fileCount: data.length };
  },
  async createFolder(name, parentId) {
    const folder = { id: uid("fld"), name, parent_id: parentId || "root", created_at: Date.now() };
    ok(await getSupabase().from("folders").insert(folder), "create folder");
    return folderFromRow(folder);
  },
  async renameFolder(id, name) { ok(await getSupabase().from("folders").update({ name }).eq("id", id), "rename folder"); },
  async deleteFolderTree(id) {
    const c = getSupabase();
    const allFolders = ok(await c.from("folders").select("id,parent_id"), "list folders") || [];
    const ids = new Set([id]); let added = true;
    while (added) { added = false; for (const f of allFolders) if (f.parent_id && ids.has(f.parent_id) && !ids.has(f.id)) { ids.add(f.id); added = true; } }
    const idList = [...ids];
    const files = ok(await c.from("files").select("key").in("folder_id", idList), "list folder files") || [];
    ok(await c.from("files").delete().in("folder_id", idList), "delete folder files");
    ok(await c.from("folders").delete().in("id", idList), "delete folders");
    return { keys: files.map((f) => f.key) };
  },
  async listFiles(folderId) {
    let q = getSupabase().from("files").select("*");
    if (folderId) q = q.eq("folder_id", folderId);
    return (ok(await q, "list files") || []).map(fileFromRow);
  },
  async getFile(id) { return fileFromRow(ok(await getSupabase().from("files").select("*").eq("id", id).maybeSingle(), "get file")); },
  async createFile(meta) {
    const row = { id: meta.id, name: meta.name, size: meta.size || 0, type: meta.type, folder_id: meta.folderId, key: meta.key, created_at: meta.createdAt, starred: !!meta.starred, trashed: !!meta.trashed };
    ok(await getSupabase().from("files").insert(row), "create file"); return meta;
  },
  async updateFile(id, patch) {
    const row = {};
    if (patch.name !== undefined) row.name = patch.name;
    if (patch.folderId !== undefined) row.folder_id = patch.folderId;
    if (patch.starred !== undefined) row.starred = patch.starred;
    if (patch.trashed !== undefined) row.trashed = patch.trashed;
    if (Object.keys(row).length) ok(await getSupabase().from("files").update(row).eq("id", id), "update file");
  },
  async deleteFile(id) {
    const c = getSupabase();
    const data = ok(await c.from("files").select("key").eq("id", id).maybeSingle(), "get file");
    ok(await c.from("shares").delete().eq("file_id", id), "delete file shares");
    ok(await c.from("files").delete().eq("id", id), "delete file");
    return data ? { key: data.key } : null;
  },
  async getShare(token) { return shareFromRow(ok(await getSupabase().from("shares").select("*").eq("token", token).maybeSingle(), "get share")); },
  async createShare(share) {
    const row = { token: share.token, file_id: share.fileId, permission: share.permission, created_at: share.createdAt, expires_at: share.expiresAt, revoked: false };
    ok(await getSupabase().from("shares").insert(row), "create share"); return share;
  },
  async revokeShare(token) { ok(await getSupabase().from("shares").update({ revoked: true }).eq("token", token), "revoke share"); },
};

/* ============================ FACADE ============================ */
function impl() { return supabaseEnabled() ? sb : local; }

export const listChildren = (folderId) => impl().listChildren(folderId);
export const quota = () => impl().quota();
export const createFolder = (name, parentId) => impl().createFolder(name, parentId);
export const renameFolder = (id, name) => impl().renameFolder(id, name);
export const deleteFolderTree = (id) => impl().deleteFolderTree(id);
export const listFiles = (folderId) => impl().listFiles(folderId);
export const getFile = (id) => impl().getFile(id);
export const createFile = (meta) => impl().createFile(meta);
export const updateFile = (id, patch) => impl().updateFile(id, patch);
export const deleteFile = (id) => impl().deleteFile(id);
export const getShare = (token) => impl().getShare(token);
export const createShare = (share) => impl().createShare(share);
export const revokeShare = (token) => impl().revokeShare(token);
