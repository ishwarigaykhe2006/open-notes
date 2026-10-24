// MongoDB-backed API layer for openNotes.
// Communicates with Express + Mongoose backend, with graceful fallback for tests/offline.
import { readJSON, writeJSON } from "@/lib/storage";

const FALLBACK_NOTES = [
  {
    id: "1",
    semester: 3,
    title: "Data Structures & Algorithms — Complete Notes",
    description:
      "Comprehensive notes covering arrays, linked lists, trees, graphs, sorting and searching algorithms with complexity analysis and solved examples.",
    subject: "Computer Science",
    tags: ["dsa", "algorithms", "trees", "graphs"],
    uploader: "Aarav Mehta",
    downloads: 1240,
    createdAt: "2026-09-28",
    pages: 86,
    rating: 4.6,
    ratingCount: 5,
  },
  {
    id: "2",
    semester: 4,
    title: "Organic Chemistry Reaction Mechanisms",
    description:
      "Step-by-step mechanisms for substitution, elimination, addition and rearrangement reactions, with arrow-pushing practice problems.",
    subject: "Chemistry",
    tags: ["organic", "reactions", "mechanisms"],
    uploader: "Priya Sharma",
    downloads: 980,
    createdAt: "2026-09-15",
    pages: 64,
    rating: 4.3,
    ratingCount: 3,
  },
  {
    id: "3",
    semester: 2,
    title: "Calculus II — Integration Techniques",
    description:
      "Integration by parts, partial fractions, trig substitution and improper integrals. Includes 50+ worked examples and exam tips.",
    subject: "Mathematics",
    tags: ["calculus", "integration", "exam-prep"],
    uploader: "Rohan Iyer",
    downloads: 1523,
    createdAt: "2026-10-01",
    pages: 72,
    rating: 4.8,
    ratingCount: 4,
  },
  {
    id: "4",
    semester: 3,
    title: "Thermodynamics & Heat Transfer Summary",
    description:
      "Laws of thermodynamics, entropy, heat engines and conduction/convection/radiation explained with diagrams and formula sheets.",
    subject: "Physics",
    tags: ["thermodynamics", "physics", "formula-sheet"],
    uploader: "Sneha Kulkarni",
    downloads: 764,
    createdAt: "2026-08-20",
    pages: 48,
    rating: 3.7,
    ratingCount: 3,
  },
  {
    id: "5",
    semester: 5,
    title: "Database Management Systems (DBMS)",
    description:
      "ER diagrams, normalization up to BCNF, SQL queries, transactions and indexing. Perfect for semester exams and interviews.",
    subject: "Computer Science",
    tags: ["dbms", "sql", "normalization"],
    uploader: "Arjun Nair",
    downloads: 1105,
    createdAt: "2026-09-05",
    pages: 91,
    rating: 4.5,
    ratingCount: 4,
  },
  {
    id: "6",
    semester: 3,
    title: "Microeconomics — Demand, Supply & Markets",
    description:
      "Clear notes on elasticity, consumer theory, market structures and game theory with graphs and real-world case studies.",
    subject: "Economics",
    tags: ["microeconomics", "markets", "case-studies"],
    uploader: "Ishita Rao",
    downloads: 432,
    createdAt: "2026-07-30",
    pages: 55,
    rating: 3.5,
    ratingCount: 2,
  },
  {
    id: "7",
    semester: 1,
    title: "Cell Biology & Genetics Illustrated Notes",
    description:
      "Cell structure, mitosis/meiosis, Mendelian genetics and DNA replication with hand-drawn style diagrams and mnemonics.",
    subject: "Biology",
    tags: ["biology", "genetics", "diagrams"],
    uploader: "Kabir Singh",
    downloads: 688,
    createdAt: "2026-09-22",
    pages: 79,
    rating: 4.3,
    ratingCount: 3,
  },
  {
    id: "8",
    semester: 2,
    title: "Linear Algebra — Matrices & Vector Spaces",
    description:
      "Matrix operations, determinants, eigenvalues, eigenvectors and vector spaces with proofs and numerical practice sets.",
    subject: "Mathematics",
    tags: ["linear-algebra", "matrices", "vectors"],
    uploader: "Ananya Desai",
    downloads: 915,
    createdAt: "2026-10-03",
    pages: 67,
    rating: 4.7,
    ratingCount: 3,
  },
];

const getBaseUrl = () => {
  if (
    typeof window !== "undefined" &&
    window.location &&
    window.location.origin &&
    !window.location.origin.startsWith("null")
  ) {
    return `${window.location.origin}/api`;
  }
  const host = typeof process !== "undefined" && process.env?.VITE_API_URL ? process.env.VITE_API_URL : "http://localhost:5000";
  return `${host}/api`;
};

export const API_BASE_URL = getBaseUrl();

export const SUBJECT_OPTIONS = [
  "Computer Science",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Economics",
  "Other",
];

export const COMMENT_COOLDOWN_SECONDS = 10;

export class RateLimitError extends Error {
  secondsLeft;
  constructor(secondsLeft) {
    super(`Please wait ${secondsLeft}s before posting again.`);
    this.name = "RateLimitError";
    this.secondsLeft = secondsLeft;
  }
}

export const REPORT_REASONS = [
  "Spam or advertising",
  "Copyrighted material",
  "Inappropriate content",
  "Incorrect or misleading",
  "Other",
];

const UPLOADS_KEY = "opennotes:uploads";
const storedUploads = () => readJSON(UPLOADS_KEY, []);

function getAllFallbackNotes() {
  return [...FALLBACK_NOTES, ...storedUploads()];
}

// Robust API Request with graceful fallback
async function apiRequest(endpoint, options = {}, fallbackFn = null) {
  const url = `${getBaseUrl()}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...options.headers,
      },
    });

    if (res.status === 429) {
      const data = await res.json().catch(() => ({}));
      throw new RateLimitError(data.secondsLeft || 10);
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(errorData.error || `Request failed with status ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    if (err instanceof RateLimitError) throw err;
    if (fallbackFn) {
      return fallbackFn();
    }
    throw err;
  }
}

// GET /api/notes
export async function fetchNotes() {
  return await apiRequest("/notes", {}, () => getAllFallbackNotes());
}

// GET /api/notes/:id
export async function fetchNoteById(id) {
  return await apiRequest(`/notes/${id}`, {}, () => {
    return getAllFallbackNotes().find((n) => n.id === id) || null;
  });
}

// GET /api/notes/featured
export async function fetchFeaturedNotes() {
  return await apiRequest("/notes/featured", {}, () => {
    return getAllFallbackNotes()
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, 4);
  });
}

// GET /api/stats
export async function fetchStats() {
  return await apiRequest("/stats", {}, () => {
    const notes = getAllFallbackNotes();
    return {
      totalNotes: notes.length,
      totalDownloads: notes.reduce((sum, n) => sum + (n.downloads || 0), 0),
      totalSubjects: new Set(notes.map((n) => n.subject)).size,
      totalContributors: new Set(notes.map((n) => n.uploader).filter(Boolean)).size,
      totalPages: notes.reduce((sum, n) => sum + (n.pages || 0), 0),
    };
  });
}

// GET /api/notes/top-rated
export async function fetchTopRatedNotes(limit = 4) {
  return await apiRequest(`/notes/top-rated?limit=${limit}`, {}, () => {
    return getAllFallbackNotes()
      .filter((n) => (n.ratingCount ?? 0) > 0 && n.rating != null)
      .sort((a, b) => b.rating - a.rating || (b.ratingCount ?? 0) - (a.ratingCount ?? 0))
      .slice(0, limit);
  });
}

// GET /api/notes/recent
export async function fetchRecentNotes(limit = 4) {
  return await apiRequest(`/notes/recent?limit=${limit}`, {}, () => {
    return getAllFallbackNotes()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  });
}

// GET /api/tags/popular
export async function fetchPopularTags(limit = 12) {
  return await apiRequest(`/tags/popular?limit=${limit}`, {}, () => {
    const notes = getAllFallbackNotes();
    const tagCounts = {};
    for (const note of notes) {
      for (const tag of note.tags ?? []) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }));
  });
}

// GET /api/subjects
export async function fetchSubjects() {
  return await apiRequest("/subjects", {}, () => {
    const notes = getAllFallbackNotes();
    const subjects = [...new Set(notes.map((note) => note.subject))];
    return subjects.map((name) => ({
      name,
      count: notes.filter((note) => note.subject === name).length,
    }));
  });
}

// POST /api/notes (multipart/form-data with file support)
export async function uploadNote(input) {
  const formData = new FormData();
  formData.append("title", input.title);
  formData.append("description", input.description || "");
  formData.append("subject", input.subject);
  formData.append("semester", String(input.semester || 1));
  formData.append("uploader", input.uploader || "Anonymous");
  formData.append("ownerEmail", input.ownerEmail || "");

  if (Array.isArray(input.tags)) {
    formData.append("tags", JSON.stringify(input.tags));
  } else if (typeof input.tags === "string") {
    formData.append("tags", input.tags);
  }

  if (input.file) {
    formData.append("file", input.file);
  }

  try {
    return await apiRequest("/notes", {
      method: "POST",
      body: formData,
    });
  } catch (err) {
    // Local fallback persistence
    const id = `u-${Date.now()}`;
    const note = {
      id,
      title: input.title,
      description: input.description,
      subject: input.subject,
      tags: input.tags,
      uploader: input.uploader,
      semester: input.semester,
      ownerEmail: input.ownerEmail,
      downloads: 0,
      createdAt: new Date().toISOString().slice(0, 10),
      pages: input.file ? Math.max(1, Math.ceil(input.file.size / 50_000)) : 1,
    };
    writeJSON(UPLOADS_KEY, [...storedUploads(), note]);
    return { id };
  }
}

// GET /api/notes?uploader=...
export async function fetchNotesByUploader(uploader) {
  return await apiRequest(`/notes?uploader=${encodeURIComponent(uploader)}`, {}, () => {
    return getAllFallbackNotes().filter((n) => n.uploader === uploader || n.ownerEmail === uploader);
  });
}

// GET /api/notes/by-ids?ids=...
export async function fetchNotesByIds(ids) {
  if (!ids || ids.length === 0) return [];
  return await apiRequest(`/notes/by-ids?ids=${ids.join(",")}`, {}, () => {
    const notes = getAllFallbackNotes();
    return ids.map((id) => notes.find((n) => n.id === id)).filter(Boolean);
  });
}

// GET /api/notes/:id/comments
export async function fetchComments(noteId) {
  return await apiRequest(`/notes/${noteId}/comments`, {}, () => {
    return readJSON(`opennotes:comments:${noteId}`, []);
  });
}

// POST /api/notes/:id/comments
export async function addComment(noteId, input) {
  return await apiRequest(
    `/notes/${noteId}/comments`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    () => {
      const key = `opennotes:comments:${noteId}`;
      const existing = readJSON(key, []);
      const newComment = {
        id: `c-${Date.now()}`,
        noteId,
        author: input.author,
        authorEmail: input.authorEmail,
        text: input.text,
        createdAt: new Date().toISOString(),
      };
      writeJSON(key, [newComment, ...existing]);
      return newComment;
    }
  );
}

// DELETE /api/comments/:id
export async function deleteComment(commentId, email) {
  return await apiRequest(`/comments/${commentId}`, {
    method: "DELETE",
    body: JSON.stringify({ email }),
  });
}

// PUT /api/notes/:id
export async function updateNote(id, email, input) {
  const formData = new FormData();
  formData.append("email", email);
  if (input.title) formData.append("title", input.title);
  if (input.description !== undefined) formData.append("description", input.description);
  if (input.subject) formData.append("subject", input.subject);
  if (input.semester) formData.append("semester", String(input.semester));
  if (input.tags) formData.append("tags", JSON.stringify(input.tags));
  if (input.file) formData.append("file", input.file);

  return await apiRequest(`/notes/${id}`, {
    method: "PUT",
    body: formData,
  });
}

// DELETE /api/notes/:id
export async function deleteNote(id, email) {
  return await apiRequest(`/notes/${id}`, {
    method: "DELETE",
    body: JSON.stringify({ email }),
  });
}

// POST /api/reports
export async function addReport(input) {
  return await apiRequest("/reports", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// GET /api/notes?tag=...
export async function fetchNotesByTag(tag) {
  return await apiRequest(`/notes?tag=${encodeURIComponent(tag)}`, {}, () => {
    const t = tag.toLowerCase();
    return getAllFallbackNotes().filter((n) => n.tags.some((x) => x.toLowerCase() === t));
  });
}

// GET /api/notes/:id/rating?email=...
export async function fetchMyRating(noteId, email) {
  if (!email) return null;
  const res = await apiRequest(`/notes/${noteId}/rating?email=${encodeURIComponent(email)}`, {}, () => {
    return { value: null };
  });
  return res.value;
}

// POST /api/notes/:id/rate
export async function rateNote(noteId, email, value) {
  return await apiRequest(
    `/notes/${noteId}/rate`,
    {
      method: "POST",
      body: JSON.stringify({ email, value }),
    },
    () => {
      return getAllFallbackNotes().find((n) => n.id === noteId) || null;
    }
  );
}
