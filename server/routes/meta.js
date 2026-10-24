import express from "express";
import { Note } from "../models/Note.js";
import { Report } from "../models/Report.js";

const router = express.Router();

// GET /api/stats — summary statistics
router.get("/stats", async (req, res) => {
  try {
    const notes = await Note.find();
    const totalNotes = notes.length;
    const totalDownloads = notes.reduce((sum, n) => sum + (n.downloads || 0), 0);
    const totalSubjects = new Set(notes.map((n) => n.subject)).size;
    const totalContributors = new Set(notes.map((n) => n.uploader).filter(Boolean)).size;
    const totalPages = notes.reduce((sum, n) => sum + (n.pages || 0), 0);

    res.json({
      totalNotes,
      totalDownloads,
      totalSubjects,
      totalContributors,
      totalPages,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tags/popular — top tags
router.get("/tags/popular", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 12;
    const notes = await Note.find({}, "tags");
    const tagCounts = {};

    for (const note of notes) {
      for (const tag of note.tags || []) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }

    const popular = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }));

    res.json(popular);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/subjects — subjects with count
router.get("/subjects", async (req, res) => {
  try {
    const notes = await Note.find({}, "subject");
    const subjectCounts = {};

    for (const note of notes) {
      if (note.subject) {
        subjectCounts[note.subject] = (subjectCounts[note.subject] || 0) + 1;
      }
    }

    const subjects = Object.entries(subjectCounts).map(([name, count]) => ({
      name,
      count,
    }));

    res.json(subjects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reports — report note or comment
router.post("/reports", async (req, res) => {
  try {
    const { reporterEmail, targetType, targetId, reason, details } = req.body;

    if (!reporterEmail || !targetType || !targetId || !reason) {
      return res.status(400).json({ error: "Missing required report fields" });
    }

    const existing = await Report.findOne({ reporterEmail, targetType, targetId });
    if (existing) {
      return res.json({ duplicate: true });
    }

    const report = new Report({
      reporterEmail,
      targetType,
      targetId,
      reason,
      details: details || "",
    });

    await report.save();
    res.status(201).json({ duplicate: false, report: report.toJSON() });
  } catch (err) {
    if (err.code === 11000) {
      return res.json({ duplicate: true });
    }
    res.status(500).json({ error: err.message });
  }
});

export default router;
