import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, KeyRound, CheckCircle2 } from "lucide-react";

function getToken(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get("token") ?? "";
}

export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const token = getToken();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700 text-center space-y-4">
          <p className="text-red-400 text-sm">Invalid or missing reset token.</p>
          <Button
            variant="ghost"
            className="text-slate-400 hover:text-white"
            onClick={() => navigate("/manager")}
          >
            Back to login
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reset-password/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-protection": "1" },
        body: JSON.stringify({ token, password }),
        credentials: "include",
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Failed to reset password. The link may have expired.");
        return;
      }
      setDone(true);
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
            {done
              ? <CheckCircle2 className="w-7 h-7 text-green-400" />
              : <KeyRound className="w-7 h-7 text-blue-400" />
            }
          </div>
          <h1 className="text-2xl font-bold text-white font-serif">
            {done ? "Password updated!" : "Set new password"}
          </h1>
          {!done && (
            <p className="text-slate-400 text-sm mt-2">Choose a new admin password.</p>
          )}
        </div>

        {done ? (
          <div className="space-y-4 text-center">
            <p className="text-slate-300 text-sm">You can now sign in with your new password.</p>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate("/manager")}
            >
              Go to login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              autoFocus
            />
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading || !password || !confirm}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Set new password
            </Button>
            <div className="text-center">
              <button
                type="button"
                className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
                onClick={() => navigate("/manager")}
              >
                Back to login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
