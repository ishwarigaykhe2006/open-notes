import { QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthProvider } from "../context/AuthContext";
import { BookmarksProvider } from "../context/BookmarksContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { NotFound } from "../components/NotFound";
import { Toaster } from "../components/ui/sonner";

function ErrorComponent({ error, reset }) {
  const router = useRouter();
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong. Try refreshing or head back home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-md bg-primary px-4 py-2 text-primary-foreground">Try again</button>
          <a href="/" className="rounded-md border border-input px-4 py-2">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext()({
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: ErrorComponent,
});

function ThemedToaster() {
  const { theme } = useTheme();
  return <Toaster richColors position="top-right" theme={theme} />;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BookmarksProvider>
            <Outlet />
            <ThemedToaster />
          </BookmarksProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
