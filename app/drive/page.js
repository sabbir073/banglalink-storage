"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Logo } from "@/components/Brand";
import { Button, Modal, Progress, Badge } from "@/components/ui";
import { Toaster, toast } from "@/lib/toast";
import { FileIcon, FileIconBox, FolderIcon } from "@/components/drive/FileIcon";
import { fmtBytes, fmtDate, fileKind } from "@/lib/format";
import {
  Plus, Upload, FolderPlus, Search, LayoutGrid, List as ListIcon, HardDrive, Image as ImageIcon,
  Share2, Star, Clock, Trash2, ChevronRight, MoreVertical, Download, Pencil, Loader2, X,
  CloudUpload, CheckCircle2, Cloud, RefreshCw, Smartphone, Settings, LogOut, Link2, Copy, FolderUp, RotateCcw,
} from "lucide-react";

const NAV = [
  { id: "drive", label: "My Drive", icon: HardDrive },
  { id: "photos", label: "Photos & Backup", icon: ImageIcon },
  { id: "shared", label: "Shared", icon: Share2 },
  { id: "starred", label: "Starred", icon: Star },
  { id: "recent", label: "Recent", icon: Clock },
  { id: "trash", label: "Trash", icon: Trash2 },
];

export default function Drive() {
  const [view, setView] = useState("drive");
  const [folderId, setFolderId] = useState("root");
  const [data, setData] = useState({ folders: [], files: [], breadcrumb: [{ id: "root", name: "My Drive" }] });
  const [allFiles, setAllFiles] = useState([]);
  const [quota, setQuota] = useState({ used: 0, total: 107374182400, mode: "mock" });
  const [loading, setLoading] = useState(true);
  const [layout, setLayout] = useState("grid");
  const [search, setSearch] = useState("");
  const [uploads, setUploads] = useState([]); // {id,name,pct,done}
  const [sharedIds, setSharedIds] = useState(new Set());
  const [menu, setMenu] = useState(null); // {x,y,item,kind}
  const [preview, setPreview] = useState(null);
  const [shareItem, setShareItem] = useState(null);
  const [renameItem, setRenameItem] = useState(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef(null);

  const loadQuota = useCallback(async () => {
    const q = await fetch("/api/quota").then((r) => r.json());
    setQuota(q);
  }, []);

  const loadDrive = useCallback(async (fid) => {
    setLoading(true);
    const d = await fetch("/api/list?folderId=" + fid).then((r) => r.json());
    setData(d); setLoading(false);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const d = await fetch("/api/files").then((r) => r.json());
    setAllFiles(d.files); setLoading(false);
  }, []);

  useEffect(() => { loadQuota(); }, [loadQuota]);
  useEffect(() => {
    if (view === "drive") loadDrive(folderId);
    else loadAll();
  }, [view, folderId, loadDrive, loadAll]);

  // ---- upload ----
  function pickFiles() { fileInput.current?.click(); }
  function onFilesChosen(e) { handleFiles(Array.from(e.target.files || [])); e.target.value = ""; }

  function setPct(localId, pct) { setUploads((u) => u.map((x) => (x.id === localId ? { ...x, pct } : x))); }
  function finishUpload(localId, file) {
    setUploads((u) => u.map((x) => (x.id === localId ? { ...x, pct: 100, done: true } : x)));
    toast(file.name + " backed up to cloud", { type: "success" });
    setTimeout(() => setUploads((u) => u.filter((x) => x.id !== localId)), 1500);
    loadQuota();
    if (view === "drive") loadDrive(folderId); else loadAll();
  }

  async function handleFiles(files) {
    if (!files.length) return;
    const targetFolder = view === "drive" ? folderId : "root";
    for (const file of files) {
      const localId = Math.random().toString(36).slice(2);
      setUploads((u) => [...u, { id: localId, name: file.name, pct: 0, done: false }]);
      try {
        const init = await fetch("/api/uploads/create", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: file.name, type: file.type, folderId: targetFolder }),
        }).then((r) => r.json());

        if (init.strategy === "multipart") await multipartUpload(file, init, targetFolder, localId);
        else await proxyUpload(file, targetFolder, localId);

        finishUpload(localId, file);
      } catch (err) {
        setUploads((u) => u.filter((x) => x.id !== localId));
        toast("Upload failed: " + file.name, { type: "error" });
      }
    }
  }

  // Direct browser -> S3 multipart upload (parts signed by our API). No size limit; retries per part.
  async function multipartUpload(file, init, targetFolder, localId) {
    const partSize = init.partSize || 10485760;
    const partCount = Math.max(1, Math.ceil(file.size / partSize));
    const parts = [];
    let uploaded = 0;
    try {
      for (let n = 1; n <= partCount; n++) {
        const blob = file.slice((n - 1) * partSize, Math.min(file.size, n * partSize));
        const { url } = await fetch("/api/uploads/sign-part", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: init.key, uploadId: init.uploadId, partNumber: n }),
        }).then((r) => r.json());
        const etag = await putPart(url, blob, (loaded) => setPct(localId, Math.round(((uploaded + loaded) / file.size) * 100)), 1);
        parts.push({ PartNumber: n, ETag: etag });
        uploaded += blob.size;
      }
      await fetch("/api/uploads/complete", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: init.fileId, key: init.key, uploadId: init.uploadId, parts, name: file.name, size: file.size, type: file.type, folderId: targetFolder }),
      });
    } catch (err) {
      fetch("/api/uploads/abort", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: init.key, uploadId: init.uploadId }) }).catch(() => {});
      throw err;
    }
  }

  // PUT a single part with progress + one retry; resolves with the part ETag.
  function putPart(url, blob, onProgress, retries = 1) {
    return new Promise((resolve, reject) => {
      const attempt = (left) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", url);
        xhr.upload.onprogress = (ev) => { if (ev.lengthComputable) onProgress(ev.loaded); };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const etag = xhr.getResponseHeader("ETag");
            if (etag) resolve(etag); else reject(new Error("missing ETag"));
          } else if (left > 0) attempt(left - 1);
          else reject(new Error("part failed: " + xhr.status));
        };
        xhr.onerror = () => (left > 0 ? attempt(left - 1) : reject(new Error("network error")));
        xhr.send(blob);
      };
      attempt(retries);
    });
  }

  // Fallback for mock mode (no S3): single upload through our API.
  function proxyUpload(file, targetFolder, localId) {
    return new Promise((resolve, reject) => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folderId", targetFolder);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/files");
      xhr.upload.onprogress = (ev) => { if (ev.lengthComputable) setPct(localId, Math.round((ev.loaded / ev.total) * 100)); };
      xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error("proxy failed")));
      xhr.onerror = () => reject(new Error("network error"));
      xhr.send(fd);
    });
  }

  function onDrop(e) {
    e.preventDefault(); setDragOver(false);
    handleFiles(Array.from(e.dataTransfer.files || []));
  }

  // ---- actions ----
  async function createFolder(name) {
    await fetch("/api/folders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, parentId: folderId }) });
    setNewFolderOpen(false); toast("Folder created"); loadDrive(folderId);
  }
  async function doRename(item, name) {
    const url = item._kind === "folder" ? "/api/folders/" + item.id : "/api/files/" + item.id;
    await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    setRenameItem(null); toast("Renamed");
    view === "drive" ? loadDrive(folderId) : loadAll();
  }
  async function patchFile(id, body) {
    await fetch("/api/files/" + id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    view === "drive" ? loadDrive(folderId) : loadAll(); loadQuota();
  }
  async function deleteForever(item) {
    const url = item._kind === "folder" ? "/api/folders/" + item.id : "/api/files/" + item.id;
    await fetch(url, { method: "DELETE" });
    setConfirmDel(null); toast("Deleted permanently");
    view === "drive" ? loadDrive(folderId) : loadAll(); loadQuota();
  }
  function openFolder(f) { setView("drive"); setFolderId(f.id); }

  // ---- derived list for current view ----
  function currentList() {
    if (view === "drive") {
      const folders = data.folders.map((f) => ({ ...f, _kind: "folder" }));
      const files = data.files.map((f) => ({ ...f, _kind: "file" }));
      return filterSearch([...folders, ...files]);
    }
    let files = allFiles;
    if (view === "photos") files = files.filter((f) => fileKind(f.type, f.name) === "image" && !f.trashed);
    else if (view === "starred") files = files.filter((f) => f.starred && !f.trashed);
    else if (view === "recent") files = files.filter((f) => !f.trashed).sort((a, b) => b.createdAt - a.createdAt).slice(0, 40);
    else if (view === "trash") files = files.filter((f) => f.trashed);
    else if (view === "shared") files = files.filter((f) => sharedIds.has(f.id) && !f.trashed);
    return filterSearch(files.map((f) => ({ ...f, _kind: "file" })));
  }
  function filterSearch(items) {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }

  const list = currentList();
  const usedPct = (quota.used / quota.total) * 100;

  return (
    <div className="h-screen flex flex-col bg-bl-mist" onClick={() => setMenu(null)}>
      <input ref={fileInput} type="file" multiple hidden onChange={onFilesChosen} />
      <Toaster />

      {/* top bar */}
      <header className="h-16 bg-white border-b border-bl-line flex items-center px-4 gap-3 shrink-0">
        <Link href="/"><Logo size={34} /></Link>
        <div className="flex-1 max-w-xl mx-auto relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-bl-slate" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search in Banglalink Cloud"
            className="w-full bg-bl-mist rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 ring-bl-orange/30 text-sm" />
        </div>
        <div className="flex items-center gap-1">
          <div className="flex bg-bl-mist rounded-lg p-0.5">
            <button onClick={() => setLayout("grid")} className={"p-1.5 rounded-md " + (layout === "grid" ? "bg-white shadow-soft text-bl-orange" : "text-bl-slate")}><LayoutGrid size={18} /></button>
            <button onClick={() => setLayout("list")} className={"p-1.5 rounded-md " + (layout === "list" ? "bg-white shadow-soft text-bl-orange" : "text-bl-slate")}><ListIcon size={18} /></button>
          </div>
          <AccountMenu />
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* sidebar */}
        <aside className="w-64 bg-white border-r border-bl-line p-3 hidden md:flex flex-col shrink-0">
          <div className="relative group">
            <Button size="lg" className="w-full" onClick={pickFiles}><Plus size={18} /> New upload</Button>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button onClick={pickFiles} className="flex items-center justify-center gap-1.5 text-xs font-semibold border border-bl-line rounded-lg py-2 hover:bg-bl-mist"><FolderUp size={14} /> Files</button>
              <button onClick={() => setNewFolderOpen(true)} className="flex items-center justify-center gap-1.5 text-xs font-semibold border border-bl-line rounded-lg py-2 hover:bg-bl-mist"><FolderPlus size={14} /> Folder</button>
            </div>
          </div>

          <nav className="mt-4 space-y-0.5">
            {NAV.map((n) => (
              <button key={n.id} onClick={() => { setView(n.id); setFolderId("root"); }}
                className={"w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition " + (view === n.id ? "bg-bl-gradient-soft text-bl-deep" : "text-bl-slate hover:bg-bl-mist")}>
                <n.icon size={18} /> {n.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-4">
            <div className="rounded-xl border border-bl-line p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-bl-ink"><HardDrive size={16} className="text-bl-orange" /> Storage</div>
              <div className="mt-2"><Progress value={quota.used} max={quota.total} /></div>
              <div className="text-xs text-bl-slate mt-2">{fmtBytes(quota.used)} of {fmtBytes(quota.total)} used</div>
              <Link href="/subscription"><span className="mt-2 inline-block text-xs font-bold text-bl-orange hover:underline">Upgrade storage →</span></Link>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-bl-slate px-1">
              <span className={"w-1.5 h-1.5 rounded-full " + (quota.mode === "s3" ? "bg-green-500" : "bg-amber-400")} />
              {quota.mode === "s3" ? "Connected to S3 storage" : "Local demo storage (add S3 keys)"}
            </div>
          </div>
        </aside>

        {/* main */}
        <main className="flex-1 flex flex-col min-w-0"
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)} onDrop={onDrop}>

          {/* breadcrumb / header */}
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-1 text-lg font-bold text-bl-ink min-w-0">
              {view === "drive" ? (
                data.breadcrumb.map((b, i) => (
                  <span key={b.id} className="flex items-center gap-1 min-w-0">
                    <button onClick={() => setFolderId(b.id)} className={"truncate hover:text-bl-orange " + (i === data.breadcrumb.length - 1 ? "text-bl-ink" : "text-bl-slate")}>{b.name}</button>
                    {i < data.breadcrumb.length - 1 && <ChevronRight size={16} className="text-bl-slate shrink-0" />}
                  </span>
                ))
              ) : (
                <span className="capitalize">{NAV.find((n) => n.id === view)?.label}</span>
              )}
            </div>
            <button onClick={() => (view === "drive" ? loadDrive(folderId) : loadAll())} className="p-2 rounded-lg hover:bg-bl-mist text-bl-slate"><RefreshCw size={16} /></button>
          </div>

          {view === "photos" && (
            <div className="mx-6 mb-3 bl-gradient-soft border border-orange-100 rounded-xl p-3 flex items-center gap-3 text-sm">
              <div className="bl-gradient w-9 h-9 rounded-lg grid place-items-center text-white"><CloudUpload size={18} /></div>
              <div className="flex-1"><b className="text-bl-ink">Auto-backup is on.</b> <span className="text-bl-slate">Photos, videos and contacts from your device are backed up automatically over Wi-Fi.</span></div>
              <Badge tone="green"><CheckCircle2 size={12} /> Synced</Badge>
            </div>
          )}

          {/* content */}
          <div className="flex-1 overflow-auto scroll-thin px-6 pb-24 relative">
            {dragOver && (
              <div className="absolute inset-4 z-20 border-2 border-dashed border-bl-orange rounded-2xl bg-orange-50/80 grid place-items-center pointer-events-none">
                <div className="text-center text-bl-deep font-bold"><CloudUpload size={40} className="mx-auto" /> Drop files to upload</div>
              </div>
            )}

            {loading ? (
              <div className="grid place-items-center h-64 text-bl-slate"><Loader2 className="animate-spin" /></div>
            ) : list.length === 0 ? (
              <Empty view={view} onUpload={pickFiles} />
            ) : layout === "grid" ? (
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))" }}>
                {list.map((item) => (
                  <GridCard key={item.id} item={item}
                    onOpen={() => item._kind === "folder" ? openFolder(item) : setPreview(item)}
                    onMenu={(x, y) => setMenu({ x, y, item })} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-bl-line overflow-hidden">
                <div className="grid grid-cols-12 px-4 py-2.5 text-xs font-bold text-bl-slate border-b border-bl-line">
                  <div className="col-span-6">Name</div><div className="col-span-2">Size</div><div className="col-span-3">Modified</div><div className="col-span-1"></div>
                </div>
                {list.map((item) => (
                  <Row key={item.id} item={item}
                    onOpen={() => item._kind === "folder" ? openFolder(item) : setPreview(item)}
                    onMenu={(x, y) => setMenu({ x, y, item })} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* upload tray */}
      {uploads.length > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 md:left-auto md:right-5 md:translate-x-0 w-80 bg-white rounded-xl shadow-pop border border-bl-line overflow-hidden z-40">
          <div className="px-4 py-2.5 bg-bl-ink text-white text-sm font-semibold flex items-center gap-2"><CloudUpload size={16} /> Uploading {uploads.length} item(s)</div>
          <div className="max-h-52 overflow-auto">
            {uploads.map((u) => (
              <div key={u.id} className="px-4 py-2 border-b border-bl-line last:border-0">
                <div className="flex items-center justify-between text-xs"><span className="truncate text-bl-ink">{u.name}</span>{u.done ? <CheckCircle2 size={14} className="text-green-500" /> : <span className="text-bl-slate">{u.pct}%</span>}</div>
                <div className="mt-1"><Progress value={u.pct} /></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* context menu */}
      {menu && <ContextMenu menu={menu} view={view}
        onClose={() => setMenu(null)}
        onPreview={() => { menu.item._kind === "file" ? setPreview(menu.item) : openFolder(menu.item); setMenu(null); }}
        onShare={() => { setShareItem(menu.item); setMenu(null); }}
        onRename={() => { setRenameItem(menu.item); setMenu(null); }}
        onStar={() => { patchFile(menu.item.id, { starred: !menu.item.starred }); setMenu(null); }}
        onTrash={() => { patchFile(menu.item.id, { trashed: true }); toast("Moved to trash"); setMenu(null); }}
        onRestore={() => { patchFile(menu.item.id, { trashed: false }); toast("Restored"); setMenu(null); }}
        onDelete={() => { setConfirmDel(menu.item); setMenu(null); }}
        onDownload={() => { window.open("/api/files/" + menu.item.id + "/raw?download=1", "_blank"); setMenu(null); }}
      />}

      <PreviewModal item={preview} onClose={() => setPreview(null)} onShare={(it) => { setPreview(null); setShareItem(it); }} />
      <ShareModal item={shareItem} onClose={() => setShareItem(null)} onShared={(id) => setSharedIds((s) => new Set(s).add(id))} />
      <RenameModal item={renameItem} onClose={() => setRenameItem(null)} onSave={doRename} />
      <NewFolderModal open={newFolderOpen} onClose={() => setNewFolderOpen(false)} onCreate={createFolder} />
      <ConfirmModal item={confirmDel} onClose={() => setConfirmDel(null)} onConfirm={deleteForever} />
    </div>
  );
}

/* ---------------- sub components ---------------- */

function AccountMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button onClick={() => setOpen((o) => !o)} className="w-9 h-9 rounded-full bl-gradient text-white font-bold grid place-items-center">M</button>
      {open && (
        <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-pop border border-bl-line p-1 z-50 animate-pop">
          <div className="px-3 py-3 border-b border-bl-line">
            <div className="font-bold text-bl-ink">Mahedi Hasan</div>
            <div className="text-xs text-bl-slate">+880 1711 000001 · 100 GB plan</div>
          </div>
          <Link href="/subscription"><div className="px-3 py-2 rounded-lg hover:bg-bl-mist text-sm flex items-center gap-2"><HardDrive size={15} /> Manage subscription</div></Link>
          <Link href="/mobile"><div className="px-3 py-2 rounded-lg hover:bg-bl-mist text-sm flex items-center gap-2"><Smartphone size={15} /> Get the mobile app</div></Link>
          <div className="px-3 py-2 rounded-lg hover:bg-bl-mist text-sm flex items-center gap-2"><Settings size={15} /> Settings</div>
          <Link href="/"><div className="px-3 py-2 rounded-lg hover:bg-bl-mist text-sm flex items-center gap-2 text-red-500"><LogOut size={15} /> Sign out</div></Link>
        </div>
      )}
    </div>
  );
}

function GridCard({ item, onOpen, onMenu }) {
  const isImg = item._kind === "file" && fileKind(item.type, item.name) === "image";
  return (
    <div onDoubleClick={onOpen} onContextMenu={(e) => { e.preventDefault(); onMenu(e.clientX, e.clientY); }}
      className="group bg-white rounded-xl border border-bl-line overflow-hidden hover:shadow-pop transition cursor-pointer">
      <div className="h-28 bg-bl-mist grid place-items-center relative" onClick={onOpen}>
        {isImg ? <img src={"/api/files/" + item.id + "/raw"} alt="" className="w-full h-full object-cover" /> :
          item._kind === "folder" ? <FolderIcon size={42} /> : <FileIcon type={item.type} name={item.name} size={40} />}
        {item.starred && <Star size={14} className="absolute top-2 left-2 text-bl-yellow" fill="#FDB913" />}
        <button onClick={(e) => { e.stopPropagation(); onMenu(e.clientX, e.clientY); }}
          className="absolute top-2 right-2 p-1 rounded-md bg-white/80 opacity-0 group-hover:opacity-100 text-bl-slate hover:text-bl-ink"><MoreVertical size={16} /></button>
      </div>
      <div className="p-2.5 flex items-center gap-2">
        {item._kind === "folder" ? <FolderIcon size={16} /> : <FileIcon type={item.type} name={item.name} size={16} />}
        <div className="min-w-0">
          <div className="text-sm font-medium text-bl-ink truncate">{item.name}</div>
          <div className="text-[11px] text-bl-slate">{item._kind === "folder" ? "Folder" : fmtBytes(item.size)}</div>
        </div>
      </div>
    </div>
  );
}

function Row({ item, onOpen, onMenu }) {
  return (
    <div onDoubleClick={onOpen} onContextMenu={(e) => { e.preventDefault(); onMenu(e.clientX, e.clientY); }}
      className="grid grid-cols-12 px-4 py-2.5 items-center hover:bg-bl-mist border-b border-bl-line last:border-0 cursor-pointer group">
      <div className="col-span-6 flex items-center gap-3 min-w-0" onClick={onOpen}>
        {item._kind === "folder" ? <FolderIcon size={20} /> : <FileIcon type={item.type} name={item.name} size={20} />}
        <span className="text-sm font-medium text-bl-ink truncate">{item.name}</span>
        {item.starred && <Star size={13} className="text-bl-yellow shrink-0" fill="#FDB913" />}
      </div>
      <div className="col-span-2 text-sm text-bl-slate">{item._kind === "folder" ? "—" : fmtBytes(item.size)}</div>
      <div className="col-span-3 text-sm text-bl-slate">{fmtDate(item.createdAt)}</div>
      <div className="col-span-1 flex justify-end">
        <button onClick={(e) => { e.stopPropagation(); onMenu(e.clientX, e.clientY); }} className="p-1.5 rounded-md hover:bg-white text-bl-slate opacity-0 group-hover:opacity-100"><MoreVertical size={16} /></button>
      </div>
    </div>
  );
}

function ContextMenu({ menu, view, onClose, onPreview, onShare, onRename, onStar, onTrash, onRestore, onDelete, onDownload }) {
  const { x, y, item } = menu;
  const isFile = item._kind === "file";
  const inTrash = view === "trash";
  const style = { left: Math.min(x, (typeof window !== "undefined" ? window.innerWidth : 9999) - 220), top: Math.min(y, (typeof window !== "undefined" ? window.innerHeight : 9999) - 320) };
  const Item = ({ icon: I, label, onClick, danger }) => (
    <button onClick={onClick} className={"w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-bl-mist " + (danger ? "text-red-500" : "text-bl-ink")}><I size={16} /> {label}</button>
  );
  return (
    <div className="fixed z-50 w-52 bg-white rounded-xl shadow-pop border border-bl-line p-1 animate-pop" style={style} onClick={(e) => e.stopPropagation()}>
      <Item icon={isFile ? Share2 : FolderUp} label={isFile ? "Open / preview" : "Open"} onClick={onPreview} />
      {isFile && !inTrash && <Item icon={Share2} label="Share link" onClick={onShare} />}
      {isFile && !inTrash && <Item icon={Download} label="Download" onClick={onDownload} />}
      {!inTrash && <Item icon={Pencil} label="Rename" onClick={onRename} />}
      {isFile && !inTrash && <Item icon={Star} label={item.starred ? "Remove star" : "Add star"} onClick={onStar} />}
      <div className="h-px bg-bl-line my-1" />
      {inTrash ? (
        <>
          {isFile && <Item icon={RotateCcw} label="Restore" onClick={onRestore} />}
          <Item icon={Trash2} label="Delete forever" onClick={onDelete} danger />
        </>
      ) : isFile ? (
        <Item icon={Trash2} label="Move to trash" onClick={onTrash} danger />
      ) : (
        <Item icon={Trash2} label="Delete folder" onClick={onDelete} danger />
      )}
    </div>
  );
}

function PreviewModal({ item, onClose, onShare }) {
  const [text, setText] = useState("");
  useEffect(() => {
    setText("");
    if (item && fileKind(item.type, item.name) === "text") {
      fetch("/api/files/" + item.id + "/raw").then((r) => r.text()).then((t) => setText(t.slice(0, 5000)));
    }
  }, [item]);
  if (!item) return null;
  const kind = fileKind(item.type, item.name);
  const raw = "/api/files/" + item.id + "/raw";
  return (
    <Modal open={!!item} onClose={onClose} title={item.name} width="max-w-3xl"
      footer={<>
        <Button variant="outline" onClick={() => window.open(raw + "?download=1", "_blank")}><Download size={16} /> Download</Button>
        <Button onClick={() => onShare(item)}><Share2 size={16} /> Share</Button>
      </>}>
      <div className="bg-bl-mist rounded-xl p-3 grid place-items-center min-h-[260px] max-h-[60vh] overflow-auto">
        {kind === "image" ? <img src={raw} alt={item.name} className="max-h-[55vh] rounded-lg" /> :
         kind === "pdf" ? <iframe src={raw} className="w-full h-[55vh] rounded-lg bg-white" /> :
         kind === "video" ? <video src={raw} controls className="max-h-[55vh] rounded-lg" /> :
         kind === "audio" ? <audio src={raw} controls className="w-full" /> :
         kind === "text" ? <pre className="text-xs text-bl-ink whitespace-pre-wrap w-full">{text || "Loading…"}</pre> :
         <div className="text-center text-bl-slate"><FileIconBox type={item.type} name={item.name} size={40} /><div className="mt-3">No inline preview. Use download.</div></div>}
      </div>
      <div className="text-xs text-bl-slate mt-3 flex gap-4"><span>{fmtBytes(item.size)}</span><span>{item.type || "file"}</span><span>Added {fmtDate(item.createdAt)}</span></div>
    </Modal>
  );
}

function ShareModal({ item, onClose, onShared }) {
  const [permission, setPermission] = useState("view");
  const [expiry, setExpiry] = useState("168");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { setLink(""); setPermission("view"); setExpiry("168"); }, [item]);
  if (!item) return null;
  async function create() {
    setBusy(true);
    const s = await fetch("/api/shares", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId: item.id, permission, expiresInHours: Number(expiry) }) }).then((r) => r.json());
    setBusy(false);
    const url = window.location.origin + "/share/" + s.token;
    setLink(url); onShared(item.id); toast("Secure share link created", { type: "success" });
  }
  return (
    <Modal open={!!item} onClose={onClose} title={"Share “" + item.name + "”"} width="max-w-md">
      <p className="text-sm text-bl-slate">Create a secure link with real access control and an expiry, enforced on the server.</p>
      <div className="mt-4 space-y-3">
        <div>
          <label className="text-sm font-semibold text-bl-ink">Permission</label>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {[["view", "View only"], ["download", "Allow download"]].map(([v, l]) => (
              <button key={v} onClick={() => setPermission(v)} className={"py-2.5 rounded-xl text-sm font-semibold border " + (permission === v ? "border-bl-orange bg-bl-gradient-soft text-bl-deep" : "border-bl-line text-bl-slate hover:bg-bl-mist")}>{l}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-bl-ink">Link expires in</label>
          <select value={expiry} onChange={(e) => setExpiry(e.target.value)} className="mt-1.5 w-full border border-bl-line rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 ring-bl-orange/30">
            <option value="24">24 hours</option><option value="72">3 days</option><option value="168">7 days</option><option value="720">30 days</option>
          </select>
        </div>
        {!link ? (
          <Button onClick={create} disabled={busy} className="w-full"> {busy ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />} Create secure link</Button>
        ) : (
          <div className="animate-slideup">
            <div className="flex items-center gap-2 bg-bl-mist rounded-xl px-3 py-2.5">
              <Link2 size={16} className="text-bl-orange shrink-0" />
              <input readOnly value={link} className="flex-1 bg-transparent text-sm text-bl-ink outline-none truncate" />
              <button onClick={() => { navigator.clipboard?.writeText(link); toast("Link copied"); }} className="p-1.5 rounded-lg hover:bg-white text-bl-slate"><Copy size={15} /></button>
            </div>
            <div className="text-xs text-bl-slate mt-2 flex items-center gap-1.5"><CheckCircle2 size={13} className="text-green-500" /> {permission === "download" ? "Recipients can view and download" : "Recipients can view only"} · expires in {Number(expiry) >= 168 ? Number(expiry) / 24 + " days" : expiry + " hours"}</div>
            <a href={link} target="_blank" rel="noreferrer" className="text-xs font-bold text-bl-orange hover:underline mt-2 inline-block">Open share page →</a>
          </div>
        )}
      </div>
    </Modal>
  );
}

function RenameModal({ item, onClose, onSave }) {
  const [name, setName] = useState("");
  useEffect(() => { setName(item?.name || ""); }, [item]);
  if (!item) return null;
  return (
    <Modal open={!!item} onClose={onClose} title="Rename"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={() => onSave(item, name)}>Save</Button></>}>
      <input value={name} onChange={(e) => setName(e.target.value)} autoFocus className="w-full border border-bl-line rounded-xl px-3 py-2.5 outline-none focus:ring-2 ring-bl-orange/30" />
    </Modal>
  );
}

function NewFolderModal({ open, onClose, onCreate }) {
  const [name, setName] = useState("Untitled folder");
  useEffect(() => { if (open) setName("Untitled folder"); }, [open]);
  return (
    <Modal open={open} onClose={onClose} title="New folder"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={() => onCreate(name)}>Create</Button></>}>
      <input value={name} onChange={(e) => setName(e.target.value)} autoFocus className="w-full border border-bl-line rounded-xl px-3 py-2.5 outline-none focus:ring-2 ring-bl-orange/30" />
    </Modal>
  );
}

function ConfirmModal({ item, onClose, onConfirm }) {
  if (!item) return null;
  return (
    <Modal open={!!item} onClose={onClose} title="Delete permanently?"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="danger" onClick={() => onConfirm(item)}>Delete forever</Button></>}>
      <p className="text-sm text-bl-slate"><b className="text-bl-ink">{item.name}</b> will be permanently deleted from cloud storage. This cannot be undone.</p>
    </Modal>
  );
}

function Empty({ view, onUpload }) {
  const msg = {
    drive: ["This folder is empty", "Upload files or create a folder to get started."],
    photos: ["No photos yet", "Photos backed up from your device will appear here."],
    shared: ["Nothing shared yet", "Files you share will show up here."],
    starred: ["No starred items", "Star important files for quick access."],
    recent: ["Nothing recent", "Recently added files will appear here."],
    trash: ["Trash is empty", "Deleted files stay here until removed."],
  }[view] || ["Empty", ""];
  return (
    <div className="grid place-items-center h-72 text-center">
      <div>
        <div className="bl-gradient-soft w-16 h-16 rounded-2xl grid place-items-center mx-auto text-bl-orange"><Cloud size={30} /></div>
        <div className="mt-3 font-bold text-bl-ink">{msg[0]}</div>
        <div className="text-sm text-bl-slate mt-1">{msg[1]}</div>
        {view === "drive" && <Button className="mt-4" onClick={onUpload}><Upload size={16} /> Upload files</Button>}
      </div>
    </div>
  );
}
