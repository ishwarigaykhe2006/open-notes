import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { connectDB } from "./db.js";
import { seedDatabase } from "./seed.js";
import notesRouter from "./routes/notes.js";
import commentsRouter from "./routes/comments.js";
import authRouter from "./routes/auth.js";
import metaRouter from "./routes/meta.js";
import bookmarksRouter from "./routes/bookmarks.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend clients (Vite default ports 3000, 5173, etc.)
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically at /uploads/
const uploadDir = path.resolve(process.cwd(), "server", "uploads");
app.use("/uploads", express.static(uploadDir));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "openNotes Backend API",
  });
});

// Mount API routes
app.use("/api/notes", notesRouter);
app.use("/api/notes", commentsRouter);
app.use("/api", commentsRouter); // For /api/comments/:id
app.use("/api/auth", authRouter);
app.use("/api/bookmarks", bookmarksRouter);
app.use("/api", metaRouter); // For /api/stats, /api/tags, /api/subjects, /api/reports

// Error handler
app.use((err, req, res, next) => {
  console.error("[Server Error]", err.stack || err.message);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

async function startServer() {
  await connectDB();
  // Auto-seed default notes if database is empty
  await seedDatabase(false);

  app.listen(PORT, () => {
    console.log(`[Server] openNotes API Server is running at http://localhost:${PORT}`);
    console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
