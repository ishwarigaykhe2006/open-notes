import express from "express";
import { Comment } from "../models/Comment.js";

const router = express.Router({ mergeParams: true });

const COMMENT_COOLDOWN_SECONDS = 10;

// GET /api/notes/:id/comments
router.get("/:id/comments", async (req, res) => {
  try {
    const comments = await Comment.find({ noteId: req.params.id }).sort({ createdAt: -1 });
    res.json(comments.map((c) => c.toJSON()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notes/:id/comments
router.post("/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const { author, authorEmail, text } = req.body;

    if (!author || !authorEmail || !text || !text.trim()) {
      return res.status(400).json({ error: "Author, authorEmail, and text are required." });
    }

    // Rate limiting: 10s cooldown per user
    const lastComment = await Comment.findOne({ authorEmail }).sort({ createdAt: -1 });
    if (lastComment) {
      const elapsed = (Date.now() - new Date(lastComment.createdAt).getTime()) / 1000;
      if (elapsed < COMMENT_COOLDOWN_SECONDS) {
        const remaining = Math.ceil(COMMENT_COOLDOWN_SECONDS - elapsed);
        return res.status(429).json({
          error: `Please wait ${remaining}s before posting again.`,
          secondsLeft: remaining,
        });
      }
    }

    const comment = new Comment({
      noteId: id,
      author: author.trim(),
      authorEmail: authorEmail.trim(),
      text: text.trim(),
    });

    await comment.save();
    res.status(201).json(comment.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/comments/:id
router.delete("/comments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body || req.query;

    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    if (email && comment.authorEmail !== email) {
      return res.status(403).json({ error: "Not authorized to delete this comment" });
    }

    await Comment.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
