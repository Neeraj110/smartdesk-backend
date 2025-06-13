import mongoose, { Schema } from "mongoose";
import { IAiLearningGuide, IDailyPlan } from "../types/type";
import { create } from "domain";

const DailyPlanSchema = new Schema<IDailyPlan>(
  {
    day: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    resources: {
      type: [String],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const AiLearningSchema = new Schema<IAiLearningGuide>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    topic: {
      type: String,
      required: [true, "Topic is required"],
      trim: true,
      minlength: [3, "Topic must be at least 3 characters"],
      maxlength: [150, "Topic cannot exceed 50 characters"],
    },
    durationDays: {
      type: Number,
      required: [true, "Duration in days is required"],
      min: [1, "Duration must be at least 1 day"],
    },
    dailyPlan: {
      type: [DailyPlanSchema],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

AiLearningSchema.index({ userId: 1, createAt: -1 });
AiLearningSchema.index({ topic: 1 });

AiLearningSchema.pre("save", function (next) {
  const days = this.dailyPlan.map((plan: IDailyPlan) => plan.day);
  const uniqueDays = new Set(days);
  if (uniqueDays.size !== days.length) {
    return next(new Error("Each day in the daily plan must be unique"));
  }
  next();
});

const AiLearning = mongoose.model<IAiLearningGuide>(
  "AiLearningGuide",
  AiLearningSchema
);
export default AiLearning;
