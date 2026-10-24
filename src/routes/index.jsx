import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  Atom,
  BookOpen,
  Calculator,
  Clock,
  Compass,
  Download,
  FileText,
  FlaskConical,
  GraduationCap,
  Leaf,
  PlusCircle,
  RefreshCw,
  Search,
  Share2,
  Sparkles,
  Star,
  Tag,
  TrendingUp,
  Upload,
  User,
  Users,
} from "lucide-react";
import {
  fetchFeaturedNotes,
  fetchNotesByUploader,
  fetchPopularTags,
  fetchRecentNotes,
  fetchStats,
  fetchSubjects,
  fetchTopRatedNotes,
} from "@/api/notes";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { NoteCard } from "@/components/NoteCard";
import { SearchBar } from "@/components/SearchBar";
import { useAuth } from "@/context/AuthContext";
import { useBookmarks } from "@/context/BookmarksContext";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Study notes, shared openly — openNotes" },
      {
        name: "description",
        content:
          "openNotes is an open source platform where students share and download study notes across every subject.",
      },
      { property: "og:title", content: "Study notes, shared openly — openNotes" },
      {
        property: "og:description",
        content:
          "openNotes is an open source platform where students share and download study notes across every subject.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingDashboardPage,
});

const SUBJECT_ICONS = {
  Mathematics: Calculator,
  Physics: Atom,
  Chemistry: FlaskConical,
  Biology: Leaf,
  Economics: TrendingUp,
  "Computer Science": BookOpen,
};

// Pure JS/CSS Count-Up animation respecting prefers-reduced-motion
function AnimatedCounter({ value, duration = 1200 }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const target = Number(value) || 0;
    if (typeof window === "undefined") {
      setDisplayValue(target);
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setDisplayValue(target);
      return;
    }

    let startTimestamp = null;
    let frameId;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(ease * target));

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(target);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  return <>{displayValue.toLocaleString()}</>;
}

export function LandingDashboardPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { bookmarkIds } = useBookmarks();

  // Avoid hydration mismatch: render logged-out layout first, then reveal auth state once mounted
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const isClientLoggedIn = mounted && isAuthenticated;

  const [query, setQuery] = useState("");
  const [stats, setStats] = useState(null);
  const [trending, setTrending] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [recent, setRecent] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [popularTags, setPopularTags] = useState([]);
  const [userUploadsCount, setUserUploadsCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, featuredData, topRatedData, recentData, subjectsData, tagsData] =
        await Promise.all([
          fetchStats(),
          fetchFeaturedNotes(),
          fetchTopRatedNotes(4),
          fetchRecentNotes(4),
          fetchSubjects(),
          fetchPopularTags(12),
        ]);
      setStats(statsData);
      setTrending(featuredData);
      setTopRated(topRatedData);
      setRecent(recentData);
      setSubjects(subjectsData);
      setPopularTags(tagsData);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setError("Unable to load study notes right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Listen for storage events (e.g. note uploaded/rated/deleted in another tab)
    const handleStorage = (e) => {
      if (e.key?.startsWith("opennotes:")) {
        loadData();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [loadData]);

  // Fetch logged in user activity count
  useEffect(() => {
    if (isClientLoggedIn && user?.name) {
      fetchNotesByUploader(user.name)
        .then((notes) => setUserUploadsCount(notes.length))
        .catch(() => {});
    } else {
      setUserUploadsCount(0);
    }
  }, [isClientLoggedIn, user?.name]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate({ to: "/notes", search: { q: query.trim() } });
    } else {
      navigate({ to: "/notes" });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Error State Banner */}
        {error && (
          <div className="mx-auto max-w-6xl px-4 pt-6">
            <div className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
              <button
                type="button"
                onClick={loadData}
                className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </button>
            </div>
          </div>
        )}

        {/* 1. HERO SECTION */}
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-secondary/40 via-background to-background px-4 py-16 md:py-24">
          <div className="mx-auto max-w-6xl">
            {isClientLoggedIn && (
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
                <GraduationCap className="h-3.5 w-3.5" />
                <span>Welcome back, {user?.name || "Student"} 👋</span>
              </div>
            )}

            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Study notes, shared openly
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Discover, download, and share peer-reviewed study notes across every university
              course. Free forever.
            </p>

            <form onSubmit={handleSearch} className="mt-8 max-w-2xl">
              <SearchBar
                value={query}
                onChange={setQuery}
                placeholder="Search notes by subject, semester, topic, or tag..."
                large
              />
            </form>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to="/notes"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow"
              >
                <Compass className="h-4 w-4" />
                Browse notes
              </Link>

              {isClientLoggedIn ? (
                <Link
                  to="/upload"
                  className="inline-flex items-center gap-2 rounded-xl border border-input bg-card px-5 py-3 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-accent hover:border-primary/50"
                >
                  <Upload className="h-4 w-4 text-primary" />
                  Upload notes
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-xl border border-input bg-card px-5 py-3 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-accent hover:border-primary/50"
                >
                  <User className="h-4 w-4 text-primary" />
                  Login / Register
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* 2. STATS STRIP */}
        <section className="border-b border-border bg-card/50 px-4 py-10" aria-label="Statistics">
          <div className="mx-auto max-w-6xl">
            {loading && !stats ? (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-28 animate-pulse rounded-2xl border border-border bg-card p-5"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className="rounded-2xl border border-border bg-card p-5 shadow-xs transition-shadow hover:shadow-md">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Total Notes
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                    <AnimatedCounter value={stats?.totalNotes ?? 0} />
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Across all subjects</p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 shadow-xs transition-shadow hover:shadow-md">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Total Downloads
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Download className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                    <AnimatedCounter value={stats?.totalDownloads ?? 0} />
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">By student learners</p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 shadow-xs transition-shadow hover:shadow-md">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs font-semibold uppercase tracking-wider">Subjects</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <BookOpen className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                    <AnimatedCounter value={stats?.totalSubjects ?? 0} />
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Academic categories</p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 shadow-xs transition-shadow hover:shadow-md">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Contributors
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Users className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                    <AnimatedCounter value={stats?.totalContributors ?? 0} />
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Active note creators</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 3. TRENDING NOW & TOP RATED */}
        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="space-y-16">
            {/* Trending Now (Most Downloaded) */}
            <div>
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <TrendingUp className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                      Trending now
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Most downloaded study notes by students
                    </p>
                  </div>
                </div>
                <Link
                  to="/notes"
                  search={{ sort: "downloads" }}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:underline"
                >
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {loading ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-56 animate-pulse rounded-xl border border-border bg-card"
                    />
                  ))}
                </div>
              ) : trending.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card/40 p-10 text-center text-muted-foreground">
                  <p className="text-sm">No trending notes available at the moment.</p>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {trending.map((note) => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </div>
              )}
            </div>

            {/* Top Rated */}
            <div>
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Star className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Top rated</h2>
                    <p className="text-sm text-muted-foreground">
                      Highest rated notes with student reviews
                    </p>
                  </div>
                </div>
                <Link
                  to="/notes"
                  search={{ sort: "rating" }}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:underline"
                >
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {loading ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-56 animate-pulse rounded-xl border border-border bg-card"
                    />
                  ))}
                </div>
              ) : topRated.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card/40 p-10 text-center text-muted-foreground">
                  <p className="text-sm">No rated notes available yet.</p>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {topRated.map((note) => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 4. RECENTLY ADDED */}
        <section className="border-t border-border bg-card/30 px-4 py-14">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Clock className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Recently added
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Fresh lecture notes and revisions from this week
                  </p>
                </div>
              </div>
              <Link
                to="/notes"
                search={{ sort: "newest" }}
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:underline"
              >
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-56 animate-pulse rounded-xl border border-border bg-card"
                  />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card/40 p-10 text-center text-muted-foreground">
                <p className="text-sm">No recent notes uploaded yet.</p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {recent.map((note) => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 5. BROWSE BY SUBJECT */}
        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Browse by subject
              </h2>
              <p className="text-sm text-muted-foreground">
                Organized academic resources across courses
              </p>
            </div>
            <Link
              to="/notes"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:underline"
            >
              View catalog <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading && subjects.length === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-xl border border-border bg-card"
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.map((subject) => {
                const Icon = SUBJECT_ICONS[subject.name] ?? BookOpen;
                return (
                  <Link
                    key={subject.name}
                    to="/notes"
                    search={{ subject: subject.name }}
                    className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-xs transition-all hover:border-primary/50 hover:shadow-md"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
                      <Icon className="h-6 w-6" />
                    </span>
                    <div>
                      <span className="block font-semibold text-card-foreground group-hover:text-primary transition-colors">
                        {subject.name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {subject.count} {subject.count === 1 ? "note" : "notes"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* 6. POPULAR TAGS */}
        <section className="border-t border-border bg-card/30 px-4 py-14">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Tag className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Popular tags
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Top searched course topics and exam modules
                  </p>
                </div>
              </div>
            </div>

            {loading && popularTags.length === 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-9 w-24 animate-pulse rounded-full border border-border bg-card"
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {popularTags.map((item) => (
                  <Link
                    key={item.tag}
                    to="/tags/$tag"
                    params={{ tag: item.tag }}
                    className="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-xs transition-all hover:border-primary/60 hover:bg-primary/5 hover:text-primary"
                  >
                    <span>#{item.tag}</span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground group-hover:text-primary">
                      {item.count}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 7. HOW IT WORKS */}
        <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              Easy three-step workflow
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              How openNotes works
            </h2>
            <p className="mt-3 text-muted-foreground">
              A collaborative study ecosystem built for students, by students.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Step 1 */}
            <div className="relative rounded-2xl border border-border bg-card p-7 shadow-xs transition-all hover:border-primary/50 hover:shadow-md">
              <div className="flex items-center justify-between mb-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Search className="h-6 w-6" />
                </span>
                <span className="text-3xl font-extrabold text-muted/50">01</span>
              </div>
              <h3 className="text-lg font-bold text-card-foreground">Search and filter</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Quickly locate exact study guides and lecture summaries filtered by course,
                semester, and topic tags.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-2xl border border-border bg-card p-7 shadow-xs transition-all hover:border-primary/50 hover:shadow-md">
              <div className="flex items-center justify-between mb-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Download className="h-6 w-6" />
                </span>
                <span className="text-3xl font-extrabold text-muted/50">02</span>
              </div>
              <h3 className="text-lg font-bold text-card-foreground">Download and rate</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Get full access to free PDF documents. Leave star ratings and helpful reviews to
                reward stellar contributors.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-2xl border border-border bg-card p-7 shadow-xs transition-all hover:border-primary/50 hover:shadow-md">
              <div className="flex items-center justify-between mb-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Share2 className="h-6 w-6" />
                </span>
                <span className="text-3xl font-extrabold text-muted/50">03</span>
              </div>
              <h3 className="text-lg font-bold text-card-foreground">Upload and share</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Upload your handwritten or typed study summaries to share knowledge and help fellow
                classmates excel.
              </p>
            </div>
          </div>
        </section>

        {/* 8. LOGGED-IN ACTIVITY CARD vs LOGGED-OUT CTA BANNER */}
        <section className="border-t border-border bg-gradient-to-b from-card/40 to-background px-4 py-14">
          <div className="mx-auto max-w-6xl">
            {isClientLoggedIn ? (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                      <User className="h-4 w-4" />
                      Your activity
                    </div>
                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                      Welcome, {user?.name || "Student"}!
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      You have uploaded{" "}
                      <span className="font-semibold text-foreground">
                        {userUploadsCount} {userUploadsCount === 1 ? "note" : "notes"}
                      </span>{" "}
                      and bookmarked{" "}
                      <span className="font-semibold text-foreground">
                        {bookmarkIds.length} {bookmarkIds.length === 1 ? "note" : "notes"}
                      </span>
                      .
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      to="/upload"
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary/90"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Upload notes
                    </Link>
                    <Link
                      to="/profile"
                      className="inline-flex items-center gap-2 rounded-xl border border-input bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-xs transition-all hover:bg-accent"
                    >
                      View profile
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-secondary/30 p-8 text-center md:p-14">
                <div className="mx-auto max-w-2xl">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
                    <BookOpen className="h-7 w-7" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                    Join openNotes to upload, rate and bookmark notes
                  </h2>
                  <p className="mt-3 text-base text-muted-foreground sm:text-lg">
                    Connect with fellow university students. Upload your coursework notes, build
                    your community reputation, and save your favorite study material.
                  </p>
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                    <Link
                      to="/login"
                      search={{ tab: "login" }}
                      className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/login"
                      search={{ tab: "register" }}
                      className="inline-flex items-center justify-center rounded-xl border border-input bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-accent hover:border-primary/50"
                    >
                      Register
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
