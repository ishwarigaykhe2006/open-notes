import mongoose from "mongoose";

const ratingEntrySchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    value: { type: Number, required: true, min: 1, max: 5 },
  },
  { _id: false }
);

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    semester: {
      type: Number,
      default: 1,
      min: 1,
      max: 12,
    },
    uploader: {
      type: String,
      default: "Anonymous",
    },
    ownerEmail: {
      type: String,
      required: true,
      index: true,
    },
    downloads: {
      type: Number,
      default: 0,
    },
    pages: {
      type: Number,
      default: 1,
    },
    fileUrl: {
      type: String,
      default: "",
    },
    fileName: {
      type: String,
      default: "",
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    mimeType: {
      type: String,
      default: "application/pdf",
    },
    ratings: {
      type: [ratingEntrySchema],
      default: [],
    },
    rating: {
      type: Number,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        // Format createdAt to YYYY-MM-DD string for backward compatibility with frontend
        if (ret.createdAt instanceof Date) {
          ret.createdAt = ret.createdAt.toISOString().slice(0, 10);
        }
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Calculate average rating before save
noteSchema.pre("save", function () {
  if (this.ratings && this.ratings.length > 0) {
    const sum = this.ratings.reduce((acc, r) => acc + r.value, 0);
    this.rating = Math.round((sum / this.ratings.length) * 10) / 10;
    this.ratingCount = this.ratings.length;
  } else {
    this.rating = 0;
    this.ratingCount = 0;
  }
});

// Text index for search
noteSchema.index({
  title: "text",
  description: "text",
  subject: "text",
  tags: "text",
});

export const Note = mongoose.model("Note", noteSchema);
