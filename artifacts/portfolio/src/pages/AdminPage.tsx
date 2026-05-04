import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
        const data = (await res.json().catch(() => ({}))) as ApiErrorResponse;
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
          <h1 className="text-2xl font-bold text-white font-serif">Company Dashboard
</h1>
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
            <Input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Brief description of the work done"
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
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
}: {
  project: Project;
  onSaved: (p: Project) => void;
  onCancel: () => void;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
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
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          <Input
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="bg-slate-700 border-slate-600 text-white"
          />
        </div>
      </div>
      <div className="flex gap-3">
        <Button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700"
          disabled={saving || !form.name.trim() || !form.date.trim() || !form.location.trim()}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
          Save Changes
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
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  {progress}%
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5 mr-2" />
                  {project.coverObjectPath ? "Replace Cover" : "Upload Cover"}
                </>
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

function ProjectPhotoGrid({
  projectId,
  images,
  onDeleted,
}: {
  projectId: number;
  images: ProjectImage[];
  onDeleted: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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
      const res = await apiMutation(`/api/projects/${projectId}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objectPath }),
      });
      if (!res.ok) throw new Error("Failed to add photo");
      queryClient.invalidateQueries({ queryKey: ["admin-project", projectId] });
      toast({ title: "Photo added!" });
      onDeleted();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast({ title: "Upload failed", description: msg, variant: "destructive" });
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (imageId: number) => {
    setDeletingId(imageId);
    try {
      const res = await apiMutation(`/api/projects/${projectId}/images/${imageId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      queryClient.invalidateQueries({ queryKey: ["admin-project", projectId] });
      toast({ title: "Photo removed" });
      onDeleted();
    } catch {
      toast({ title: "Error", description: "Failed to remove photo.", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <h4 className="text-slate-300 font-medium mb-4">
        Gallery Photos
        {images.length > 0 && (
          <span className="ml-2 text-slate-500 font-normal text-sm">({images.length})</span>
        )}
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {images.map((img) => (
          <div key={img.id} className="group relative aspect-square rounded-xl overflow-hidden bg-slate-900">
            <img src={getImageUrl(img.objectPath)} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
            <button
              onClick={() => handleDelete(img.id)}
              disabled={deletingId === img.id}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
              aria-label="Delete photo"
            >
              {deletingId === img.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>
        ))}

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
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
      </div>
    </div>
  );
}

function ProjectManageView({
  projectId,
  onBack,
}: {
  projectId: number;
  onBack: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data: project, isLoading } = useQuery<ProjectDetail>({
    queryKey: ["admin-project", projectId],
    queryFn: async () => {
      const res = await apiCall(`/api/projects/${projectId}`);
      if (!res.ok) throw new Error("Failed to load project");
      return res.json();
    },
    staleTime: 0,
  });

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await apiMutation(`/api/projects/${projectId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      toast({ title: "Project deleted" });
      onBack();
    } catch {
      toast({ title: "Error", description: "Failed to delete project.", variant: "destructive" });
      setDeleting(false);
    }
  };

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-project", projectId] });
  };

  if (isLoading || !project) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            All Projects
          </button>
          {editing ? (
            <EditProjectForm
              project={project}
              onSaved={(p) => {
                queryClient.setQueryData(["admin-project", projectId], { ...project, ...p });
                setEditing(false);
              }}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <div>
              <h2 className="text-3xl font-bold font-serif text-white">{project.name}</h2>
              <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-slate-400 text-sm">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(project.date)}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {project.location}
                </span>
                {project.description && (
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    {project.description}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {!editing && (
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
              onClick={() => setEditing(true)}
            >
              <Pencil className="w-3.5 h-3.5 mr-2" />
              Edit
            </Button>
            {confirmDelete ? (
              <div className="flex items-center gap-2 bg-red-900/30 border border-red-800/50 rounded-lg px-3 py-1.5">
                <span className="text-red-300 text-sm">Delete project?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-red-400 hover:text-red-300 font-medium text-sm disabled:opacity-50"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="border-red-900/50 text-red-400 hover:bg-red-900/20 hover:text-red-300"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Delete
              </Button>
            )}
          </div>
        )}
      </div>

      <CoverUploadArea project={project} onUpdated={refresh} />

      <ProjectPhotoGrid
        projectId={project.id}
        images={project.images}
        onDeleted={refresh}
      />
    </div>
  );
}

interface ImageSlot {
  slot: string;
  objectPath: string;
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

function ProjectListView({
  onSelectProject,
  onCreateNew,
}: {
  onSelectProject: (id: number) => void;
  onCreateNew: () => void;
}) {
  const [search, setSearch] = useState("");
  const { galleries: galleryTiles = [] } = useSiteSettings();
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["admin-projects"],
    queryFn: async () => {
      const res = await apiCall("/api/projects");
      if (!res.ok) throw new Error("Failed to load projects");
      return res.json();
    },
    staleTime: 0,
  });

  const filtered = search.trim()
    ? projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : projects;

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-2xl font-bold font-serif mb-4">Gallery Tile Covers</h2>
        <p className="text-slate-400 text-sm mb-5">These images appear on the home page tiles. Configure galleries in Site Settings.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
          {galleryTiles.map((g) => (
            <TileCoverUpload key={g.key} slot={`tile-${g.key}`} label={g.label} />
          ))}
        </div>
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
    queryKey: ["site-settings"],
    queryFn: async () => {
      const res = await apiCall("/api/settings");
      if (!res.ok) return DEFAULT_SETTINGS;
      return res.json() as Promise<SiteSettings>;
    },
    staleTime: 0,
  });

  const [form, setForm] = useState<SiteSettings | null>(null);

  useEffect(() => {
    if (current && !form) setForm(current);
  }, [current, form]);

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
      queryClient.setQueryData(["site-settings"], updated);
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
      queryClient.setQueryData(["site-settings"], defaults);
      setConfirmReset(false);
      toast({ title: "Settings reset to defaults" });
    } catch {
      toast({ title: "Error", description: "Failed to reset settings.", variant: "destructive" });
    } finally {
      setResetting(false);
    }
  };

  const addGallery = () =>
    setForm((f) => f ? { ...f, galleries: [...f.galleries, { key: "", label: "", description: "" }] } : f);

  const removeGallery = (i: number) =>
    setForm((f) => f ? { ...f, galleries: f.galleries.filter((_, idx) => idx !== i) } : f);

  const moveGallery = (i: number, dir: -1 | 1) =>
    setForm((f) => {
      if (!f) return f;
      const g = [...f.galleries];
      const n = i + dir;
      if (n < 0 || n >= g.length) return f;
      [g[i], g[n]] = [g[n], g[i]];
      return { ...f, galleries: g };
    });

  const updateGallery = (i: number, key: "key" | "label" | "description", val: string) =>
    setForm((f) =>
      f ? { ...f, galleries: f.galleries.map((g, idx) => idx === i ? { ...g, [key]: val } : g) } : f
    );

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

  const addTestimonial = () =>
    setForm((f) => f ? { ...f, testimonials: [...(f.testimonials ?? []), { name: "", location: "", text: "" }] } : f);

  const removeTestimonial = (i: number) =>
    setForm((f) => f ? { ...f, testimonials: (f.testimonials ?? []).filter((_, idx) => idx !== i) } : f);

  const moveTestimonial = (i: number, dir: -1 | 1) =>
    setForm((f) => {
      if (!f) return f;
      const t = [...(f.testimonials ?? [])];
      const n = i + dir;
      if (n < 0 || n >= t.length) return f;
      [t[i], t[n]] = [t[n], t[i]];
      return { ...f, testimonials: t };
    });

  const updateTestimonial = (i: number, key: "name" | "location" | "text", val: string) =>
    setForm((f) =>
      f ? { ...f, testimonials: (f.testimonials ?? []).map((t, idx) => idx === i ? { ...t, [key]: val } : t) } : f
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
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold font-serif mb-1">Site Settings</h2>
        <p className="text-slate-400 text-sm">Changes update the live website immediately after saving.</p>
      </div>
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-4">
        <h3 className="text-base font-semibold font-serif text-slate-200">Company Info</h3>
        {field("Company Name", form.companyName, (v) => setForm((f) => f ? { ...f, companyName: v } : f))}
        {field("Phone", form.phone, (v) => setForm((f) => f ? { ...f, phone: v } : f), "(864) 555-0000")}
        {field("Email", form.email, (v) => setForm((f) => f ? { ...f, email: v } : f), "company@example.com")}
        {field("Service Area", form.serviceArea, (v) => setForm((f) => f ? { ...f, serviceArea: v } : f), "e.g. Austin, Texas")}
      </div>
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold font-serif text-slate-200">Hero Section</h3>
          <p className="text-slate-500 text-xs mt-0.5">The large headline and description shown on the home page banner.</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {field("Tagline line 1", form.tagline1, (v) => setForm((f) => f ? { ...f, tagline1: v } : f))}
          {field("Tagline line 2", form.tagline2, (v) => setForm((f) => f ? { ...f, tagline2: v } : f))}
          {field("Tagline line 3 (accent)", form.tagline3, (v) => setForm((f) => f ? { ...f, tagline3: v } : f))}
        </div>
        {textareaField("Hero description", form.heroSubtitle ?? "", (v) => setForm((f) => f ? { ...f, heroSubtitle: v } : f), "One or two sentences describing your business and value proposition.")}
      </div>
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold font-serif text-slate-200">About Section</h3>
          <p className="text-slate-500 text-xs mt-0.5">The "Why Choose Us" section on the home page.</p>
        </div>
        {field("Section heading", form.aboutTitle ?? "", (v) => setForm((f) => f ? { ...f, aboutTitle: v } : f), "e.g. A Team You Can Count On.")}
        {textareaField("Body paragraph", form.aboutText ?? "", (v) => setForm((f) => f ? { ...f, aboutText: v } : f), "Share why you started the business and what makes you different.")}
        {field("Pull quote (shown over image)", form.aboutQuote ?? "", (v) => setForm((f) => f ? { ...f, aboutQuote: v } : f), "e.g. Good work isn't just about how it looks — it's about how it lasts.")}
      </div>
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold font-serif text-slate-200">Colors</h3>
          <p className="text-slate-500 text-xs mt-0.5">Enter a hex color code (e.g. #2563eb). The swatch updates as you type.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {(["colorBg", "colorText", "colorAccent", "colorHeader"] as const).map((key) => {
            const labels: Record<typeof key, string> = {
              colorBg: "Page Background",
              colorText: "Text",
              colorAccent: "Accent",
              colorHeader: "Header / Nav",
            };
            return (
              <div key={key}>
                <label className="block text-slate-400 text-sm mb-1.5">{labels[key]}</label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-10 h-10 rounded-lg border border-slate-600 shrink-0"
                    style={{ backgroundColor: form[key] }}
                  />
                  <Input
                    value={form[key]}
                    onChange={(e) => setForm((f) => f ? { ...f, [key]: e.target.value } : f)}
                    placeholder="#000000"
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 font-mono text-sm"
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div
          className="rounded-lg px-4 py-3 text-sm flex items-center gap-3"
          style={{ backgroundColor: form.colorHeader, color: form.colorText, border: `2px solid ${form.colorAccent}` }}
        >
          <span style={{ color: form.colorAccent }}>●</span>
          <span>Live preview — this bar uses your chosen colors.</span>
        </div>
      </div>
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold font-serif text-slate-200">Galleries</h3>
            <p className="text-slate-500 text-xs mt-0.5">Each gallery is a tile on the home page with its own filtered project page.</p>
          </div>
          <Button type="button" size="sm" className="bg-blue-600 hover:bg-blue-700 shrink-0" onClick={addGallery}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add
          </Button>
        </div>
        <div className="space-y-3">
          {form.galleries.map((gallery, i) => (
            <div key={i} className="bg-slate-700/60 rounded-xl border border-slate-600 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-xs">#{i + 1}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveGallery(i, -1)}
                    disabled={i === 0}
                    className="px-1.5 py-0.5 text-slate-400 hover:text-white disabled:opacity-30 text-xs rounded hover:bg-slate-600 transition-colors"
                    aria-label="Move up"
                  >↑</button>
                  <button
                    type="button"
                    onClick={() => moveGallery(i, 1)}
                    disabled={i === form.galleries.length - 1}
                    className="px-1.5 py-0.5 text-slate-400 hover:text-white disabled:opacity-30 text-xs rounded hover:bg-slate-600 transition-colors"
                    aria-label="Move down"
                  >↓</button>
                  <button
                    type="button"
                    onClick={() => removeGallery(i)}
                    className="p-1 text-red-400 hover:text-red-300 transition-colors ml-1"
                    aria-label="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-xs mb-1">URL key (slug)</label>
                  <Input
                    value={gallery.key}
                    onChange={(e) => updateGallery(i, "key", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                    placeholder="e.g. interior"
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1">Display name</label>
                  <Input
                    value={gallery.label}
                    onChange={(e) => updateGallery(i, "label", e.target.value)}
                    placeholder="e.g. Interior"
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>
              <Input
                value={gallery.description}
                onChange={(e) => updateGallery(i, "description", e.target.value)}
                placeholder="Short description shown on the home page tile"
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
          ))}
          {form.galleries.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-6">No galleries yet. Add one above.</p>
          )}
        </div>
      </div>
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold font-serif text-slate-200">Services</h3>
            <p className="text-slate-500 text-xs mt-0.5">Shown on the home page services section.</p>
          </div>
          <Button type="button" size="sm" className="bg-blue-600 hover:bg-blue-700 shrink-0" onClick={addService}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add
          </Button>
        </div>
        {field("Section heading", form.servicesHeading ?? "", (v) => setForm((f) => f ? { ...f, servicesHeading: v } : f), "e.g. What We Offer")}
        {textareaField("Section subtitle", form.servicesSubtitle ?? "", (v) => setForm((f) => f ? { ...f, servicesSubtitle: v } : f), "A short sentence or two below the heading.")}

        <div className="space-y-3">
          {form.services.map((service, i) => (
            <div key={i} className="bg-slate-700/60 rounded-xl border border-slate-600 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-xs">#{i + 1}</span>
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
      </div>
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold font-serif text-slate-200">Testimonials</h3>
            <p className="text-slate-500 text-xs mt-0.5">Customer reviews shown on the home page. Replace placeholder text with real reviews.</p>
          </div>
          <Button type="button" size="sm" className="bg-blue-600 hover:bg-blue-700 shrink-0" onClick={addTestimonial}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add
          </Button>
        </div>
        <div className="space-y-3">
          {(form.testimonials ?? []).map((t, i) => (
            <div key={i} className="bg-slate-700/60 rounded-xl border border-slate-600 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-xs">#{i + 1}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveTestimonial(i, -1)}
                    disabled={i === 0}
                    className="px-1.5 py-0.5 text-slate-400 hover:text-white disabled:opacity-30 text-xs rounded hover:bg-slate-600 transition-colors"
                    aria-label="Move up"
                  >↑</button>
                  <button
                    type="button"
                    onClick={() => moveTestimonial(i, 1)}
                    disabled={i === (form.testimonials ?? []).length - 1}
                    className="px-1.5 py-0.5 text-slate-400 hover:text-white disabled:opacity-30 text-xs rounded hover:bg-slate-600 transition-colors"
                    aria-label="Move down"
                  >↓</button>
                  <button
                    type="button"
                    onClick={() => removeTestimonial(i)}
                    className="p-1 text-red-400 hover:text-red-300 transition-colors ml-1"
                    aria-label="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-xs mb-1">Name</label>
                  <Input
                    value={t.name}
                    onChange={(e) => updateTestimonial(i, "name", e.target.value)}
                    placeholder="Customer Name"
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1">Location</label>
                  <Input
                    value={t.location}
                    onChange={(e) => updateTestimonial(i, "location", e.target.value)}
                    placeholder="City, State"
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Review text</label>
                <textarea
                  value={t.text}
                  onChange={(e) => updateTestimonial(i, "text", e.target.value)}
                  placeholder="What did this customer say about your work?"
                  rows={3}
                  className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder:text-slate-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ))}
          {(form.testimonials ?? []).length === 0 && (
            <p className="text-slate-500 text-sm text-center py-6">No testimonials yet. Add one above.</p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 pb-4">
        <Button className="bg-blue-600 hover:bg-blue-700 px-8" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
          Save Settings
        </Button>
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
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [view, setView] = useState<View>({ type: "list" });
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
              <h1 className="font-bold text-lg font-serif leading-tight">Project Manager</h1>
              <p className="text-slate-400 text-xs">Upstate Palmetto Property Services</p>
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
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

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
