import logo from "@assets/Upstate_Palmetto_Property_Services_Logo_(1)_1777217420385.png";
import { Phone, Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="bg-white p-4 rounded-lg inline-block mb-6">
              <img
                src={logo}
                alt="Upstate Palmetto Property Services"
                className="h-16 w-auto object-contain filter brightness-0"
              />
            </div>
            <p className="text-slate-400 mb-6 leading-relaxed max-w-sm">
              Your trusted local partner for all property maintenance and handyman needs in the Upstate Palmetto region. Quality workmanship, handshake trust.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6">Quick Links</h3>
            <ul className="space-y-4">
              <li><a href="#services" className="hover:text-white transition-colors">Our Services</a></li>
              <li><a href="#why-choose-us" className="hover:text-white transition-colors">Why Choose Us</a></li>
              <li><a href="#portfolio" className="hover:text-white transition-colors">Project Gallery</a></li>
              <li><a href="#testimonials" className="hover:text-white transition-colors">Customer Reviews</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-primary mt-1 shrink-0" />
                <span>(864) 555-0198</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary mt-1 shrink-0" />
                <span>quotes@upstatepalmetto.com</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-1 shrink-0" />
                <span>Serving Greenville, Spartanburg, and surrounding Upstate SC areas.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} Upstate Palmetto Property Services. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
