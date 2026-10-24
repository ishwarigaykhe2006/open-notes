import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { Note } from "../models/Note.js";
import { Comment } from "../models/Comment.js";

const router = express.Router();

// Configure multer storage for note files
const uploadDir = path.resolve(process.cwd(), "server", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
});

// GET /api/notes/featured — top 4 by downloads
router.get("/featured", async (req, res) => {
  try {
    const notes = await Note.find().sort({ downloads: -1 }).limit(4);
    res.json(notes.map((n) => n.toJSON()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/notes/top-rated — top rated notes
router.get("/top-rated", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 4;
    const notes = await Note.find({ ratingCount: { $gt: 0 } })
      .sort({ rating: -1, ratingCount: -1 })
      .limit(limit);
    res.json(notes.map((n) => n.toJSON()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/notes/recent — most recently created
router.get("/recent", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 4;
    const notes = await Note.find().sort({ createdAt: -1 }).limit(limit);
    res.json(notes.map((n) => n.toJSON()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/notes/by-ids — fetch multiple notes by id
router.get("/by-ids", async (req, res) => {
  try {
    const ids = (req.query.ids || "").split(",").filter(Boolean);
    const notes = await Note.find({ _id: { $in: ids } });
    res.json(notes.map((n) => n.toJSON()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/notes — list notes with query filters
router.get("/", async (req, res) => {
  try {
    const { search, subject, semester, tag, uploader } = req.query;
    const filter = {};

    if (subject && subject !== "All") {
      filter.subject = subject;
    }

    if (semester && semester !== "All") {
      filter.semester = Number(semester);
    }

    if (tag) {
      filter.tags = { $in: [new RegExp(`^${tag}$`, "i")] };
    }

    if (uploader) {
      filter.$or = [{ uploader: uploader }, { ownerEmail: uploader }];
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { tags: { $in: [new RegExp(q, "i")] } },
        { subject: { $regex: q, $options: "i" } },
      ];
    }

    const notes = await Note.find(filter).sort({ createdAt: -1 });
    res.json(notes.map((n) => n.toJSON()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/notes/:id — single note
router.get("/:id", async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }
    res.json(note.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notes — upload note (with multipart file support)
router.post("/", upload.single("file"), async (req, res) => {
  try {
    const { title, description, subject, semester, uploader, ownerEmail, tags } = req.body;

    if (!title || !subject || !ownerEmail) {
      return res.status(400).json({ error: "Title, subject, and ownerEmail are required." });
    }

    let parsedTags = [];
    if (typeof tags === "string") {
      try {
        parsedTags = JSON.parse(tags);
      } catch {
        parsedTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
      }
    } else if (Array.isArray(tags)) {
      parsedTags = tags;
    }

    let pages = 1;
    let fileUrl = "";
    let fileName = "";
    let fileSize = 0;
    let mimeType = "application/pdf";

    if (req.file) {
      fileName = req.file.originalname;
      fileSize = req.file.size;
      mimeType = req.file.mimetype;
      fileUrl = `/uploads/${req.file.filename}`;
      pages = Math.max(1, Math.ceil(fileSize / 50_000));
    }

    const note = new Note({
      title,
      description: description || "",
      subject,
      semester: semester ? Number(semester) : 1,
      tags: parsedTags,
      uploader: uploader || "Anonymous",
      ownerEmail,
      pages,
      fileUrl,
      fileName,
      fileSize,
      mimeType,
      downloads: 0,
    });

    await note.save();
    res.status(201).json(note.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notes/:id — update note
router.put("/:id", upload.single("file"), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, subject, semester, tags, email } = req.body;

    const note = await Note.findById(id);
    if (!note) return res.status(404).json({ error: "Note not found" });

    // Verify owner
    if (email && note.ownerEmail !== email) {
      return res.status(403).json({ error: "Not authorized to update this note." });
    }

    if (title !== undefined) note.title = title;
    if (description !== undefined) note.description = description;
    if (subject !== undefined) note.subject = subject;
    if (semester !== undefined) note.semester = Number(semester);

    if (tags !== undefined) {
      if (typeof tags === "string") {
        try {
          note.tags = JSON.parse(tags);
        } catch {
          note.tags = tags.split(",").map((t) => t.trim()).filter(Boolean);
        }
      } else if (Array.isArray(tags)) {
        note.tags = tags;
      }
    }

    if (req.file) {
      note.fileName = req.file.originalname;
      note.fileSize = req.file.size;
      note.mimeType = req.file.mimetype;
      note.fileUrl = `/uploads/${req.file.filename}`;
      note.pages = Math.max(1, Math.ceil(req.file.size / 50_000));
    }

    await note.save();
    res.json(note.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/notes/:id — delete note and its comments
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body || req.query;

    const note = await Note.findById(id);
    if (!note) return res.status(404).json({ error: "Note not found" });

    if (email && note.ownerEmail !== email) {
      return res.status(403).json({ error: "Not authorized to delete this note." });
    }

    await Note.findByIdAndDelete(id);
    await Comment.deleteMany({ noteId: id });

    // Clean up uploaded file if exists
    if (note.fileUrl && note.fileUrl.startsWith("/uploads/")) {
      const filename = path.basename(note.fileUrl);
      const filePath = path.join(uploadDir, filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch {
          // ignore error removing file
        }
      }
    }

    res.json({ success: true, message: "Note deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notes/:id/rate — rate a note
router.post("/:id/rate", async (req, res) => {
  try {
    const { id } = req.params;
    const { email, value } = req.body;

    const val = Number(value);
    if (!Number.isInteger(val) || val < 1 || val > 5) {
      return res.status(400).json({ error: "Rating must be an integer between 1 and 5." });
    }
    if (!email) {
      return res.status(400).json({ error: "Email is required to rate." });
    }

    const note = await Note.findById(id);
    if (!note) return res.status(404).json({ error: "Note not found" });

    const existingIndex = note.ratings.findIndex((r) => r.email === email);
    if (existingIndex >= 0) {
      note.ratings[existingIndex].value = val;
    } else {
      note.ratings.push({ email, value: val });
    }

    await note.save();
    res.json(note.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/notes/:id/rating?email=...
router.get("/:id/rating", async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.query;

    const note = await Note.findById(id);
    if (!note) return res.status(404).json({ error: "Note not found" });

    const userRating = note.ratings.find((r) => r.email === email);
    res.json({ value: userRating ? userRating.value : null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/notes/:id/download — increment downloads & deliver file
router.get("/:id/download", async (req, res) => {
  try {
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloads: 1 } },
      { new: true }
    );
    if (!note) return res.status(404).json({ error: "Note not found" });

    if (note.fileUrl && note.fileUrl.startsWith("/uploads/")) {
      const filename = path.basename(note.fileUrl);
      const filePath = path.join(uploadDir, filename);
      if (fs.existsSync(filePath)) {
        return res.download(filePath, note.fileName || "opennotes-download.pdf");
      }
    }

    // If no physical file (e.g. demo seed note), return JSON success with updated downloads
    res.json({ success: true, downloads: note.downloads });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
