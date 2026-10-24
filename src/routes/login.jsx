import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { z } from "zod";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";

const searchSchema = z.object({
  redirect: z.string().optional().catch(undefined),
  tab: z.enum(["login", "register"]).optional().catch(undefined),
});

export const Route = createFileRoute("/login")({
  validateSearch: (search) => {
    return searchSchema.parse(search);
  },
  head: () => ({
    meta: [
      { title: "Login or Register — openNotes" },
      {
        name: "description",
        content: "Sign in to openNotes or create a free account to share your study notes.",
      },
      { property: "og:title", content: "Login or Register — openNotes" },
      {
        property: "og:description",
        content: "Sign in to openNotes or create a free account to share your study notes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { user, isAuthenticated, isInitialized, login, register } = useAuth();
  const [tab, setTab] = useState(search.tab || "login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (search.tab) {
      setTab(search.tab);
    }
  }, [search.tab]);

  // If already authenticated, redirect to the dashboard or destination
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      const destination = search.redirect || "/";
      navigate({ to: destination });
    }
  }, [isInitialized, isAuthenticated, navigate, search.redirect]);

  const validate = () => {
    const next = {};
    if (tab === "register" && name.trim().length < 2) {
      next.name = "Please enter your name.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = "Please enter a valid email address.";
    }
    if (password.length < 6) {
      next.password = "Password must be at least 6 characters.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");
    if (!validate()) return;
    setLoading(true);
    try {
      if (tab === "register") {
        await register({
          name: name.trim(),
          email: email.trim(),
          password,
        });
      } else {
        await login({
          email: email.trim(),
          password,
        });
      }
      setSuccess(true);
      const destination = search.redirect || "/";
      setTimeout(() => {
        navigate({ to: destination });
      }, 700);
    } catch (err) {
      setGeneralError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (hasError) =>
    `w-full rounded-lg border bg-card px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-ring ${
      hasError ? "border-destructive" : "border-input"
    }`;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg">
          <div className="mb-6 flex flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpen className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">openNotes</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {tab === "login"
                ? "Sign in to access your study dashboard"
                : "Create an account to share and access study notes"}
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-6 grid grid-cols-2 rounded-lg bg-secondary p-1" role="tablist">
            {["login", "register"].map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => {
                  setTab(t);
                  setErrors({});
                  setSuccess(false);
                }}
                className={`rounded-md py-2 text-sm font-medium capitalize transition-all ${
                  tab === t
                    ? "bg-card text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {success ? (
            <div className="rounded-lg bg-primary/10 border border-primary/20 p-5 text-center text-sm font-medium text-primary">
              <p className="font-semibold text-base mb-1">
                {tab === "login" ? "Welcome back!" : "Account created!"}
              </p>
              <p className="text-muted-foreground text-xs">Redirecting to dashboard…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              {generalError && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive font-medium">
                  {generalError}
                </div>
              )}
              {tab === "register" && (
                <div>
                  <label htmlFor="name" className="mb-1 block text-sm font-medium text-foreground">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass(errors.name)}
                    placeholder="e.g. Alex Rivera"
                  />
                  {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
                </div>
              )}

              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-foreground">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass(errors.email)}
                  placeholder="student@university.edu"
                />
                {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1 block text-sm font-medium text-foreground"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass(errors.password)}
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-destructive">{errors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-3 w-full rounded-lg bg-primary py-2.5 font-medium text-primary-foreground transition-all hover:bg-primary/90 shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading
                  ? tab === "login"
                    ? "Signing In…"
                    : "Creating Account…"
                  : tab === "login"
                  ? "Sign In to Dashboard"
                  : "Create Account & Continue"}
              </button>
            </form>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
