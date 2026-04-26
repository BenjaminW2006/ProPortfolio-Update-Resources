import { useState, useEffect } from "react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-slate-900/98 backdrop-blur-sm shadow-lg py-3"
          : "bg-slate-900/80 backdrop-blur-sm py-4"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-center">
        <span className="text-white text-2xl font-semibold tracking-wide">
          Upstate Palmetto Property Services
        </span>
      </div>
    </nav>
  );
}
