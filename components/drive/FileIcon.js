import { FileImage, FileVideo, FileAudio, FileText, FileArchive, FileSpreadsheet, FileType, Presentation, File as FileIco, Folder } from "lucide-react";
import { fileKind } from "@/lib/format";

const map = {
  image:   { Icon: FileImage, c: "text-pink-500", bg: "bg-pink-50" },
  video:   { Icon: FileVideo, c: "text-purple-500", bg: "bg-purple-50" },
  audio:   { Icon: FileAudio, c: "text-indigo-500", bg: "bg-indigo-50" },
  pdf:     { Icon: FileType, c: "text-red-500", bg: "bg-red-50" },
  text:    { Icon: FileText, c: "text-sky-600", bg: "bg-sky-50" },
  doc:     { Icon: FileText, c: "text-blue-600", bg: "bg-blue-50" },
  sheet:   { Icon: FileSpreadsheet, c: "text-green-600", bg: "bg-green-50" },
  slide:   { Icon: Presentation, c: "text-orange-500", bg: "bg-orange-50" },
  archive: { Icon: FileArchive, c: "text-amber-600", bg: "bg-amber-50" },
  file:    { Icon: FileIco, c: "text-bl-slate", bg: "bg-bl-mist" },
};

export function FileIcon({ type, name, size = 22 }) {
  const k = fileKind(type, name);
  const { Icon, c } = map[k] || map.file;
  return <Icon size={size} className={c} />;
}
export function FileIconBox({ type, name, size = 22 }) {
  const k = fileKind(type, name);
  const { Icon, c, bg } = map[k] || map.file;
  return <div className={"rounded-lg grid place-items-center " + bg} style={{ width: size + 16, height: size + 16 }}><Icon size={size} className={c} /></div>;
}
export function FolderIcon({ size = 22 }) {
  return <Folder size={size} className="text-bl-orange" fill="rgba(243,111,33,.15)" />;
}
