import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { GiPalmTree } from "react-icons/gi";
import { Menu, X, Pencil } from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { isEditorMode } from "@/components/editor/EditorSection";

function toAcronym(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();
  const settings = useSiteSettings();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const navLinks = [
    { href: "/", label: "Home" },
    ...(settings.showGalleries ? [{ href: "/gallery", label: "Gallery" }] : []),
    { href: "/contact", label: "Contact" },
  ];

  const linkClass = (path: string) =>
    `text-sm font-medium px-3 py-1.5 rounded-md transition-colors duration-200 ${
      location === path
        ? "text-white bg-white/15"
        : "text-slate-300 hover:text-white hover:bg-white/10"
    }`;

  const focusNavbar = () => {
    window.parent.postMessage({ type: "section-focus", section: "navbar" }, "*");
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4 ${isEditorMode ? "group/nav" : ""}`}>
      <div
        className={`w-full max-w-2xl rounded-2xl border backdrop-blur-md transition-all duration-300 ${
          isScrolled ? "shadow-xl shadow-black/30" : "shadow-lg shadow-black/20"
        } ${isEditorMode ? "border-blue-500/0 group-hover/nav:border-blue-500/60 transition-[border-color]" : "border-white/10"}`}
        style={{
          backgroundColor: isScrolled
            ? "color-mix(in srgb, var(--site-header) 96%, transparent)"
            : "color-mix(in srgb, var(--site-header) 88%, transparent)",
        }}
      >
        <div className="flex items-center justify-between px-4 py-2.5">
          <Link href={isEditorMode ? "#" : "/"} className="min-w-0" onClick={isEditorMode ? (e) => { e.preventDefault(); focusNavbar(); } : undefined}>
            <span className="flex items-center gap-2 text-white font-semibold tracking-wide cursor-pointer hover:opacity-90 transition-opacity min-w-0">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.companyName}
                  className="h-7 w-auto max-w-[140px] object-contain shrink-0"
                />
              ) : (
                <GiPalmTree className="text-xl shrink-0" />
              )}
              <span className="sm:hidden text-sm font-bold tracking-wider">{settings.navAcronym || toAcronym(settings.companyName)}</span>
              <span className="hidden sm:block text-sm truncate">{settings.companyName}</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden sm:flex items-center gap-1 shrink-0">
            {isEditorMode ? (
              <button
                onClick={focusNavbar}
                className="opacity-0 group-hover/nav:opacity-100 transition-opacity duration-150 flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow-lg"
              >
                <Pencil className="w-3 h-3" />
                Edit Navbar
              </button>
            ) : (
              navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <span className={linkClass(link.href)}>{link.label}</span>
                </Link>
              ))
            )}
          </div>

          {/* Mobile: edit button or hamburger */}
          {isEditorMode ? (
            <button
              onClick={focusNavbar}
              className="sm:hidden opacity-0 group-hover/nav:opacity-100 transition-opacity duration-150 flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-md shadow-lg shrink-0"
            >
              <Pencil className="w-3 h-3" />
              Edit
            </button>
          ) : (
            <button
              className="sm:hidden shrink-0 flex items-center justify-center w-8 h-8 rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Mobile dropdown — hidden in editor mode */}
        {!isEditorMode && menuOpen && (
          <div className="sm:hidden border-t border-white/10 px-3 pb-3 pt-2 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <span className={linkClass(link.href) + " block"}>{link.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
