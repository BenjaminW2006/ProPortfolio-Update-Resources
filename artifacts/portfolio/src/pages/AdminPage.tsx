import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
} from "lucide-react";

interface Project {
  id: number;
  name: string;
  date: string;
  location: string;
  description: string;
  category: "interior" | "exterior" | null;
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

function CreateProjectForm({
  onCreated,
  onCancel,
}: {
  onCreated: (project: Project) => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", date: "", location: "", description: "", category: "" as "" | "interior" | "exterior" });
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
            <Input
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              placeholder="e.g. March 2024"
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
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
            <label className="block text-slate-400 text-sm mb-1.5">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as "" | "interior" | "exterior" }))}
              className="w-full h-10 rounded-md border border-slate-600 bg-slate-700 text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— No category —</option>
              <option value="interior">Interior</option>
              <option value="exterior">Exterior</option>
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
  const [form, setForm] = useState({
    name: project.name,
    date: project.date,
    location: project.location,
    description: project.description,
    category: (project.category ?? "") as "" | "interior" | "exterior",
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
          <Input
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="bg-slate-700 border-slate-600 text-white"
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
          <label className="block text-slate-400 text-sm mb-1.5">Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as "" | "interior" | "exterior" }))}
            className="w-full h-10 rounded-md border border-slate-600 bg-slate-700 text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— No category —</option>
            <option value="interior">Interior</option>
            <option value="exterior">Exterior</option>
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
                  {project.date}
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

function ProjectListView({
  onSelectProject,
  onCreateNew,
}: {
  onSelectProject: (id: number) => void;
  onCreateNew: () => void;
}) {
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["admin-projects"],
    queryFn: async () => {
      const res = await apiCall("/api/projects");
      if (!res.ok) throw new Error("Failed to load projects");
      return res.json();
    },
    staleTime: 0,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-serif">Projects</h2>
        <Button
          className="bg-blue-600 hover:bg-blue-700"
          onClick={onCreateNew}
        >
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
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={onCreateNew}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => (
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
                    {project.date}
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
  );
}

type View =
  | { type: "list" }
  | { type: "create" }
  | { type: "manage"; projectId: number };

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

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="border-b border-slate-700 bg-slate-800/60 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg font-serif">Project Manager</h1>
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
      </main>
    </div>
  );
}
