import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Calendar, Download, FileText, User } from "lucide-react";
import { fetchNoteById } from "@/api/notes";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Comments } from "@/components/Comments";
import { BookmarkButton } from "@/components/BookmarkButton";
import { RatingSection } from "@/components/RatingSection";
import { ReportButton } from "@/components/ReportButton";
export const Route = createFileRoute("/notes/$id")({
  head: () => ({
    meta: [
      { title: "Note Details — openNotes" },
      {
        name: "description",
        content: "View and download this student-shared study note on openNotes.",
      },
      { property: "og:title", content: "Note Details — openNotes" },
      {
        property: "og:description",
        content: "View and download this student-shared study note on openNotes.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NoteDetailPage,
});
function NoteDetailPage() {
  const { id } = Route.useParams();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloaded, setDownloaded] = useState(false);
  useEffect(() => {
    fetchNoteById(id).then((data) => {
      setNote(data);
      setLoading(false);
    });
  }, [id]);
  const handleDownload = () => {
    setDownloaded(true);
    try {
      window.open(`/api/notes/${id}/download`, "_blank");
      setNote((prev) => (prev ? { ...prev, downloads: (prev.downloads || 0) + 1 } : prev));
    } catch {
      // ignore
    }
    setTimeout(() => setDownloaded(false), 2500);
  };
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <Link
          to="/notes"
          className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to browse
        </Link>

        {loading ? (
          <p className="py-16 text-center text-muted-foreground">Loading note…</p>
        ) : !note ? (
          <p className="py-16 text-center text-muted-foreground">This note could not be found.</p>
        ) : (
          <article className="rounded-xl border border-border bg-card p-6 shadow-sm md:p-8">
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              {note.subject}
            </span>

            <h1 className="mt-4 text-2xl font-bold text-card-foreground md:text-3xl">
              {note.title}
            </h1>

            <p className="mt-4 leading-relaxed text-muted-foreground">{note.description}</p>

            {/* Tags */}
            <div className="mt-5 flex flex-wrap gap-2">
              {note.tags.map((tag) => (
                <Link
                  key={tag}
                  to="/tags/$tag"
                  params={{ tag }}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  #{tag}
                </Link>
              ))}
            </div>

            {/* Meta */}
            <aside className="mt-6 grid gap-3 rounded-lg bg-secondary/60 p-4 text-sm text-secondary-foreground sm:grid-cols-3">
              <span className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> {note.uploader}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> {note.createdAt}
              </span>
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> {note.pages} pages
              </span>
            </aside>

            <RatingSection
              noteId={note.id}
              rating={note.rating}
              ratingCount={note.ratingCount}
              onRated={(rating, ratingCount) =>
                setNote((n) => (n ? { ...n, rating, ratingCount } : n))
              }
            />

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={handleDownload}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
              >
                <Download className="h-5 w-5" />
                {downloaded
                  ? "Download started!"
                  : `Download (${note.downloads.toLocaleString()} downloads)`}
              </button>
              <BookmarkButton noteId={note.id} label />
              <ReportButton targetType="note" targetId={note.id} className="sm:ml-auto" />
            </div>
          </article>
        )}

        {note && <Comments noteId={note.id} />}
      </main>

      <Footer />
    </div>
  );
}
