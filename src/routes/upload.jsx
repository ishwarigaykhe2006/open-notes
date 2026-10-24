import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Upload as UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { NoteForm } from "@/components/NoteForm";
import { uploadNote } from "@/api/notes";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload Notes — openNotes" },
      { name: "description", content: "Share your study notes with students everywhere." },
      { property: "og:title", content: "Upload Notes — openNotes" },
      { property: "og:description", content: "Share your study notes with students everywhere." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UploadPage,
});

function UploadPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isInitialized, user } = useAuth();

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      navigate({ to: "/login", search: { redirect: "/upload" } });
    }
  }, [isInitialized, isAuthenticated, navigate]);

  const handleSubmit = async (values) => {
    try {
      await uploadNote({
        ...values,
        file: values.file, // required in create mode (validated by the form)
        uploader: user?.name ?? "Anonymous",
        ownerEmail: user?.email,
      });
      toast.success("Notes uploaded!", {
        description: `“${values.title}” is now shared with the community.`,
      });
      navigate({ to: "/" });
    } catch (err) {
      toast.error("Upload failed", { description: "Something went wrong. Please try again." });
      throw err;
    }
  };

  if (!isInitialized || !isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 px-4 py-12 flex items-center justify-center">
          <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm max-w-md w-full">
            <p className="mb-4 text-sm font-medium text-foreground">
              You need to be signed in to upload notes.
            </p>
            <Link
              to="/login"
              search={{ redirect: "/upload" }}
              className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Sign In
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 px-4 py-12">
        <section className="mx-auto w-full max-w-2xl rounded-xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <UploadIcon className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Upload notes</h1>
              <p className="text-sm text-muted-foreground">
                Sharing as <span className="font-semibold text-foreground">{user?.name}</span>.
              </p>
            </div>
          </div>

          <NoteForm mode="create" onSubmit={handleSubmit} />
        </section>
      </main>

      <Footer />
    </div>
  );
}
