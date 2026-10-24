import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

  it("matches a page for / instead of falling back to not found", () => {
    const matches = router.matchRoutes("/");
    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
    expect(matches.at(-1)?.routeId).toBe("/");
  });

  it("matches /login route", () => {
    const matches = router.matchRoutes("/login");
    expect(matches.at(-1)?.routeId).toBe("/login");
  });

  it("matches /profile route", () => {
    const matches = router.matchRoutes("/profile");
    expect(matches.at(-1)?.routeId).toBe("/profile");
  });

  it("matches /upload route", () => {
    const matches = router.matchRoutes("/upload");
    expect(matches.at(-1)?.routeId).toBe("/upload");
  });

  it("matches /notes route", () => {
    const matches = router.matchRoutes("/notes");
    expect(matches.at(-1)?.routeId).toBe("/notes/");
  });
});
