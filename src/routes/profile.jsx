import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bookmark, LogOut, Pencil, Trash2, Upload as UploadIcon, User } from "lucide-react";
import { toast } from "sonner";
import { deleteNote, fetchNotesByIds, fetchNotesByUploader, updateNote } from "@/api/notes";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { NoteForm } from "@/components/NoteForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { NoteCard } from "@/components/NoteCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useBookmarks } from "@/context/BookmarksContext";
export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile — openNotes" },
      { name: "description", content: "Manage the notes you've uploaded and bookmarked." },
      { property: "og:title", content: "Your Profile — openNotes" },
      { property: "og:description", content: "Manage the notes you've uploaded and bookmarked." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});
function NoteGrid({ notes, loading, empty, renderActions }) {
  if (loading || notes === null) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>;
  }
  if (notes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
        {empty}
      </div>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {notes.map((note) => (
        <div key={note.id} className="flex flex-col gap-2">
          <NoteCard note={note} />
          {renderActions?.(note)}
        </div>
      ))}
    </div>
  );
}
function OwnerActions({ note, email, onUpdated, onDeleted }) {
  const [editing, setEditing] = useState(false);
  const handleSave = async (values) => {
    try {
      const updated = await updateNote(note.id, email, values);
      onUpdated(updated);
      toast.success("Changes saved");
      setEditing(false);
    } catch (err) {
      toast.error("Couldn't save your changes. Please try again.");
      throw err;
    }
  };
  const handleDelete = async () => {
    try {
      await deleteNote(note.id, email);
      onDeleted(note.id);
      toast.success("Note deleted");
    } catch (err) {
      toast.error("Couldn't delete this note. Please try again.");
      throw err;
    }
  };
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-input px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        aria-label={`Edit ${note.title}`}
      >
        <Pencil className="h-4 w-4" aria-hidden="true" /> Edit
      </button>
      <ConfirmDialog
        trigger={
          <button
            type="button"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-input px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
            aria-label={`Delete ${note.title}`}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete
          </button>
        }
        title="Delete this note?"
        description={`“${note.title}” and its comments and ratings will be permanently removed.`}
        onConfirm={handleDelete}
      />

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit note</DialogTitle>
            <DialogDescription>Update the details, or replace the file.</DialogDescription>
          </DialogHeader>
          <NoteForm
            mode="edit"
            idPrefix="edit-"
            defaultValues={{
              title: note.title,
              subject: note.subject,
              semester: String(note.semester ?? ""),
              description: note.description,
              tags: note.tags.join(", "),
            }}
            existingFileHint={`Current file: ${note.pages} ${note.pages === 1 ? "page" : "pages"}.`}
            onSubmit={handleSave}
            onCancel={() => setEditing(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
function ProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isInitialized, logout } = useAuth();
  const { bookmarkIds } = useBookmarks();
  const [uploads, setUploads] = useState(null);
  const [bookmarks, setBookmarks] = useState(null);
  const name = user?.name;

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      navigate({ to: "/login", search: { redirect: "/profile" } });
    }
  }, [isInitialized, isAuthenticated, navigate]);

  useEffect(() => {
    if (!name) return;
    let cancelled = false;
    fetchNotesByUploader(name).then((n) => !cancelled && setUploads(n));
    return () => {
      cancelled = true;
    };
  }, [name]);
  const bookmarkKey = bookmarkIds.join(",");
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    fetchNotesByIds(bookmarkIds).then((n) => !cancelled && setBookmarks(n));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookmarkKey, isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  if (!isInitialized || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 flex items-center justify-center">
          <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
            <p className="mb-4 text-sm font-medium text-foreground">
              You need to be signed in to see your profile.
            </p>
            <Link
              to="/login"
              search={{ redirect: "/profile" }}
              className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Sign In
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <User className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg border border-input px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </header>

        <Tabs defaultValue="uploads">
          <TabsList className="mb-4 h-auto">
            <TabsTrigger value="uploads" className="gap-2 px-4 py-2">
              <UploadIcon className="h-4 w-4" /> My Uploads
              {uploads && <span className="text-xs text-muted-foreground">({uploads.length})</span>}
            </TabsTrigger>
            <TabsTrigger value="bookmarks" className="gap-2 px-4 py-2">
              <Bookmark className="h-4 w-4" /> Bookmarks
              {bookmarks && (
                <span className="text-xs text-muted-foreground">({bookmarks.length})</span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="uploads">
            <NoteGrid
              notes={uploads}
              loading={uploads === null}
              renderActions={(note) =>
                note.ownerEmail === user.email ? (
                  <OwnerActions
                    note={note}
                    email={user.email}
                    onUpdated={(updated) =>
                      setUploads((prev) =>
                        (prev ?? []).map((n) => (n.id === updated.id ? updated : n)),
                      )
                    }
                    onDeleted={(id) =>
                      setUploads((prev) => (prev ?? []).filter((n) => n.id !== id))
                    }
                  />
                ) : null
              }
              empty={
                <>
                  You haven't uploaded any notes yet.{" "}
                  <Link to="/upload" className="font-medium text-primary hover:underline">
                    Upload your first note
                  </Link>
                </>
              }
            />
          </TabsContent>
          <TabsContent value="bookmarks">
            <NoteGrid
              notes={bookmarks}
              loading={bookmarks === null}
              empty={
                <>
                  No bookmarks yet.{" "}
                  <Link to="/notes" className="font-medium text-primary hover:underline">
                    Browse notes
                  </Link>{" "}
                  and tap the bookmark icon to save them here.
                </>
              }
            />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
