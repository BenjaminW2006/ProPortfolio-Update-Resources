import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SiteSettings } from "@/context/SiteSettingsContext";

interface WizardData {
  companyName: string;
  serviceArea: string;
  tagline1: string;
  tagline2: string;
  tagline3: string;
  heroSubtitle: string;
  aboutTitle: string;
  aboutText: string;
  phone: string;
  email: string;
}

const INITIAL: WizardData = {
  companyName: "",
  serviceArea: "",
  tagline1: "Quality Work.",
  tagline2: "Done Right.",
  tagline3: "Every Time.",
  heroSubtitle: "Professional services tailored to your needs. We show up on time, work with care, and stand behind everything we do.",
  aboutTitle: "A Team You Can Count On.",
  aboutText: "We built this business because we saw a need for reliable, honest professionals in our community. We don't cut corners or leave messes. When we make a commitment, we keep it.",
  phone: "",
  email: "",
};

const STEPS = ["Your Business", "Your Story", "Contact Info", "All Set!"];

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  multiline?: boolean;
}

function Field({ label, value, onChange, placeholder, hint, multiline }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-200">{label}</label>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full rounded-lg border border-slate-600 bg-slate-700/60 px-3 py-2 text-white placeholder:text-slate-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="bg-slate-700/60 border-slate-600 text-white placeholder:text-slate-500"
        />
      )}
    </div>
  );
}

interface SetupWizardProps {
  onDone?: () => void;
}

export default function SetupWizard({ onDone }: SetupWizardProps = {}) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(INITIAL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const set = (key: keyof WizardData) => (v: string) =>
    setData((d) => ({ ...d, [key]: v }));

  const canAdvance = () => {
    if (step === 0) return data.companyName.trim().length > 0 && data.serviceArea.trim().length > 0;
    if (step === 1) return data.heroSubtitle.trim().length > 0 && data.aboutText.trim().length > 0;
    if (step === 2) return data.phone.trim().length > 0 && data.email.trim().length > 0;
    return true;
  };

  const handleFinish = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/settings/first-run", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-protection": "1" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to save");
      }
      const updated = (await res.json()) as SiteSettings;
      queryClient.setQueryData(["site-settings"], updated);
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      if (onDone) onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 overflow-y-auto py-8">
      <div className="w-full max-w-xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-6">
              {STEPS.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      i < step ? "bg-blue-500" : i === step ? "bg-blue-400 scale-125" : "bg-slate-600"
                    }`}
                  />
                  {i < STEPS.length - 1 && (
                    <div className={`w-8 h-px ${i < step ? "bg-blue-500" : "bg-slate-700"}`} />
                  )}
                </div>
              ))}
            </div>
            <p className="text-slate-400 text-sm">Step {step + 1} of {STEPS.length}</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="step0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  <div>
                    <h2 className="text-2xl font-bold font-serif text-white mb-1">Welcome! Let's set up your site.</h2>
                    <p className="text-slate-400 text-sm">This takes about two minutes. You can change everything later from the admin panel.</p>
                  </div>
                  <Field label="Business Name" value={data.companyName} onChange={set("companyName")} placeholder="e.g. Smith Home Services" />
                  <Field label="Service Area" value={data.serviceArea} onChange={set("serviceArea")} placeholder="e.g. Austin, Texas" hint="The city or region you serve — shown on the home page." />
                  <div className="border-t border-slate-700 pt-5 space-y-3">
                    <p className="text-sm text-slate-400 font-medium">Hero taglines (the big headline on your home page)</p>
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Line 1" value={data.tagline1} onChange={set("tagline1")} placeholder="Quality Work." />
                      <Field label="Line 2" value={data.tagline2} onChange={set("tagline2")} placeholder="Done Right." />
                      <Field label="Line 3" value={data.tagline3} onChange={set("tagline3")} placeholder="Every Time." />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  <div>
                    <h2 className="text-2xl font-bold font-serif text-white mb-1">Tell your story.</h2>
                    <p className="text-slate-400 text-sm">These words appear on your home page and help customers understand who you are.</p>
                  </div>
                  <Field
                    label="Hero description"
                    value={data.heroSubtitle}
                    onChange={set("heroSubtitle")}
                    placeholder="What makes your business different? One or two sentences."
                    multiline
                    hint="Shown below the tagline on the home page banner."
                  />
                  <Field
                    label="About section heading"
                    value={data.aboutTitle}
                    onChange={set("aboutTitle")}
                    placeholder="e.g. A Team You Can Count On."
                  />
                  <Field
                    label="About section paragraph"
                    value={data.aboutText}
                    onChange={set("aboutText")}
                    placeholder="Share why you started the business and what you stand for."
                    multiline
                    hint="Shown in the 'Why Choose Us' section."
                  />
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  <div>
                    <h2 className="text-2xl font-bold font-serif text-white mb-1">How can customers reach you?</h2>
                    <p className="text-slate-400 text-sm">Shown on the contact page and footer.</p>
                  </div>
                  <Field label="Phone number" value={data.phone} onChange={set("phone")} placeholder="(555) 000-0000" />
                  <Field label="Email address" value={data.email} onChange={set("email")} placeholder="hello@yourbusiness.com" />
                  {error && (
                    <p className="text-red-400 text-sm bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>
                  )}
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-center space-y-6 py-4"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30">
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold font-serif text-white mb-2">You're all set, {data.companyName || "welcome"}!</h2>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
                      Your site is personalized and ready. Head to the admin panel to upload photos, manage projects, add customer reviews, and customize your colors.
                    </p>
                  </div>
                  {error && (
                    <p className="text-red-400 text-sm bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
                      {error}
                    </p>
                  )}
                  <div className="flex flex-col gap-3 pt-2">
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 w-full h-12"
                      onClick={handleFinish}
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Launch My Site"}
                      {!saving && <ArrowRight className="ml-2 w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-slate-400 hover:text-white hover:bg-slate-700 w-full"
                      onClick={() => { window.location.href = "/admin"; }}
                      disabled={saving}
                    >
                      Go to Admin Panel instead
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {step < 3 && (
            <div className="flex justify-between mt-6">
              <Button
                variant="ghost"
                className="text-slate-400 hover:text-white hover:bg-slate-700"
                onClick={() => setStep((s) => s - 1)}
                disabled={step === 0}
              >
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 px-6"
                onClick={() => setStep((s) => s + 1)}
                disabled={!canAdvance()}
              >
                {step === 2 ? "Review & Finish" : "Next"}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
