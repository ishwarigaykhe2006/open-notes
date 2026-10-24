import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/notes", label: "Browse Notes" },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  const handleMobileLogout = () => {
    logout();
    setMenuOpen(false);
    navigate({ to: "/login" });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-bold text-primary transition-opacity hover:opacity-90"
        >
          <BookOpen className="h-6 w-6" />
          openNotes
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                activeOptions={{ exact: link.to === "/" }}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                activeProps={{ className: "text-primary font-semibold" }}
              >
                {link.label}
              </Link>
            </li>
          ))}
          {isAuthenticated ? (
            <>
              <li>
                <Link
                  to="/profile"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                  activeProps={{ className: "text-primary font-semibold" }}
                >
                  Profile
                </Link>
              </li>
              <li>
                <Link
                  to="/upload"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Upload
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <li>
              <Link
                to="/login"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Sign In
              </Link>
            </li>
          )}
          <li>
            <ThemeToggle />
          </li>
        </ul>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          {/* Hamburger (mobile) */}
          <button
            className="rounded-md p-2 text-foreground"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <ul className="flex flex-col gap-1 border-t border-border px-4 py-3 md:hidden">
          {NAV_LINKS.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                activeOptions={{ exact: link.to === "/" }}
                onClick={() => setMenuOpen(false)}
                className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-primary"
                activeProps={{ className: "bg-accent text-primary font-semibold" }}
              >
                {link.label}
              </Link>
            </li>
          ))}
          {isAuthenticated ? (
            <>
              <li>
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-primary"
                  activeProps={{ className: "bg-accent text-primary font-semibold" }}
                >
                  Profile
                </Link>
              </li>
              <li>
                <Link
                  to="/upload"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-primary"
                  activeProps={{ className: "bg-accent text-primary font-semibold" }}
                >
                  Upload
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleMobileLogout}
                  className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-muted-foreground hover:bg-accent hover:text-primary"
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <li>
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-primary"
                activeProps={{ className: "bg-accent text-primary font-semibold" }}
              >
                Sign In
              </Link>
            </li>
          )}
        </ul>
      )}
    </header>
  );
}
