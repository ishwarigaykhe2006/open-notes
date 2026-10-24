import { BookOpen, Github } from "lucide-react";
export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-10 md:flex-row md:justify-between">
        <div className="flex items-center gap-2 font-bold text-primary">
          <BookOpen className="h-5 w-5" />
          openNotes
        </div>
        <p className="text-sm text-muted-foreground">
          Open source notes sharing for students, by students.
        </p>
        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <Github className="h-4 w-4" />
          Contribute on GitHub
        </a>
      </div>
    </footer>
  );
}
