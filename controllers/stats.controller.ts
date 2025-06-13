// stats.controller.ts
// in this file, we will define the controller for handling stats-related requests
// like how many tasks are completed, how many are pending, etc.

import { Response } from "express";
import Note from "../models/note.model";
import Task from "../models/task.model";
import AiLearning from "../models/aiLearning.model";
import { ApiError } from "../utils/responses/ApiError";
import { ApiResponse } from "../utils/responses/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../types/type";

export const getStats = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req?.user?._id;

      console.log("User ID:", userId);

      if (!userId) {
        throw new ApiError(400, "User ID is required");
      }

      const aiLearnings = await AiLearning.countDocuments({ userId: userId });

      const totalNotes = await Note.countDocuments({ userId: userId });

      const totalTasks = await Task.countDocuments({ userId: userId });

      const completedTasks = await Task.countDocuments({
        userId: userId,
        completed: true,
      });

      const pendingTasks = await Task.countDocuments({
        userId: userId,
        completed: false,
      });

      res.status(200).json(
        new ApiResponse(
          200,
          {
            totalNotes,
            totalTasks,
            completedTasks,
            pendingTasks,
            aiLearnings,
          },
          "Stats retrieved successfully"
        )
      );
    } catch (error) {
      console.error("Error in getStats:", error);
      throw new ApiError(500, "Internal server error");
    }
  }
);
