import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { REPORT_REASONS, addReport } from "@/api/notes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
export function ReportButton({ targetType, targetId, className = "" }) {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState();
  const [busy, setBusy] = useState(false);
  const selectId = `report-reason-${targetType}-${targetId}`;
  const handleOpen = () => {
    if (!isAuthenticated) {
      toast.info("Please log in to report content.");
      return;
    }
    setReason("");
    setError(undefined);
    setOpen(true);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const picked = REPORT_REASONS.find((r) => r === reason);
    if (!picked) {
      setError("Please choose a reason.");
      return;
    }
    if (!user) return;
    setBusy(true);
    try {
      const { duplicate } = await addReport({
        targetType,
        targetId,
        reason: picked,
        reporterEmail: user.email,
      });
      if (duplicate) toast.info("You've already reported this. Thanks for your patience.");
      else toast.success("Report sent. Thanks for helping keep openNotes safe.");
      setOpen(false);
    } catch {
      toast.error("Couldn't send your report. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
        aria-label={`Report this ${targetType}`}
      >
        <Flag className="h-3.5 w-3.5" aria-hidden="true" />
        Report
      </button>

      <Dialog open={open} onOpenChange={(o) => !busy && setOpen(o)}>
        <DialogContent>
          <form onSubmit={handleSubmit} noValidate>
            <DialogHeader>
              <DialogTitle>Report this {targetType}</DialogTitle>
              <DialogDescription>
                Tell us what's wrong. Reports are reviewed by the openNotes maintainers.
              </DialogDescription>
            </DialogHeader>

            <div className="my-4">
              <label htmlFor={selectId} className="mb-1 block text-sm font-medium text-foreground">
                Reason
              </label>
              <select
                id={selectId}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setError(undefined);
                }}
                aria-invalid={!!error}
                aria-describedby={error ? `${selectId}-error` : undefined}
                className={`w-full rounded-lg border bg-card px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring ${error ? "border-destructive" : "border-input"}`}
              >
                <option value="">Select a reason…</option>
                {REPORT_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              {error && (
                <p id={`${selectId}-error`} role="alert" className="mt-1 text-xs text-destructive">
                  {error}
                </p>
              )}
            </div>

            <DialogFooter>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={busy}
                className="rounded-lg border border-input px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Send report
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
