import { Pencil } from "lucide-react";

// Set the editor session flag on first load with ?editor=1 so it persists
// through iframe navigation (sessionStorage survives page-level navigation
// within the same browsing context but is isolated from the parent window).
if (
  typeof window !== "undefined" &&
  window !== window.top &&
  new URLSearchParams(window.location.search).has("editor")
) {
  try { sessionStorage.setItem("__site_editor", "1"); } catch {}
}

export const isEditorMode =
  typeof window !== "undefined" &&
  window !== window.top &&
  (() => { try { return sessionStorage.getItem("__site_editor") === "1"; } catch { return false; } })();

const LABELS: Record<string, string> = {
  hero: "Hero",
  services: "Services",
  about: "About",
  navbar: "Navbar",
};

export function EditorSection({
  children,
  section,
  className,
}: {
  children: React.ReactNode;
  section: string;
  className?: string;
}) {
  if (!isEditorMode) return <>{children}</>;

  return (
    <div className={`relative group ${className ?? ""}`}>
      <div className="absolute inset-0 border-2 border-blue-500/0 group-hover:border-blue-500/50 pointer-events-none z-[100] transition-all duration-150" />
      <button
        className="absolute top-3 left-3 z-[101] bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-1.5"
        onClick={(e) => {
          e.stopPropagation();
          window.parent.postMessage({ type: "section-focus", section }, "*");
        }}
      >
        <Pencil className="w-3 h-3" />
        Edit {LABELS[section] ?? section}
      </button>
      {children}
    </div>
  );
}
