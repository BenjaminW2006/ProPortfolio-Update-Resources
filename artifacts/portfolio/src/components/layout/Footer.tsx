export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 py-8">
      <div className="container mx-auto px-4 md:px-6 text-center">
        <p className="text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} Upstate Palmetto Property Services. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
