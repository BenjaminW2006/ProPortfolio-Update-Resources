import logo from "@assets/Upstate_Palmetto_Property_Services_Logo_(1)_1777217420385.png";

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 py-10">
      <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <img
          src={logo}
          alt="Upstate Palmetto Property Services"
          className="h-14 w-auto object-contain"
        />
        <p className="text-slate-500 text-sm text-center md:text-right">
          &copy; {new Date().getFullYear()} Upstate Palmetto Property Services. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
