import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reporterEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ["note", "comment"],
      required: true,
    },
    targetId: {
      type: String,
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
    },
    details: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Prevent duplicate reports by the same user on the same target
reportSchema.index({ reporterEmail: 1, targetType: 1, targetId: 1 }, { unique: true });

export const Report = mongoose.model("Report", reportSchema);
