export function fmtBytes(n) {
  if (!n && n !== 0) return "-";
  if (n === 0) return "0 B";
  const u = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(u.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  return (n / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1) + " " + u[i];
}
export function fmtDate(ts) {
  try { return new Date(ts).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return "-"; }
}
export function fileKind(type = "", name = "") {
  const t = type.toLowerCase(); const n = name.toLowerCase();
  if (t.startsWith("image/")) return "image";
  if (t.startsWith("video/")) return "video";
  if (t.startsWith("audio/")) return "audio";
  if (t === "application/pdf" || n.endsWith(".pdf")) return "pdf";
  if (t.includes("zip") || n.match(/\.(zip|rar|7z)$/)) return "archive";
  if (t.startsWith("text/") || n.match(/\.(txt|md|csv|json|js|ts|html|css)$/)) return "text";
  if (n.match(/\.(doc|docx)$/)) return "doc";
  if (n.match(/\.(xls|xlsx)$/)) return "sheet";
  if (n.match(/\.(ppt|pptx)$/)) return "slide";
  return "file";
}
