import { Bookmark } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useBookmarks } from "@/context/BookmarksContext";
export function BookmarkButton({ noteId, label = false }) {
  const { isAuthenticated } = useAuth();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const saved = isBookmarked(noteId);
  const onClick = () => {
    if (!isAuthenticated) {
      toast.info("Log in to bookmark notes.");
      return;
    }
    toast.success(toggleBookmark(noteId) ? "Added to bookmarks" : "Removed from bookmarks");
  };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? "Remove bookmark" : "Bookmark this note"}
      className={`inline-flex items-center gap-2 rounded-md p-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-primary ${saved ? "text-primary" : "text-muted-foreground"} ${label ? "border border-input px-4 py-3" : ""}`}
    >
      <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
      {label && (saved ? "Bookmarked" : "Bookmark")}
    </button>
  );
}
