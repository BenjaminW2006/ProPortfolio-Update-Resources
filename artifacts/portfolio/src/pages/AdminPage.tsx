import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth, useClerk } from "@clerk/react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  Trash2,
  LogOut,
  ImageIcon,
  Loader2,
  Plus,
  ArrowLeft,
  Pencil,
  X,
  Check,
  MapPin,
  Calendar,
  FileText,
  Star,
  Settings,
  FolderOpen,
} from "lucide-react";
import { DEFAULT_SETTINGS, useSiteSettings, type SiteSettings } from "@/context/SiteSettingsContext";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function AutoTextarea({ value, onChange, placeholder, className }: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={1}
      className={`w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-slate-500 resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 ${className ?? ""}`}
    />
  );
}

interface Project {
  id: number;
  name: string;
  date: string;
  location: string;
  description: string;
  category: string | null;
  coverObjectPath: string | null;
  createdAt: string;
}

interface ProjectImage {
  id: number;
  objectPath: string;
  uploadedAt?: string;
  label?: "before" | "after" | null;
}

interface ProjectDetail extends Project {
  images: ProjectImage[];
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

function getImageUrl(objectPath: string): string {
  return `/api/storage${objectPath}`;
}

function formatDate(raw: string): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  }
  return raw;
}

function toDateInputValue(raw: string): string {
  if (!raw) return "";
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
  if (iso) return iso;
  const d = new Date(raw);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  return "";
}

async function uploadFile(
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  const urlRes = await apiMutation("/api/storage/uploads/request-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
  });
  if (!urlRes.ok) throw new Error("Failed to get upload URL");
  const { uploadURL, objectPath } = (await urlRes.json()) as {
    uploadURL: string;
    objectPath: string;
  };

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (ev) => {
      if (ev.lengthComputable) onProgress?.(Math.round((ev.loaded / ev.total) * 90));
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

  onProgress?.(100);
  return objectPath;
}

function CreateProjectForm({
  onCreated,
  onCancel,
}: {
  onCreated: (project: Project) => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { galleries = [] } = useSiteSettings();
  const [form, setForm] = useState({ name: "", date: "", location: "", description: "", category: "" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.date.trim() || !form.location.trim()) return;
    setSaving(true);
    try {
      const res = await apiMutation("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, category: form.category || null }),
      });
      if (!res.ok) throw new Error("Failed to create project");
      const project = (await res.json()) as Project;
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      toast({ title: "Project created!" });
      onCreated(project);
    } catch {
      toast({ title: "Error", description: "Failed to create project.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-white mb-5">New Project</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 text-sm mb-1.5">Project Name *</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Kitchen Remodel"
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1.5">Date *</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full h-10 rounded-md border border-slate-600 bg-slate-700 text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1.5">Location *</label>
            <Input
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="e.g. Greenville, SC"
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1.5">Gallery</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full h-10 rounded-md border border-slate-600 bg-slate-700 text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— No gallery —</option>
              {galleries.map((g) => (
                <option key={g.key} value={g.key}>{g.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1.5">Description</label>
            <AutoTextarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Brief description of the work done"
            />
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700"
            disabled={saving || !form.name.trim() || !form.date.trim() || !form.location.trim()}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
            Create Project
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="text-slate-400 hover:text-white hover:bg-slate-700"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

function EditProjectForm({
  project,
  onSaved,
  onCancel,
  onSavingChange,
}: {
  project: Project;
  onSaved: (p: Project) => void;
  onCancel: () => void;
  onSavingChange?: (saving: boolean) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { galleries = [] } = useSiteSettings();
  const [form, setForm] = useState({
    name: project.name,
    date: toDateInputValue(project.date),
    location: project.location,
    description: project.description,
    category: project.category ?? "",
  });
  const [saving, setSaving] = useState(false);

  const setSavingWithCallback = (val: boolean) => {
    setSaving(val);
    onSavingChange?.(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingWithCallback(true);
    try {
      const res = await apiMutation(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, category: form.category || null }),
      });
      if (!res.ok) throw new Error("Failed to update project");
      const updated = (await res.json()) as Project;
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      queryClient.invalidateQueries({ queryKey: ["admin-project", project.id] });
      toast({ title: "Project updated!" });
      onSaved(updated);
    } catch {
      toast({ title: "Error", description: "Failed to update project.", variant: "destructive" });
    } finally {
      setSavingWithCallback(false);
    }
  };

  return (
    <form id="edit-project-form" onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-slate-400 text-sm mb-1.5">Project Name *</label>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="bg-slate-700 border-slate-600 text-white"
          />
        </div>
        <div>
          <label className="block text-slate-400 text-sm mb-1.5">Date *</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="w-full h-10 rounded-md border border-slate-600 bg-slate-700 text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:dark]"
          />
        </div>
        <div>
          <label className="block text-slate-400 text-sm mb-1.5">Location *</label>
          <Input
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            className="bg-slate-700 border-slate-600 text-white"
          />
        </div>
        <div>
          <label className="block text-slate-400 text-sm mb-1.5">Gallery</label>
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="w-full h-10 rounded-md border border-slate-600 bg-slate-700 text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— No gallery —</option>
            {galleries.map((g) => (
              <option key={g.key} value={g.key}>{g.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-slate-400 text-sm mb-1.5">Description</label>
          <AutoTextarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>
      </div>
    </form>
  );
}

function CoverUploadArea({
  project,
  onUpdated,
}: {
  project: Project;
  onUpdated: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image.", variant: "destructive" });
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const objectPath = await uploadFile(file, setProgress);
      const res = await apiMutation(`/api/projects/${project.id}/cover`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objectPath }),
      });
      if (!res.ok) throw new Error("Failed to save cover");
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      queryClient.invalidateQueries({ queryKey: ["admin-project", project.id] });
      toast({ title: "Cover photo updated!" });
      onUpdated();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast({ title: "Upload failed", description: msg, variant: "destructive" });
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeCover = async () => {
    try {
      await apiMutation(`/api/projects/${project.id}/cover`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objectPath: null }),
      });
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      queryClient.invalidateQueries({ queryKey: ["admin-project", project.id] });
      toast({ title: "Cover photo removed" });
      onUpdated();
    } catch {
      toast({ title: "Error", description: "Failed to remove cover.", variant: "destructive" });
    }
  };

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        <div className="relative sm:w-48 aspect-video sm:aspect-auto bg-slate-900 shrink-0 min-h-32">
          {project.coverObjectPath ? (
            <img
              src={getImageUrl(project.coverObjectPath)}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-2">
              <Star className="w-8 h-8" />
              <span className="text-xs">No cover</span>
            </div>
          )}
        </div>
        <div className="p-5 flex flex-col justify-center gap-3 flex-1">
          <div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              <h4 className="text-white font-semibold">Cover Photo</h4>
            </div>
            <p className="text-slate-400 text-sm mt-1">Shown on the gallery grid card.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            <Button
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />{progress}%</>
              ) : (
                <><Upload className="w-3.5 h-3.5 mr-2" />{project.coverObjectPath ? "Replace" : "Upload"}</>
              )}
            </Button>
            {project.coverObjectPath && (
              <Button
                variant="outline"
                size="sm"
                className="border-red-900/50 text-red-400 hover:bg-red-900/20 hover:text-red-300"
                onClick={removeCover}
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ImageSlot {
  slot: string;
  objectPath: string;
}

function ProjectPhotoGrid({ projectId }: { projectId: number }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [settingLabel, setSettingLabel] = useState<number | null>(null);

  const { data: project } = useQuery<ProjectDetail>({
    queryKey: ["admin-project", projectId],
    queryFn: async () => {
      const res = await apiCall(`/api/projects/${projectId}`);
      if (!res.ok) throw new Error("Failed to load project");
      return res.json() as Promise<ProjectDetail>;
    },
    staleTime: 0,
  });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    setProgress(0);
    const totalFiles = files.length;
    let done = 0;
    try {
      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;
        const objectPath = await uploadFile(file, (pct) => {
          setProgress(Math.round(((done + pct / 100) / totalFiles) * 100));
        });
        await apiMutation(`/api/projects/${projectId}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ objectPath }),
        });
        done++;
        setProgress(Math.round((done / totalFiles) * 100));
      }
      queryClient.invalidateQueries({ queryKey: ["admin-project", projectId] });
      toast({ title: `${done} photo${done !== 1 ? "s" : ""} added!` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast({ title: "Upload failed", description: msg, variant: "destructive" });
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = async (imageId: number) => {
    try {
      await apiMutation(`/api/projects/${projectId}/images/${imageId}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: ["admin-project", projectId] });
      toast({ title: "Photo removed" });
    } catch {
      toast({ title: "Error", description: "Failed to remove photo.", variant: "destructive" });
    }
  };

  const setLabel = async (imageId: number, label: "before" | "after" | null) => {
    setSettingLabel(imageId);
    try {
      await apiMutation(`/api/projects/${projectId}/images/${imageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });
      queryClient.invalidateQueries({ queryKey: ["admin-project", projectId] });
    } catch {
      toast({ title: "Error", description: "Failed to set label.", variant: "destructive" });
    } finally {
      setSettingLabel(null);
    }
  };

  const labelOrder = (l?: "before" | "after" | null) =>
    l === "before" ? 0 : l === "after" ? 1 : 2;
  const images = [...(project?.images ?? [])].sort(
    (a, b) => labelOrder(a.label) - labelOrder(b.label)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-white font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            Photos
            {images.length > 0 && (
              <span className="text-slate-500 text-sm font-normal">({images.length})</span>
            )}
          </h4>
          <p className="text-slate-500 text-xs mt-0.5">Tag photos as Before or After for comparison views.</p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFile}
          />
          <Button
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />{progress}%</>
            ) : (
              <><Upload className="w-3.5 h-3.5 mr-2" />Add Photos</>
            )}
          </Button>
        </div>
      </div>

      {images.length === 0 ? (
        <div className="border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center py-12 text-slate-600 gap-3">
          <ImageIcon className="w-10 h-10" />
          <p className="text-sm text-slate-500">No photos yet. Add some above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img) => (
            <div key={img.id} className="relative group aspect-square bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
              <img
                src={getImageUrl(img.objectPath)}
                alt=""
                className="w-full h-full object-cover"
              />
              {img.label && (
                <span className={`absolute top-1.5 left-1.5 text-xs font-semibold px-1.5 py-0.5 rounded-md ${
                  img.label === "before" ? "bg-amber-500/90 text-white" : "bg-emerald-500/90 text-white"
                }`}>
                  {img.label === "before" ? "Before" : "After"}
                </span>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1">
                <div className="flex gap-1">
                  <button
                    onClick={() => setLabel(img.id, img.label === "before" ? null : "before")}
                    disabled={settingLabel === img.id}
                    className={`text-xs px-2 py-1 rounded-md font-medium transition-colors ${
                      img.label === "before"
                        ? "bg-amber-500 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-amber-500/80 hover:text-white"
                    }`}
                  >
                    Before
                  </button>
                  <button
                    onClick={() => setLabel(img.id, img.label === "after" ? null : "after")}
                    disabled={settingLabel === img.id}
                    className={`text-xs px-2 py-1 rounded-md font-medium transition-colors ${
                      img.label === "after"
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-emerald-500/80 hover:text-white"
                    }`}
                  >
                    After
                  </button>
                </div>
                <button
                  onClick={() => removeImage(img.id)}
                  className="text-xs px-2 py-1 rounded-md bg-red-900/80 text-red-300 hover:bg-red-800 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectManageView({ projectId, onBack }: { projectId: number; onBack: () => void }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: project, isLoading } = useQuery<ProjectDetail>({
    queryKey: ["admin-project", projectId],
    queryFn: async () => {
      const res = await apiCall(`/api/projects/${projectId}`);
      if (!res.ok) throw new Error("Failed to load project");
      return res.json() as Promise<ProjectDetail>;
    },
    staleTime: 0,
  });

  const { toast } = useToast();

  const handleDelete = async () => {
    if (!project) return;
    try {
      await apiMutation(`/api/projects/${project.id}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      toast({ title: "Project deleted" });
      onBack();
    } catch {
      toast({ title: "Error", description: "Failed to delete project.", variant: "destructive" });
    }
  };

  if (isLoading || !project) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          All Projects
        </button>
        <button
          onClick={handleDelete}
          className="text-red-500 hover:text-red-400 text-sm flex items-center gap-1.5 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Delete Project
        </button>
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold font-serif text-white">{project.name}</h2>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-slate-400 text-sm">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                {formatDate(project.date)}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                {project.location}
              </span>
            </div>
            {project.description && (
              <p className="text-slate-400 text-sm mt-2 max-w-lg">{project.description}</p>
            )}
          </div>
          {editing ? null : (
            <Button
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 shrink-0"
              onClick={() => setEditing(true)}
            >
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              Edit
            </Button>
          )}
        </div>
        {editing && (
          <>
            <EditProjectForm
              project={project}
              onSaved={(p) => {
                queryClient.setQueryData(["admin-project", projectId], (old: ProjectDetail | undefined) =>
                  old ? { ...old, ...p } : old
                );
                setEditing(false);
              }}
              onCancel={() => setEditing(false)}
              onSavingChange={setSaving}
            />
            <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
              <Button
                variant="ghost"
                className="text-slate-300 hover:text-white hover:bg-slate-700 shadow-lg shadow-black/40 px-5 h-11 rounded-full"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="edit-project-form"
                className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-black/40 px-6 h-11 rounded-full"
                disabled={saving}
              >
                {saving
                  ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  : <Check className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </>
        )}
      </div>

      <CoverUploadArea
        project={project}
        onUpdated={() => queryClient.invalidateQueries({ queryKey: ["admin-project", projectId] })}
      />

      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
        <ProjectPhotoGrid projectId={projectId} />
      </div>
    </div>
  );
}

function TileCoverUpload({ slot, label }: { slot: string; label: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const { data: images = [] } = useQuery<ImageSlot[]>({
    queryKey: ["tile-images"],
    queryFn: async () => {
      const res = await apiCall("/api/images");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 0,
  });

  const current = images.find((img) => img.slot === slot) ?? null;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image.", variant: "destructive" });
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const objectPath = await uploadFile(file, setProgress);
      const res = await apiMutation(`/api/images/${slot}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objectPath }),
      });
      if (!res.ok) throw new Error("Failed to save tile cover");
      queryClient.invalidateQueries({ queryKey: ["tile-images"] });
      toast({ title: `${label} tile cover updated!` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast({ title: "Upload failed", description: msg, variant: "destructive" });
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeCover = async () => {
    try {
      await apiMutation(`/api/images/${slot}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: ["tile-images"] });
      toast({ title: `${label} tile cover removed` });
    } catch {
      toast({ title: "Error", description: "Failed to remove cover.", variant: "destructive" });
    }
  };

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
      <div className="relative aspect-[4/3] bg-slate-900">
        {current ? (
          <img src={getImageUrl(current.objectPath)} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-2">
            <ImageIcon className="w-10 h-10" />
            <span className="text-xs">No cover set</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-white font-semibold font-serif mb-3">{label} Gallery Cover</p>
        <div className="flex gap-2 flex-wrap">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <Button
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />{progress}%</>
            ) : (
              <><Upload className="w-3.5 h-3.5 mr-2" />{current ? "Replace" : "Upload"}</>
            )}
          </Button>
          {current && (
            <Button
              variant="outline"
              size="sm"
              className="border-red-900/50 text-red-400 hover:bg-red-900/20 hover:text-red-300"
              onClick={removeCover}
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function LogoUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const { data: images = [] } = useQuery<ImageSlot[]>({
    queryKey: ["logo-image"],
    queryFn: async () => {
      const res = await apiCall("/api/images");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 0,
  });

  const current = images.find((img) => img.slot === "logo") ?? null;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Logo must be 10 MB or smaller.", variant: "destructive" });
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const objectPath = await uploadFile(file, setProgress);
      const res = await apiMutation("/api/images/logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objectPath }),
      });
      if (!res.ok) throw new Error("Failed to save logo");
      queryClient.invalidateQueries({ queryKey: ["logo-image"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast({ title: "Logo updated!" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast({ title: "Upload failed", description: msg, variant: "destructive" });
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeLogo = async () => {
    try {
      await apiMutation("/api/images/logo", { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: ["logo-image"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast({ title: "Logo removed" });
    } catch {
      toast({ title: "Error", description: "Failed to remove logo.", variant: "destructive" });
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-xl border border-slate-600 bg-slate-900 flex items-center justify-center overflow-hidden shrink-0">
        {current ? (
          <img src={getImageUrl(current.objectPath)} alt="Logo" className="w-full h-full object-contain p-1" />
        ) : (
          <ImageIcon className="w-7 h-7 text-slate-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-300 text-sm font-medium mb-1">{current ? "Logo uploaded" : "No logo uploaded"}</p>
        <p className="text-slate-500 text-xs mb-2">Appears in the navbar. PNG with a transparent background works best.</p>
        <div className="flex gap-2 flex-wrap">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <Button
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />{progress}%</>
            ) : (
              <><Upload className="w-3.5 h-3.5 mr-2" />{current ? "Replace" : "Upload"}</>
            )}
          </Button>
          {current && (
            <Button
              variant="outline"
              size="sm"
              className="border-red-900/50 text-red-400 hover:bg-red-900/20 hover:text-red-300"
              onClick={removeLogo}
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ProjectListView({
  onSelectProject,
  onCreateNew,
}: {
  onSelectProject: (id: number) => void;
  onCreateNew: () => void;
}) {
  const [search, setSearch] = useState("");
  const [newGalleryLabel, setNewGalleryLabel] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [savingGallery, setSavingGallery] = useState(false);
  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);
  const { galleries: galleryTiles = [] } = useSiteSettings();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["admin-projects"],
    queryFn: async () => {
      const res = await apiCall("/api/projects");
      if (!res.ok) throw new Error("Failed to load projects");
      return res.json();
    },
    staleTime: 0,
  });

  const patchGalleries = async (galleries: typeof galleryTiles) => {
    const res = await apiMutation("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ galleries }),
    });
    if (!res.ok) throw new Error("Failed to save");
    const updated = await res.json();
    queryClient.setQueryData(["site-settings"], updated);
  };

  const handleAddGallery = async () => {
    const label = newGalleryLabel.trim();
    if (!label) return;
    const key = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (galleryTiles.some((g) => g.key === key)) {
      toast({ title: "A gallery with that name already exists.", variant: "destructive" });
      return;
    }
    setSavingGallery(true);
    try {
      await patchGalleries([...galleryTiles, { key, label, description: "" }]);
      setNewGalleryLabel("");
      setShowAddForm(false);
      toast({ title: `"${label}" gallery added!` });
    } catch {
      toast({ title: "Error", description: "Failed to add gallery.", variant: "destructive" });
    } finally {
      setSavingGallery(false);
    }
  };

  const handleRemoveGallery = async (key: string) => {
    setSavingGallery(true);
    try {
      await patchGalleries(galleryTiles.filter((g) => g.key !== key));
      setConfirmDeleteKey(null);
      toast({ title: "Gallery removed." });
    } catch {
      toast({ title: "Error", description: "Failed to remove gallery.", variant: "destructive" });
    } finally {
      setSavingGallery(false);
    }
  };

  const filtered = search.trim()
    ? projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : projects;

  return (
    <div className="space-y-10">
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-2xl font-bold font-serif">Galleries</h2>
            <p className="text-slate-400 text-sm mt-0.5">Each gallery is a tile on the home page with its own project page.</p>
          </div>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 shrink-0"
            onClick={() => { setShowAddForm(true); setNewGalleryLabel(""); }}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Gallery
          </Button>
        </div>

        {showAddForm && (
          <div className="flex items-center gap-2 mb-4 max-w-sm">
            <Input
              value={newGalleryLabel}
              onChange={(e) => setNewGalleryLabel(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddGallery(); if (e.key === "Escape") setShowAddForm(false); }}
              placeholder="Gallery name (e.g. Kitchens)"
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
              autoFocus
            />
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 shrink-0" onClick={handleAddGallery} disabled={savingGallery || !newGalleryLabel.trim()}>
              {savingGallery ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </Button>
            <button type="button" onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {galleryTiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-600 gap-3 border-2 border-dashed border-slate-700 rounded-2xl max-w-xl">
            <p className="text-slate-500 text-sm">No galleries yet. Add one above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
            {galleryTiles.map((g) => (
              <div key={g.key} className="relative group">
                <TileCoverUpload slot={`tile-${g.key}`} label={g.label} />
                {confirmDeleteKey === g.key ? (
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-slate-900/90 border border-red-800/60 rounded-lg px-2.5 py-1.5 backdrop-blur-sm">
                    <span className="text-red-300 text-xs">Remove gallery?</span>
                    <button
                      onClick={() => handleRemoveGallery(g.key)}
                      disabled={savingGallery}
                      className="text-red-400 hover:text-red-300 text-xs font-medium disabled:opacity-50"
                    >
                      {savingGallery ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Yes"}
                    </button>
                    <button onClick={() => setConfirmDeleteKey(null)} className="text-slate-400 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteKey(g.key)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/70 text-slate-400 hover:text-red-400 hover:bg-slate-900/90 opacity-0 group-hover:opacity-100 transition-opacity"
                    title={`Remove "${g.label}" gallery`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold font-serif shrink-0">Projects</h2>
          <div className="flex items-center gap-3 flex-1 max-w-sm">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects…"
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 shrink-0" onClick={onCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-600 gap-4 border-2 border-dashed border-slate-700 rounded-2xl">
            <ImageIcon className="w-14 h-14" />
            <p className="text-lg text-slate-500">No projects yet</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-600 gap-3">
            <p className="text-slate-500">No projects match "{search}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((project) => (
              <div
                key={project.id}
                className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden hover:border-slate-500 transition-colors"
              >
                <div className="relative aspect-[4/3] bg-slate-900 overflow-hidden">
                  {project.coverObjectPath ? (
                    <img
                      src={getImageUrl(project.coverObjectPath)}
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-700">
                      <ImageIcon className="w-12 h-12" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-white font-semibold font-serif">{project.name}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-slate-400 text-sm">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      {formatDate(project.date)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {project.location}
                    </span>
                  </div>
                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                      onClick={() => onSelectProject(project.id)}
                    >
                      Manage
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const { data: current, isLoading } = useQuery<SiteSettings>({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const res = await apiCall("/api/admin/settings");
      if (!res.ok) return DEFAULT_SETTINGS;
      return res.json() as Promise<SiteSettings>;
    },
    staleTime: 0,
  });

  const [form, setForm] = useState<SiteSettings | null>(null);

  useEffect(() => {
    if (current && !form) setForm(current);
  }, [current, form]);

  // Apply color changes to CSS vars in real-time so the public site preview
  // and the mini color preview below update instantly without saving.
  useEffect(() => {
    if (!form) return;
    const root = document.documentElement;
    root.style.setProperty("--site-bg", form.colorBg);
    root.style.setProperty("--site-text", form.colorText);
    root.style.setProperty("--site-accent", form.colorAccent);
    root.style.setProperty("--site-header", form.colorHeader);
  }, [form?.colorBg, form?.colorText, form?.colorAccent, form?.colorHeader]);

  if (isLoading || !form) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiMutation("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save");
      const updated = (await res.json()) as SiteSettings;
      queryClient.setQueryData(["admin-settings"], updated);
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast({ title: "Settings saved!" });
    } catch {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      const res = await apiMutation("/api/settings/reset", { method: "POST" });
      if (!res.ok) throw new Error("Failed to reset");
      const defaults = (await res.json()) as SiteSettings;
      setForm(defaults);
      queryClient.setQueryData(["admin-settings"], defaults);
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      setConfirmReset(false);
      toast({ title: "Settings reset to defaults" });
    } catch {
      toast({ title: "Error", description: "Failed to reset settings.", variant: "destructive" });
    } finally {
      setResetting(false);
    }
  };

  const addService = () =>
    setForm((f) => f ? { ...f, services: [...f.services, { title: "", description: "" }] } : f);

  const removeService = (i: number) =>
    setForm((f) => f ? { ...f, services: f.services.filter((_, idx) => idx !== i) } : f);

  const moveService = (i: number, dir: -1 | 1) =>
    setForm((f) => {
      if (!f) return f;
      const s = [...f.services];
      const n = i + dir;
      if (n < 0 || n >= s.length) return f;
      [s[i], s[n]] = [s[n], s[i]];
      return { ...f, services: s };
    });

  const updateService = (i: number, field: "title" | "description", val: string) =>
    setForm((f) =>
      f ? { ...f, services: f.services.map((s, idx) => idx === i ? { ...s, [field]: val } : s) } : f
    );

  const field = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    placeholder?: string
  ) => (
    <div>
      <label className="block text-slate-400 text-sm mb-1.5">{label}</label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
      />
    </div>
  );

  const sectionToggle = (value: boolean, onChange: (v: boolean) => void) => (
    <button
      type="button"
      onClick={() => onChange(!value)}
      aria-label={value ? "Hide section" : "Show section"}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${
        value ? "bg-blue-600" : "bg-slate-600"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          value ? "translate-x-[18px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  );

  const textareaField = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    placeholder?: string,
    hint?: string
  ) => (
    <div>
      <label className="block text-slate-400 text-sm mb-1.5">{label}</label>
      {hint && <p className="text-slate-500 text-xs mb-1.5">{hint}</p>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder:text-slate-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-black/40 px-6 h-11 rounded-full"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
          Save Settings
        </Button>
      </div>
      <div>
        <h2 className="text-2xl font-bold font-serif mb-1">Company Information</h2>
        <p className="text-slate-400 text-sm">Changes update the live website immediately after saving.</p>
      </div>
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold font-serif text-slate-200">Logo</h3>
          <p className="text-slate-500 text-xs mt-0.5">Upload a logo to display in the navbar. PNG with a transparent background works best.</p>
        </div>
        <LogoUpload />
      </div>
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-4">
        <h3 className="text-base font-semibold font-serif text-slate-200">Company Info</h3>
        {field("Company Name", form.companyName, (v) => setForm((f) => f ? { ...f, companyName: v } : f))}
        <div>
          <label className="block text-slate-400 text-sm mb-1.5">Phone</label>
          <Input
            value={form.phone}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
              let formatted = digits;
              if (digits.length >= 7) {
                formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
              } else if (digits.length >= 4) {
                formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
              } else if (digits.length >= 1) {
                formatted = `(${digits}`;
              }
              setForm((f) => f ? { ...f, phone: formatted } : f);
            }}
            placeholder="(864) 555-0000"
            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
          />
        </div>
        {field("Email", form.email, (v) => setForm((f) => f ? { ...f, email: v } : f), "company@example.com")}
        {field("Service Area", form.serviceArea, (v) => setForm((f) => f ? { ...f, serviceArea: v } : f), "e.g. Austin, Texas")}
      </div>
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-5">
        <h3 className="text-base font-semibold font-serif text-slate-200">Brand Colors</h3>
        {(
          [
            { label: "Page Background", key: "colorBg" },
            { label: "Text", key: "colorText" },
            { label: "Accent / Buttons", key: "colorAccent" },
            { label: "Header / Navbar", key: "colorHeader" },
          ] as { label: string; key: "colorBg" | "colorText" | "colorAccent" | "colorHeader" }[]
        ).map(({ label, key }) => (
          <div key={key} className="flex items-center justify-between gap-4">
            <label className="text-slate-400 text-sm shrink-0">{label}</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form[key] ?? "#000000"}
                onChange={(e) => setForm((f) => f ? { ...f, [key]: e.target.value } : f)}
                className="w-9 h-9 rounded-lg border border-slate-600 bg-slate-700 cursor-pointer p-0.5"
              />
              <Input
                value={form[key] ?? ""}
                onChange={(e) => setForm((f) => f ? { ...f, [key]: e.target.value } : f)}
                placeholder="#000000"
                className="w-28 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 font-mono text-sm"
              />
            </div>
          </div>
        ))}

        {/* Live preview */}
        <div className="pt-2">
          <p className="text-slate-500 text-xs mb-2">Preview</p>
          <div className="rounded-xl overflow-hidden border border-slate-600 text-sm select-none">
            {/* Navbar */}
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{ backgroundColor: form.colorHeader }}
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded" style={{ backgroundColor: form.colorAccent }} />
                <span className="font-semibold text-xs" style={{ color: form.colorText }}>{form.companyName || "Your Business"}</span>
              </div>
              <div className="flex gap-3">
                {["Home", "Gallery", "Contact"].map((item) => (
                  <span key={item} className="text-xs opacity-70" style={{ color: form.colorText }}>{item}</span>
                ))}
              </div>
            </div>
            {/* Body */}
            <div className="px-5 py-5 space-y-3" style={{ backgroundColor: form.colorBg }}>
              <div className="space-y-1">
                <p className="font-bold text-base leading-tight" style={{ color: form.colorText }}>Quality Work.</p>
                <p className="text-xs opacity-60" style={{ color: form.colorText }}>Professional services tailored to your needs.</p>
              </div>
              <div className="flex gap-2 pt-1">
                <span
                  className="px-3 py-1.5 rounded-md text-xs font-semibold"
                  style={{ backgroundColor: form.colorAccent, color: "#ffffff" }}
                >
                  Get a Quote
                </span>
                <span
                  className="px-3 py-1.5 rounded-md text-xs font-semibold border"
                  style={{ borderColor: form.colorAccent, color: form.colorAccent }}
                >
                  View Work
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold font-serif text-slate-200">Hero Section</h3>
          {sectionToggle(form.showHero ?? true, (v) => setForm((f) => f ? { ...f, showHero: v } : f))}
        </div>
        {field("Tagline — Line 1", form.tagline1, (v) => setForm((f) => f ? { ...f, tagline1: v } : f), "Quality Work.")}
        {field("Tagline — Line 2", form.tagline2, (v) => setForm((f) => f ? { ...f, tagline2: v } : f), "Done Right.")}
        {field("Tagline — Line 3", form.tagline3, (v) => setForm((f) => f ? { ...f, tagline3: v } : f), "Every Time.")}
        {textareaField("Hero Subtitle", form.heroSubtitle, (v) => setForm((f) => f ? { ...f, heroSubtitle: v } : f))}
      </div>
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold font-serif text-slate-200">About Section</h3>
          {sectionToggle(form.showAbout ?? true, (v) => setForm((f) => f ? { ...f, showAbout: v } : f))}
        </div>
        {field("About Title", form.aboutTitle, (v) => setForm((f) => f ? { ...f, aboutTitle: v } : f))}
        {textareaField("About Text", form.aboutText, (v) => setForm((f) => f ? { ...f, aboutText: v } : f))}
      </div>
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-4">
        <h3 className="text-base font-semibold font-serif text-slate-200">Services Section</h3>
        {field("Section Heading", form.servicesHeading, (v) => setForm((f) => f ? { ...f, servicesHeading: v } : f))}
        {textareaField("Section Subtitle", form.servicesSubtitle, (v) => setForm((f) => f ? { ...f, servicesSubtitle: v } : f))}
      </div>
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold font-serif text-slate-200">Services</h3>
          <Button
            size="sm"
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
            onClick={addService}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Service
          </Button>
        </div>
        {form.services.map((service, i) => (
          <div key={i} className="bg-slate-700/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-medium">Service {i + 1}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveService(i, -1)}
                  disabled={i === 0}
                  className="px-1.5 py-0.5 text-slate-400 hover:text-white disabled:opacity-30 text-xs rounded hover:bg-slate-600 transition-colors"
                  aria-label="Move up"
                >↑</button>
                <button
                  type="button"
                  onClick={() => moveService(i, 1)}
                  disabled={i === form.services.length - 1}
                  className="px-1.5 py-0.5 text-slate-400 hover:text-white disabled:opacity-30 text-xs rounded hover:bg-slate-600 transition-colors"
                  aria-label="Move down"
                >↓</button>
                <button
                  type="button"
                  onClick={() => removeService(i)}
                  className="p-1 text-red-400 hover:text-red-300 transition-colors ml-1"
                  aria-label="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <Input
              value={service.title}
              onChange={(e) => updateService(i, "title", e.target.value)}
              placeholder="Service title"
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
            />
            <Input
              value={service.description}
              onChange={(e) => updateService(i, "description", e.target.value)}
              placeholder="Short description"
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
        ))}
        {form.services.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-6">No services yet. Add one above.</p>
        )}
      </div>
      <div className="flex items-center justify-between gap-4 pb-4">
        {confirmReset ? (
          <div className="flex items-center gap-2 bg-red-900/30 border border-red-800/50 rounded-lg px-3 py-2">
            <span className="text-red-300 text-sm">Reset all to defaults?</span>
            <button
              onClick={handleReset}
              disabled={resetting}
              className="text-red-400 hover:text-red-300 font-medium text-sm"
            >
              {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, reset"}
            </button>
            <button onClick={() => setConfirmReset(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Button
            variant="ghost"
            className="text-slate-400 hover:text-white hover:bg-slate-700"
            onClick={() => setConfirmReset(true)}
          >
            Reset to Defaults
          </Button>
        )}
      </div>
    </div>
  );
}

type View =
  | { type: "list" }
  | { type: "create" }
  | { type: "manage"; projectId: number }
  | { type: "settings" };

export default function AdminPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const [, setLocation] = useLocation();
  const [view, setView] = useState<View>({ type: "list" });
  const { companyName } = useSiteSettings();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      setLocation("/manager/sign-in");
    }
  }, [isLoaded, isSignedIn, setLocation]);

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  const activeTab = view.type === "settings" ? "settings" : "projects";

  const tabClass = (tab: string) =>
    `inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
      activeTab === tab
        ? "bg-white/10 text-white"
        : "text-slate-400 hover:text-white hover:bg-white/5"
    }`;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="border-b border-slate-700 bg-slate-800/60 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="font-bold text-lg font-serif leading-tight">{companyName}</h1>
              <p className="text-slate-400 text-xs">Company Manager</p>
            </div>
            <nav className="hidden sm:flex items-center gap-1">
              <button
                className={tabClass("projects")}
                onClick={() => setView({ type: "list" })}
              >
                <FolderOpen className="w-4 h-4" />
                Projects
              </button>
              <button
                className={tabClass("settings")}
                onClick={() => setView({ type: "settings" })}
              >
                <Settings className="w-4 h-4" />
                Site Settings
              </button>
            </nav>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white hover:bg-slate-700"
            onClick={() => signOut({ redirectUrl: basePath || "/" })}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Mobile tab bar */}
      <div className="sm:hidden flex border-b border-slate-700 bg-slate-800/60">
        <button
          className={`flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "projects"
              ? "text-white border-b-2 border-blue-500"
              : "text-slate-400 hover:text-white"
          }`}
          onClick={() => setView({ type: "list" })}
        >
          <FolderOpen className="w-4 h-4" />
          Projects
        </button>
        <button
          className={`flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "settings"
              ? "text-white border-b-2 border-blue-500"
              : "text-slate-400 hover:text-white"
          }`}
          onClick={() => setView({ type: "settings" })}
        >
          <Settings className="w-4 h-4" />
          Site Settings
        </button>
      </div>

      <main className="container mx-auto px-4 md:px-6 py-10">
        {view.type === "list" && (
          <ProjectListView
            onSelectProject={(id) => setView({ type: "manage", projectId: id })}
            onCreateNew={() => setView({ type: "create" })}
          />
        )}

        {view.type === "create" && (
          <div className="max-w-2xl">
            <button
              onClick={() => setView({ type: "list" })}
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              All Projects
            </button>
            <CreateProjectForm
              onCreated={(project) => setView({ type: "manage", projectId: project.id })}
              onCancel={() => setView({ type: "list" })}
            />
          </div>
        )}

        {view.type === "manage" && (
          <ProjectManageView
            projectId={view.projectId}
            onBack={() => setView({ type: "list" })}
          />
        )}

        {view.type === "settings" && <SettingsView />}
      </main>
    </div>
  );
}
