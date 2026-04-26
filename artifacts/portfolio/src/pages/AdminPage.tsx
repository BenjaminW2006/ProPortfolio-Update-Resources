import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, Trash2, LogOut, ImageIcon, Loader2, CheckCircle2, Plus, Star } from "lucide-react";

interface ImageRecord {
  slot: string;
  objectPath: string;
}

interface ApiErrorResponse {
  error?: string;
}

const CATEGORIES = [
  { key: "interior", label: "Interior" },
  { key: "exterior", label: "Exterior" },
] as const;

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

function UploadButton({
  slotKey,
  onSuccess,
  label,
  variant = "gallery",
}: {
  slotKey: string;
  onSuccess: () => void;
  label: string;
  variant?: "gallery" | "cover" | "add";
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

      const saveRes = await apiMutation(`/api/images/${slotKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objectPath }),
      });
      if (!saveRes.ok) throw new Error("Failed to save image slot");

      setProgress(100);
      queryClient.invalidateQueries({ queryKey: ["images"] });
      toast({ title: "Uploaded!", description: `${label} has been saved.` });
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

  if (variant === "add") {
    return (
      <>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="aspect-square rounded-2xl border-2 border-dashed border-slate-600 hover:border-blue-500 hover:bg-blue-500/5 transition-colors flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-blue-400 cursor-pointer disabled:opacity-50"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-7 h-7 animate-spin" />
              <span className="text-xs">{progress}%</span>
            </div>
          ) : (
            <>
              <Plus className="w-8 h-8" />
              <span className="text-xs font-medium">Add Photo</span>
            </>
          )}
        </button>
      </>
    );
  }

  return (
    <>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      <Button
        variant="outline"
        className="flex-1 border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {progress}%
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            {variant === "cover" ? "Upload Cover" : "Replace"}
          </>
        )}
      </Button>
    </>
  );
}

function CoverCard({
  categoryKey,
  categoryLabel,
  record,
}: {
  categoryKey: string;
  categoryLabel: string;
  record?: ImageRecord;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const slotKey = `${categoryKey}-cover`;

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiMutation(`/api/images/${slotKey}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images"] });
      toast({ title: "Cover removed" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove cover.", variant: "destructive" });
    },
  });

  const imageSrc = record ? getCloudImageUrl(record.objectPath) : null;

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden flex flex-col md:flex-row">
      <div className="relative md:w-56 aspect-video md:aspect-auto bg-slate-900 shrink-0">
        {imageSrc ? (
          <img src={imageSrc} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-2">
            <Star className="w-8 h-8" />
            <span className="text-xs">No cover set</span>
          </div>
        )}
        {record && (
          <div className="absolute top-2 right-2">
            <div className="bg-green-500/20 border border-green-500/40 rounded-full px-2 py-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-400" />
              <span className="text-green-400 text-xs font-medium">Set</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col justify-center gap-1">
        <div className="flex items-center gap-2 mb-1">
          <Star className="w-4 h-4 text-yellow-400" />
          <h3 className="text-white font-semibold">{categoryLabel} Cover Photo</h3>
        </div>
        <p className="text-slate-400 text-sm mb-4">
          Shown as the background of the tile on the home page.
        </p>
        <div className="flex gap-2">
          <UploadButton
            slotKey={slotKey}
            label={`${categoryLabel} cover`}
            onSuccess={() => {}}
            variant="cover"
          />
          {record && (
            <Button
              variant="outline"
              className="border-red-900/50 text-red-400 hover:bg-red-900/20 hover:text-red-300"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function GalleryImageCard({ record }: { record: ImageRecord }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiMutation(`/api/images/${record.slot}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images"] });
      toast({ title: "Photo removed" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove photo.", variant: "destructive" });
    },
  });

  return (
    <div className="group relative aspect-square rounded-xl overflow-hidden bg-slate-900">
      <img
        src={getCloudImageUrl(record.objectPath)}
        alt=""
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
      <button
        onClick={() => deleteMutation.mutate()}
        disabled={deleteMutation.isPending}
        className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
        aria-label="Delete photo"
      >
        {deleteMutation.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const flag = sessionStorage.getItem("admin_logged_in");
    if (!flag) { setAuthenticated(false); return; }
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

  if (!authenticated) return <LoginForm onLogin={() => setAuthenticated(true)} />;

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
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : (
          <div className="space-y-16">
            {CATEGORIES.map((category) => {
              const coverSlot = `${category.key}-cover`;
              const coverRecord = images.find((img) => img.slot === coverSlot);
              const galleryRecords = images
                .filter((img) => img.slot.startsWith(`${category.key}-`) && img.slot !== coverSlot)
                .sort((a, b) => a.slot.localeCompare(b.slot));

              return (
                <div key={category.key}>
                  <h2 className="text-2xl font-bold font-serif mb-6">{category.label}</h2>

                  <CoverCard
                    categoryKey={category.key}
                    categoryLabel={category.label}
                    record={coverRecord}
                  />

                  <div className="mt-8">
                    <h3 className="text-slate-300 font-medium mb-4">
                      Gallery Photos
                      {galleryRecords.length > 0 && (
                        <span className="ml-2 text-slate-500 font-normal text-sm">
                          ({galleryRecords.length})
                        </span>
                      )}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                      {galleryRecords.map((record) => (
                        <GalleryImageCard key={record.slot} record={record} />
                      ))}
                      <UploadButton
                        slotKey={`${category.key}-${Date.now()}`}
                        label="photo"
                        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["images"] })}
                        variant="add"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
