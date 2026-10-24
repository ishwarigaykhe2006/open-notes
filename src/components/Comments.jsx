import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, MessageSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  COMMENT_COOLDOWN_SECONDS,
  RateLimitError,
  addComment,
  deleteComment,
  fetchComments,
} from "@/api/notes";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ReportButton } from "@/components/ReportButton";
import { useAuth } from "@/context/AuthContext";
const MIN = 2;
const MAX = 500;
export function Comments({ noteId }) {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState(null);
  const [text, setText] = useState("");
  const [error, setError] = useState();
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0); // seconds until the user may post again
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);
  useEffect(() => {
    let cancelled = false;
    setComments(null);
    fetchComments(noteId).then((data) => {
      if (!cancelled) setComments(data);
    });
    return () => {
      cancelled = true;
    };
  }, [noteId]);
  const validate = (value) => {
    const len = value.trim().length;
    if (len < MIN) return `Comment must be at least ${MIN} characters.`;
    if (len > MAX) return `Comment must be ${MAX} characters or fewer.`;
    return undefined;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const problem = validate(text);
    setError(problem);
    if (problem || !user) return;
    setSubmitting(true);
    try {
      const created = await addComment(noteId, {
        author: user.name,
        authorEmail: user.email,
        text: text.trim(),
      });
      setComments((prev) => [created, ...(prev ?? [])]);
      setText("");
      setCooldown(COMMENT_COOLDOWN_SECONDS);
      toast.success("Comment posted");
    } catch (err) {
      if (err instanceof RateLimitError) {
        setCooldown(err.secondsLeft);
        setError(`You're commenting too fast. Please wait ${err.secondsLeft}s and try again.`);
      } else {
        toast.error("Couldn't post your comment. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };
  const handleDelete = async (id) => {
    if (!user) return;
    try {
      await deleteComment(id, user.email);
      setComments((prev) => (prev ?? []).filter((c) => c.id !== id));
      toast.success("Comment deleted");
    } catch (err) {
      toast.error("Couldn't delete that comment.");
      throw err;
    }
  };
  return (
    <section aria-labelledby="comments-heading" className="mt-8">
      <h2
        id="comments-heading"
        className="mb-4 flex items-center gap-2 text-xl font-semibold text-foreground"
      >
        <MessageSquare className="h-5 w-5 text-primary" />
        Comments{comments ? ` (${comments.length})` : ""}
      </h2>

      {isAuthenticated ? (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="mb-6 rounded-xl border border-border bg-card p-4"
        >
          <label htmlFor="comment" className="mb-1 block text-sm font-medium text-foreground">
            Add a comment
          </label>
          <textarea
            id="comment"
            rows={3}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (error) setError(validate(e.target.value));
            }}
            placeholder="Share feedback or say thanks…"
            aria-invalid={!!error}
            aria-describedby={error ? "comment-error" : undefined}
            className={`w-full rounded-lg border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring ${error ? "border-destructive" : "border-input"}`}
          />
          <div className="mt-1 flex items-start justify-between gap-4">
            <p id="comment-error" role="alert" className="text-xs text-destructive">
              {error}
            </p>
            <p className="shrink-0 text-xs text-muted-foreground">
              {text.length}/{MAX}
            </p>
          </div>
          <button
            type="submit"
            disabled={submitting || cooldown > 0}
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Posting…" : cooldown > 0 ? `Wait ${cooldown}s` : "Post comment"}
          </button>
        </form>
      ) : (
        <p className="mb-6 rounded-xl bg-secondary p-4 text-sm text-secondary-foreground">
          <Link to="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>{" "}
          to join the discussion.
        </p>
      )}

      {comments === null ? (
        <p className="text-sm text-muted-foreground">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {comments.map((c) => (
            <li key={c.id} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{c.author}</span>
                <time dateTime={c.createdAt}>
                  {new Date(c.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </time>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm text-card-foreground">
                {c.text}
              </p>
              <div className="mt-2 flex items-center justify-end gap-1">
                {user && c.authorEmail === user.email ? (
                  <ConfirmDialog
                    trigger={
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label="Delete your comment"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Delete
                      </button>
                    }
                    title="Delete this comment?"
                    description="This can't be undone."
                    onConfirm={() => handleDelete(c.id)}
                  />
                ) : (
                  <ReportButton targetType="comment" targetId={c.id} />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
