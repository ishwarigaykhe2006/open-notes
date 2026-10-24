import mongoose from "mongoose";
import dotenv from "dotenv";
import { Note } from "./models/Note.js";
import { Comment } from "./models/Comment.js";
import { User } from "./models/User.js";

dotenv.config();

const INITIAL_NOTES = [
  {
    title: "Data Structures & Algorithms — Complete Notes",
    description:
      "Comprehensive notes covering arrays, linked lists, trees, graphs, sorting and searching algorithms with complexity analysis and solved examples.",
    subject: "Computer Science",
    tags: ["dsa", "algorithms", "trees", "graphs"],
    uploader: "Aarav Mehta",
    ownerEmail: "aarav@opennotes.dev",
    semester: 3,
    downloads: 1240,
    pages: 86,
    ratings: [
      { email: "seed1@opennotes.dev", value: 5 },
      { email: "seed2@opennotes.dev", value: 5 },
      { email: "seed3@opennotes.dev", value: 4 },
      { email: "seed4@opennotes.dev", value: 5 },
      { email: "seed5@opennotes.dev", value: 4 },
    ],
  },
  {
    title: "Organic Chemistry Reaction Mechanisms",
    description:
      "Step-by-step mechanisms for substitution, elimination, addition and rearrangement reactions, with arrow-pushing practice problems.",
    subject: "Chemistry",
    tags: ["organic", "reactions", "mechanisms"],
    uploader: "Priya Sharma",
    ownerEmail: "priya@opennotes.dev",
    semester: 4,
    downloads: 980,
    pages: 64,
    ratings: [
      { email: "seed1@opennotes.dev", value: 4 },
      { email: "seed2@opennotes.dev", value: 5 },
      { email: "seed3@opennotes.dev", value: 4 },
    ],
  },
  {
    title: "Calculus II — Integration Techniques",
    description:
      "Integration by parts, partial fractions, trig substitution and improper integrals. Includes 50+ worked examples and exam tips.",
    subject: "Mathematics",
    tags: ["calculus", "integration", "exam-prep"],
    uploader: "Rohan Iyer",
    ownerEmail: "rohan@opennotes.dev",
    semester: 2,
    downloads: 1523,
    pages: 72,
    ratings: [
      { email: "seed1@opennotes.dev", value: 5 },
      { email: "seed2@opennotes.dev", value: 5 },
      { email: "seed3@opennotes.dev", value: 5 },
      { email: "seed4@opennotes.dev", value: 4 },
    ],
  },
  {
    title: "Thermodynamics & Heat Transfer Summary",
    description:
      "Laws of thermodynamics, entropy, heat engines and conduction/convection/radiation explained with diagrams and formula sheets.",
    subject: "Physics",
    tags: ["thermodynamics", "physics", "formula-sheet"],
    uploader: "Sneha Kulkarni",
    ownerEmail: "sneha@opennotes.dev",
    semester: 3,
    downloads: 764,
    pages: 48,
    ratings: [
      { email: "seed1@opennotes.dev", value: 4 },
      { email: "seed2@opennotes.dev", value: 4 },
      { email: "seed3@opennotes.dev", value: 3 },
    ],
  },
  {
    title: "Database Management Systems (DBMS)",
    description:
      "ER diagrams, normalization up to BCNF, SQL queries, transactions and indexing. Perfect for semester exams and interviews.",
    subject: "Computer Science",
    tags: ["dbms", "sql", "normalization"],
    uploader: "Arjun Nair",
    ownerEmail: "arjun@opennotes.dev",
    semester: 5,
    downloads: 1105,
    pages: 91,
    ratings: [
      { email: "seed1@opennotes.dev", value: 5 },
      { email: "seed2@opennotes.dev", value: 4 },
      { email: "seed3@opennotes.dev", value: 4 },
      { email: "seed4@opennotes.dev", value: 5 },
    ],
  },
  {
    title: "Microeconomics — Demand, Supply & Markets",
    description:
      "Clear notes on elasticity, consumer theory, market structures and game theory with graphs and real-world case studies.",
    subject: "Economics",
    tags: ["microeconomics", "markets", "case-studies"],
    uploader: "Ishita Rao",
    ownerEmail: "ishita@opennotes.dev",
    semester: 3,
    downloads: 432,
    pages: 55,
    ratings: [
      { email: "seed1@opennotes.dev", value: 3 },
      { email: "seed2@opennotes.dev", value: 4 },
    ],
  },
  {
    title: "Cell Biology & Genetics Illustrated Notes",
    description:
      "Cell structure, mitosis/meiosis, Mendelian genetics and DNA replication with hand-drawn style diagrams and mnemonics.",
    subject: "Biology",
    tags: ["biology", "genetics", "diagrams"],
    uploader: "Kabir Singh",
    ownerEmail: "kabir@opennotes.dev",
    semester: 1,
    downloads: 688,
    pages: 79,
    ratings: [
      { email: "seed1@opennotes.dev", value: 4 },
      { email: "seed2@opennotes.dev", value: 5 },
      { email: "seed3@opennotes.dev", value: 4 },
    ],
  },
  {
    title: "Linear Algebra — Matrices & Vector Spaces",
    description:
      "Matrix operations, determinants, eigenvalues, eigenvectors and vector spaces with proofs and numerical practice sets.",
    subject: "Mathematics",
    tags: ["linear-algebra", "matrices", "vectors"],
    uploader: "Ananya Desai",
    ownerEmail: "ananya@opennotes.dev",
    semester: 2,
    downloads: 915,
    pages: 67,
    ratings: [
      { email: "seed1@opennotes.dev", value: 5 },
      { email: "seed2@opennotes.dev", value: 4 },
      { email: "seed3@opennotes.dev", value: 5 },
    ],
  },
];

export async function seedDatabase(force = false) {
  const count = await Note.countDocuments();
  if (count > 0 && !force) {
    console.log(`[Seed] Database already contains ${count} notes. Skipping seed.`);
    return;
  }

  if (force) {
    console.log("[Seed] Clearing existing notes and comments...");
    await Note.deleteMany({});
    await Comment.deleteMany({});
  }

  console.log("[Seed] Seeding default notes into MongoDB...");
  const createdNotes = [];
  for (const item of INITIAL_NOTES) {
    const note = new Note(item);
    await note.save();
    createdNotes.push(note);
  }

  console.log(`[Seed] Seeded ${createdNotes.length} notes successfully.`);

  // Seed sample comments on the first and third note
  if (createdNotes.length >= 3) {
    await Comment.create([
      {
        noteId: createdNotes[0]._id,
        author: "Meera Joshi",
        authorEmail: "meera@opennotes.dev",
        text: "The tree traversal section saved me before my exam. Thank you!",
      },
      {
        noteId: createdNotes[2]._id,
        author: "Dev Patel",
        authorEmail: "dev@opennotes.dev",
        text: "Great worked examples on partial fractions.",
      },
    ]);
    console.log("[Seed] Seeded initial comments.");
  }

  // Create demo user if not exists
  const demoEmail = "demo@opennotes.dev";
  const existingUser = await User.findOne({ email: demoEmail });
  if (!existingUser) {
    const demoUser = new User({
      name: "Demo Student",
      email: demoEmail,
      password: "password123",
      college: "University of Technology",
      bio: "Sharing study notes with everyone!",
    });
    await demoUser.save();
    console.log("[Seed] Created demo user (demo@opennotes.dev / password123)");
  }
}

// Standalone execution
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`) {
  const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/opennotes";
  mongoose
    .connect(MONGODB_URI)
    .then(async () => {
      console.log("[Seed] Connected to MongoDB.");
      await seedDatabase(true);
      await mongoose.disconnect();
      console.log("[Seed] Done!");
      process.exit(0);
    })
    .catch((err) => {
      console.error("[Seed] Error:", err);
      process.exit(1);
    });
}
