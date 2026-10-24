import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { fetchMyRating, rateNote } from "@/api/notes";
import { StarDisplay, StarInput } from "@/components/StarRating";
import { useAuth } from "@/context/AuthContext";
export function RatingSection({ noteId, rating, ratingCount, onRated }) {
  const { user, isAuthenticated } = useAuth();
  const email = user?.email;
  const [mine, setMine] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!email) {
      setMine(null);
      return;
    }
    let cancelled = false;
    fetchMyRating(noteId, email).then((v) => !cancelled && setMine(v));
    return () => {
      cancelled = true;
    };
  }, [noteId, email]);
  const handleRate = async (value) => {
    if (!email) return;
    setSaving(true);
    try {
      const updated = await rateNote(noteId, email, value);
      setMine(value);
      onRated(updated?.rating, updated?.ratingCount);
      toast.success(mine ? "Rating updated" : "Thanks for rating!");
    } catch {
      toast.error("Couldn't save your rating. Please try again.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4">
      <div>
        <p className="text-sm font-medium text-foreground">Rating</p>
        <StarDisplay rating={rating} count={ratingCount} className="mt-1" />
      </div>
      {isAuthenticated ? (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {mine ? "Your rating" : "Rate this note"}
          </span>
          <StarInput value={mine} onChange={handleRate} disabled={saving} />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          <Link to="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>{" "}
          to rate this note.
        </p>
      )}
    </div>
  );
}
