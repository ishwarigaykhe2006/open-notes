import express from "express";
import { Bookmark } from "../models/Bookmark.js";

const router = express.Router();

// GET /api/bookmarks?email=...
router.get("/", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.json([]);
    }

    const bookmarks = await Bookmark.find({ userEmail: email.toLowerCase() });
    res.json(bookmarks.map((b) => b.noteId.toString()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bookmarks/toggle
router.post("/toggle", async (req, res) => {
  try {
    const { email, noteId } = req.body;
    if (!email || !noteId) {
      return res.status(400).json({ error: "Email and noteId are required." });
    }

    const userEmail = email.toLowerCase();
    const existing = await Bookmark.findOne({ userEmail, noteId });

    if (existing) {
      await Bookmark.findByIdAndDelete(existing._id);
      const remaining = await Bookmark.find({ userEmail });
      return res.json({
        bookmarked: false,
        noteIds: remaining.map((b) => b.noteId.toString()),
      });
    } else {
      await Bookmark.create({ userEmail, noteId });
      const current = await Bookmark.find({ userEmail });
      return res.json({
        bookmarked: true,
        noteIds: current.map((b) => b.noteId.toString()),
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
