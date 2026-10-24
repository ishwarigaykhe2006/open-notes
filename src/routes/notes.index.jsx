import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { fetchNotes } from "@/api/notes";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { NoteCard } from "@/components/NoteCard";
import { SearchBar } from "@/components/SearchBar";
const SORTS = ["newest", "downloads", "rating"];
// Every param is optional and invalid values are dropped rather than throwing,
// so a hand-edited or stale link still loads.
const searchSchema = z.object({
  q: z.string().optional().catch(undefined),
  subject: z.string().optional().catch(undefined),
  semester: z.coerce.number().int().min(1).max(8).optional().catch(undefined),
  tag: z.string().optional().catch(undefined),
  sort: z.enum(SORTS).optional().catch(undefined),
});
export const Route = createFileRoute("/notes/")({
  // Invalid values become undefined (not omitted) so they also override the raw URL value.
  validateSearch: (search) => {
    const parsed = searchSchema.parse(search);
    return { ...parsed, q: parsed.q?.trim() || undefined };
  },
  head: () => ({
    meta: [
      { title: "Browse Notes — openNotes" },
      {
        name: "description",
        content: "Search, filter and sort student-shared study notes across every subject.",
      },
      { property: "og:title", content: "Browse Notes — openNotes" },
      {
        property: "og:description",
        content: "Search, filter and sort student-shared study notes across every subject.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BrowsePage,
});
const selectClass =
  "rounded-xl border border-input bg-card px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";
function BrowsePage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/notes/" });
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const sort = search.sort ?? "newest";
  const subject = search.subject ?? "All";
  // Keep typing smooth: the input has local state and pushes to the URL after a short pause.
  const [query, setQuery] = useState(search.q ?? "");
  useEffect(() => setQuery(search.q ?? ""), [search.q]);
  useEffect(() => {
    if (query === (search.q ?? "")) return;
    const t = setTimeout(() => update({ q: query.trim() || undefined }), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);
  const update = (patch) => navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });
  useEffect(() => {
    fetchNotes().then((data) => {
      setNotes(data);
      setLoading(false);
    });
  }, []);
  const subjects = useMemo(() => ["All", ...new Set(notes.map((note) => note.subject))], [notes]);
  const allTags = useMemo(() => [...new Set(notes.flatMap((note) => note.tags))].sort(), [notes]);
  const visibleNotes = useMemo(() => {
    const q = (search.q ?? "").trim().toLowerCase();
    return notes
      .filter((note) => subject === "All" || note.subject === subject)
      .filter((note) => !search.semester || note.semester === search.semester)
      .filter((note) => !search.tag || note.tags.includes(search.tag))
      .filter(
        (note) =>
          q === "" ||
          note.title.toLowerCase().includes(q) ||
          note.description.toLowerCase().includes(q) ||
          note.tags.some((tag) => tag.toLowerCase().includes(q)),
      )
      .sort((a, b) => {
        if (sort === "downloads") return b.downloads - a.downloads;
        if (sort === "rating") {
          return (b.rating ?? 0) - (a.rating ?? 0) || (b.ratingCount ?? 0) - (a.ratingCount ?? 0);
        }
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [notes, search.q, search.semester, search.tag, subject, sort]);
  const hasFilters = Object.values(search).some((v) => v !== undefined);
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <h1 className="text-3xl font-bold text-foreground">Browse notes</h1>
        <p className="mt-2 text-muted-foreground">
          Find the notes you need — filter by subject, semester or tag, and sort by what matters.
        </p>

        {/* Controls */}
        <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1">
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder="Search by title, topic or tag..."
            />
          </div>
          <select
            value={search.semester ? String(search.semester) : ""}
            onChange={(e) =>
              update({ semester: e.target.value ? Number(e.target.value) : undefined })
            }
            className={selectClass}
            aria-label="Filter by semester"
          >
            <option value="">All semesters</option>
            {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                Semester {n}
              </option>
            ))}
          </select>
          <select
            value={search.tag ?? ""}
            onChange={(e) => update({ tag: e.target.value || undefined })}
            className={selectClass}
            aria-label="Filter by tag"
          >
            <option value="">All tags</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                #{t}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) =>
              update({ sort: e.target.value === "newest" ? undefined : e.target.value })
            }
            className={selectClass}
            aria-label="Sort notes"
          >
            <option value="newest">Newest first</option>
            <option value="downloads">Most downloaded</option>
            <option value="rating">Top rated</option>
          </select>
        </div>

        {/* Subject filter */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {subjects.map((s) => (
            <button
              key={s}
              onClick={() => update({ subject: s === "All" ? undefined : s })}
              aria-pressed={subject === s}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                subject === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              {s}
            </button>
          ))}
          {hasFilters && (
            <button
              onClick={() => navigate({ search: {}, replace: true })}
              className="ml-1 text-sm font-medium text-primary hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Grid */}
        <section className="mt-8" aria-live="polite">
          {loading ? (
            <p className="py-16 text-center text-muted-foreground">Loading notes…</p>
          ) : visibleNotes.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">
              No notes match your filters. Try a different keyword, subject or semester.
            </p>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                {visibleNotes.length} {visibleNotes.length === 1 ? "note" : "notes"}
              </p>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {visibleNotes.map((note) => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
