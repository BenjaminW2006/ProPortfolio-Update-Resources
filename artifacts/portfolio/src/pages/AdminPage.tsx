import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, Trash2, LogOut, ImageIcon, Loader2, CheckCircle2 } from "lucide-react";

const CATEGORIES = [
  {
    key: "interior",
    label: "Interior",
    slots: Array.from({ length: 6 }, (_, i) => ({
      key: `interior-${i + 1}` as const,
      label: `Interior Photo ${i + 1}`,
      description: "Interior gallery image",
    })),
  },
  {
    key: "exterior",
    label: "Exterior",
    slots: Array.from({ length: 6 }, (_, i) => ({
      key: `exterior-${i + 1}` as const,
      label: `Exterior Photo ${i + 1}`,
      description: "Exterior gallery image",
    })),
  },
] as const;

const SLOTS = CATEGORIES.flatMap((c) => c.slots);

interface ImageRecord {
  slot: string;
  objectPath: string;
}

interface ApiErrorResponse {
  error?: string;
}

function apiCall(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, { ...options, credentials: "include" });
}

function apiMutation(url: string, options: RequestInit = {}): Promise<Response> {
  const existing = (options.headers as Record<string, string>) ?? {};
  return fetch(url, {
    ...options,
    credentials: "include",
    headers: { ...existing, "x-csrf-protection": "1" },
  });
}

function getCloudImageUrl(objectPath: string): string {
  return `/api/storage${objectPath}`;
}

function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiMutation("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: input }),
      });
      if (res.ok) {
        sessionStorage.setItem("admin_logged_in", "1");
        onLogin();
      } else {
        const data = await res.json().catch(() => ({})) as ApiErrorResponse;
        setError(data.error ?? "Incorrect password. Please try again.");
      }
    } catch {
      setError("Unable to reach server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-7 h-7 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white font-serif">Admin Panel</h1>
          <p className="text-slate-400 text-sm mt-2">Upstate Palmetto Property Services</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Admin password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
            autoFocus
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={loading || !input.trim()}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}

function SlotCard({
  slot,
  record,
  onSuccess,
}: {
  slot: (typeof SLOTS)[number];
  record?: ImageRecord;
  onSuccess: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiMutation(`/api/images/${slot.key}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images"] });
      toast({ title: "Image removed", description: `${slot.label} reset to default.` });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove image.", variant: "destructive" });
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const urlRes = await apiMutation("/api/storage/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });

      if (!urlRes.ok) throw new Error("Failed to get upload URL");
      const { uploadURL, objectPath } = await urlRes.json() as { uploadURL: string; objectPath: string };

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (ev) => {
          if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 90));
        });
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.status}`));
        });
        xhr.addEventListener("error", () => reject(new Error("Upload network error")));
        xhr.open("PUT", uploadURL);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      setProgress(95);

      const saveRes = await apiMutation(`/api/images/${slot.key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objectPath }),
      });

      if (!saveRes.ok) throw new Error("Failed to save image slot");

      setProgress(100);
      queryClient.invalidateQueries({ queryKey: ["images"] });
      toast({ title: "Image updated!", description: `${slot.label} has been replaced.` });
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      toast({ title: "Upload failed", description: message, variant: "destructive" });
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const imageSrc = record ? getCloudImageUrl(record.objectPath) : null;

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
      <div className="relative aspect-video bg-slate-900">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={slot.label}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full absolute inset-0 flex flex-col items-center justify-center text-slate-600 gap-2">
            <ImageIcon className="w-10 h-10" />
            <span className="text-sm">No image uploaded</span>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            <div className="w-48 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-white text-sm">{progress}%</span>
          </div>
        )}

        {record && !uploading && (
          <div className="absolute top-2 right-2">
            <div className="bg-green-500/20 border border-green-500/40 rounded-full px-2 py-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-400" />
              <span className="text-green-400 text-xs font-medium">Custom</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="text-white font-semibold text-lg">{slot.label}</h3>
        <p className="text-slate-400 text-sm mb-4">
          {record ? slot.description : `${slot.description} — using default`}
        </p>

        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="outline"
            className="flex-1 border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            {record ? "Replace" : "Upload"}
          </Button>

          {record && (
            <Button
              variant="outline"
              className="border-red-900/50 text-red-400 hover:bg-red-900/20 hover:text-red-300"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending || uploading}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const flag = sessionStorage.getItem("admin_logged_in");
    if (!flag) {
      setAuthenticated(false);
      return;
    }
    apiCall("/api/admin/ping")
      .then((res) => setAuthenticated(res.ok))
      .catch(() => setAuthenticated(false));
  }, []);

  const { data: images = [], isLoading } = useQuery<ImageRecord[]>({
    queryKey: ["images"],
    queryFn: async () => {
      const res = await apiCall("/api/images");
      if (!res.ok) throw new Error("Failed to load images");
      return res.json();
    },
    enabled: authenticated === true,
    staleTime: 0,
  });

  const imageMap = Object.fromEntries(images.map((img) => [img.slot, img]));

  const handleLogout = async () => {
    await apiMutation("/api/admin/logout", { method: "POST" }).catch(() => {});
    sessionStorage.removeItem("admin_logged_in");
    setAuthenticated(false);
    queryClient.clear();
    toast({ title: "Signed out" });
  };

  if (authenticated === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!authenticated) {
    return <LoginForm onLogin={() => setAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="border-b border-slate-700 bg-slate-800/60 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg font-serif">Image Manager</h1>
            <p className="text-slate-400 text-xs">Upstate Palmetto Property Services</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white hover:bg-slate-700"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold font-serif mb-2">Site Images</h2>
          <p className="text-slate-400">
            Upload photos to each category. Changes go live immediately — no redeploy needed.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : (
          <div className="space-y-12">
            {CATEGORIES.map((category) => (
              <div key={category.key}>
                <h2 className="text-xl font-bold font-serif mb-1">{category.label}</h2>
                <p className="text-slate-400 text-sm mb-6">
                  Upload up to 6 photos for the {category.label.toLowerCase()} gallery.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {category.slots.map((slot) => (
                    <SlotCard
                      key={slot.key}
                      slot={slot}
                      record={imageMap[slot.key]}
                      onSuccess={() => queryClient.invalidateQueries({ queryKey: ["images"] })}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
