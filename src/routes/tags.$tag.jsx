import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { fetchNotesByTag } from "@/api/notes";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { NoteCard } from "@/components/NoteCard";
export const Route = createFileRoute("/tags/$tag")({
  head: ({ params }) => ({
    meta: [
      { title: `#${params.tag} notes — openNotes` },
      { name: "description", content: `Study notes tagged #${params.tag} on openNotes.` },
      { property: "og:title", content: `#${params.tag} notes — openNotes` },
      { property: "og:type", content: "website" },
    ],
  }),
  component: TagPage,
});
function TagPage() {
  const { tag } = Route.useParams();
  const [notes, setNotes] = useState(null);
  useEffect(() => {
    let cancelled = false;
    setNotes(null);
    fetchNotesByTag(tag).then((n) => !cancelled && setNotes(n));
    return () => {
      cancelled = true;
    };
  }, [tag]);
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <Link
          to="/notes"
          className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to browse
        </Link>
        <h1 className="text-3xl font-bold text-foreground">#{tag}</h1>
        <p className="mt-2 text-muted-foreground">
          {notes === null
            ? "Loading…"
            : `${notes.length} ${notes.length === 1 ? "note" : "notes"} with this tag`}
        </p>

        {notes !== null && notes.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">
            No notes use this tag yet.{" "}
            <Link to="/notes" className="font-medium text-primary hover:underline">
              Browse all notes
            </Link>
          </p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {notes?.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
