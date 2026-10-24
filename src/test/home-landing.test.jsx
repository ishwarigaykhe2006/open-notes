import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "@/routeTree.gen";

describe("Home route landing dashboard", () => {
  it("renders the hero heading and stats strip without a logged-in user", async () => {
    // Clear any stored user to ensure visitor is logged out
    window.localStorage.clear();

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    const memoryHistory = createMemoryHistory({
      initialEntries: ["/"],
    });

    const router = createRouter({
      routeTree,
      history: memoryHistory,
      context: { queryClient },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    // Verify hero headline is rendered
    expect(
      await screen.findByRole("heading", {
        name: /study notes, shared openly/i,
        level: 1,
      }),
    ).toBeInTheDocument();

    // Verify hero subtitle
    expect(
      screen.getByText(/discover, download, and share peer-reviewed study notes/i),
    ).toBeInTheDocument();

    // Verify logged-out auth button
    expect(screen.getByRole("link", { name: /login \/ register/i })).toBeInTheDocument();

    // Verify logged-out visitor does not see "Welcome back"
    expect(screen.queryByText(/welcome back/i)).not.toBeInTheDocument();

    // Verify stats strip is rendered with 4 stat cards
    await waitFor(() => {
      expect(screen.getByText("Total Notes")).toBeInTheDocument();
      expect(screen.getByText("Total Downloads")).toBeInTheDocument();
      expect(screen.getByText("Subjects")).toBeInTheDocument();
      expect(screen.getByText("Contributors", { selector: "span" })).toBeInTheDocument();
    });

    // Verify trending now, top rated, recently added, and browse by subject sections
    expect(screen.getByRole("heading", { name: /trending now/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /top rated/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /recently added/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /browse by subject/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /popular tags/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /how opennotes works/i })).toBeInTheDocument();

    // Verify logged-out CTA banner is present
    expect(
      screen.getByRole("heading", {
        name: /join opennotes to upload, rate and bookmark notes/i,
      }),
    ).toBeInTheDocument();
  });

  it("renders welcome back message, upload button, and your activity card for logged-in users", async () => {
    // Set logged-in user in localStorage
    window.localStorage.clear();
    window.localStorage.setItem(
      "opennotes:user",
      JSON.stringify({ name: "Aarav Mehta", email: "aarav@example.com" }),
    );

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    const memoryHistory = createMemoryHistory({
      initialEntries: ["/"],
    });

    const router = createRouter({
      routeTree,
      history: memoryHistory,
      context: { queryClient },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    // Verify welcome back message appears after mount
    await waitFor(() => {
      expect(screen.getByText(/welcome back, aarav mehta/i)).toBeInTheDocument();
    });

    // Verify auth-aware button changes to Upload notes
    expect(screen.getAllByRole("link", { name: /upload notes/i }).length).toBeGreaterThanOrEqual(1);

    // Verify "Your activity" card is rendered
    await waitFor(() => {
      expect(screen.getByText(/your activity/i)).toBeInTheDocument();
    });

    // Verify logged-out CTA banner is NOT shown
    expect(
      screen.queryByRole("heading", {
        name: /join opennotes to upload, rate and bookmark notes/i,
      }),
    ).not.toBeInTheDocument();
  });
});
