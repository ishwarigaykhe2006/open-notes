import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { readJSON, writeJSON } from "@/lib/storage";
import { useAuth } from "@/context/AuthContext";

const BookmarksContext = createContext(null);
const keyFor = (email) => `opennotes:bookmarks:${email}`;

export function BookmarksProvider({ children }) {
  const { user } = useAuth();
  const email = user?.email ?? null;
  const [bookmarkIds, setBookmarkIds] = useState(() => (email ? readJSON(keyFor(email), []) : []));

  useEffect(() => {
    if (!email) {
      setBookmarkIds([]);
      return;
    }

    // Initialize from local storage first for instant UI response
    const cached = readJSON(keyFor(email), []);
    setBookmarkIds(cached);

    // Sync with MongoDB backend
    fetch(`/api/bookmarks?email=${encodeURIComponent(email)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((serverBookmarks) => {
        if (Array.isArray(serverBookmarks) && serverBookmarks.length > 0) {
          const merged = Array.from(new Set([...cached, ...serverBookmarks]));
          setBookmarkIds(merged);
          writeJSON(keyFor(email), merged);
        }
      })
      .catch(() => {
        // Fallback to cached bookmarks if backend is unavailable
      });
  }, [email]);

  const isBookmarked = useCallback((id) => bookmarkIds.includes(id), [bookmarkIds]);

  const toggleBookmark = useCallback(
    (id) => {
      if (!email) return false;
      const adding = !bookmarkIds.includes(id);
      const next = adding ? [...bookmarkIds, id] : bookmarkIds.filter((b) => b !== id);
      setBookmarkIds(next);
      writeJSON(keyFor(email), next);

      // Persist to MongoDB backend in background
      fetch("/api/bookmarks/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, noteId: id }),
      }).catch((err) => {
        console.warn("[Bookmarks] Failed to sync bookmark with MongoDB:", err.message);
      });

      return adding;
    },
    [email, bookmarkIds]
  );

  const value = useMemo(
    () => ({ bookmarkIds, isBookmarked, toggleBookmark }),
    [bookmarkIds, isBookmarked, toggleBookmark]
  );

  return <BookmarksContext.Provider value={value}>{children}</BookmarksContext.Provider>;
}

export function useBookmarks() {
  const ctx = useContext(BookmarksContext);
  if (!ctx) throw new Error("useBookmarks must be used within a BookmarksProvider");
  return ctx;
}
