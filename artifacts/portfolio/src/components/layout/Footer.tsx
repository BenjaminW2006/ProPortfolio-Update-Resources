import { useSiteSettings } from "@/context/SiteSettingsContext";

export default function Footer() {
  const settings = useSiteSettings();
  return (
    <footer className="bg-slate-900 border-t border-slate-800 py-8">
      <div className="container mx-auto px-4 md:px-6 text-center">
        <p className="text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} {settings.companyName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
