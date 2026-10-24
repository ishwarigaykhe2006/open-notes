import { Link } from "@tanstack/react-router";
import { Download, FileText, User } from "lucide-react";
import { BookmarkButton } from "@/components/BookmarkButton";
import { StarDisplay } from "@/components/StarRating";
export function NoteCard({ note }) {
  return (
    <article className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          {note.subject}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <FileText className="h-3.5 w-3.5" />
          {note.pages} pages
        </span>
      </div>

      <h3 className="mb-2 text-base font-semibold leading-snug text-card-foreground">
        <Link
          to="/notes/$id"
          params={{ id: note.id }}
          className="transition-colors hover:text-primary"
        >
          {note.title}
        </Link>
      </h3>

      <p className="mb-3 line-clamp-2 flex-1 text-sm text-muted-foreground">{note.description}</p>

      <div className="mb-4 flex items-center justify-between">
        <StarDisplay rating={note.rating} count={note.ratingCount} />
        {note.semester && (
          <span className="text-xs text-muted-foreground">Sem {note.semester}</span>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <User className="h-3.5 w-3.5" />
          {note.uploader}
        </span>
        <span className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <Download className="h-3.5 w-3.5" />
            {note.downloads.toLocaleString()}
          </span>
          <BookmarkButton noteId={note.id} />
        </span>
      </div>
    </article>
  );
}
