import mongoose, { Schema } from "mongoose";
import { INotes } from "../types/type";

const noteSchema = new Schema<INotes>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [20, "Title cannot exceed 20 characters"],
    },
    originalNote: {
      type: String,
      // required: [true, "Original note is required"],
    },
    summarizedNote: {
      type: String,
    },
  },
  { timestamps: true }
);

const Notes = mongoose.model<INotes>("Notes", noteSchema);
export default Notes;
