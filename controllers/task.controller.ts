import { ApiResponse } from "../utils/responses/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import Task from "../models/task.model";
import { ApiError } from "../utils/responses/ApiError";
import { Response } from "express";
import { AuthenticatedRequest } from "../types/type";

export const createTask = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { title, description, completed } = req.body;
      const userId = req?.user?._id;
      if (!userId) {
        throw new ApiError(401, "User not authenticated");
      }
      if (!title) {
        throw new ApiError(400, "Title is required");
      }
      const newTask = await Task.create({
        userId,
        title,
        description: description || null,
        completed: completed || false,
      });

      const populatedTask = await Task.findById(newTask._id).populate(
        "userId",
        "name email"
      );
      if (!populatedTask) {
        throw new ApiError(404, "Task not found");
      }

      return res
        .status(201)
        .json(new ApiResponse(201, populatedTask, "Task created successfully"));
    } catch (error) {
      console.error("Error in createTask:", error);
      throw new ApiError(500, "Internal server error");
    }
  }
);

export const getTasks = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req?.user?._id;
      
      if (!userId) {
        throw new ApiError(401, "User not authenticated");
      }
      const tasks = await Task.find({ userId }).populate(
        "userId",
        "name email"
      );

      return res
        .status(200)
        .json(new ApiResponse(200, tasks, "Tasks retrieved successfully"));
    } catch (error) {
      console.error("Error in getTasks:", error);
      throw new ApiError(500, "Internal server error");
    }
  }
);

export const updateTask = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { taskId } = req.params;
      const { title, description, completed } = req.body;
      const userId = req?.user?._id;

      if (!userId) {
        throw new ApiError(401, "User not authenticated");
      }
      if (!taskId) {
        throw new ApiError(400, "Task ID is required");
      }

      const updatedTask = await Task.findOneAndUpdate(
        { _id: taskId, userId },
        { title, description, completed },
        { new: true }
      ).populate("userId", "name email");

      if (!updatedTask) {
        throw new ApiError(404, "Task not found or not authorized");
      }

      return res
        .status(200)
        .json(new ApiResponse(200, updatedTask, "Task updated successfully"));
    } catch (error) {
      console.error("Error in updateTask:", error);
      throw new ApiError(500, "Internal server error");
    }
  }
);

export const deleteTask = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { taskId } = req.params;
      const userId = req?.user?._id;

      if (!userId) {
        throw new ApiError(401, "User not authenticated");
      }
      if (!taskId) {
        throw new ApiError(400, "Task ID is required");
      }

      const deletedTask = await Task.findOneAndDelete({ _id: taskId, userId });

      if (!deletedTask) {
        throw new ApiError(404, "Task not found or not authorized");
      }

      return res
        .status(200)
        .json(new ApiResponse(200, deletedTask, "Task deleted successfully"));
    } catch (error) {
      console.error("Error in deleteTask:", error);
      throw new ApiError(500, "Internal server error");
    }
  }
);

export const getTaskById = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { taskId } = req.params;
      const userId = req?.user?._id;

      if (!userId) {
        throw new ApiError(401, "User not authenticated");
      }
      if (!taskId) {
        throw new ApiError(400, "Task ID is required");
      }

      const task = await Task.findOne({ _id: taskId, userId }).populate(
        "userId",
        "name email"
      );

      if (!task) {
        throw new ApiError(404, "Task not found or not authorized");
      }

      return res
        .status(200)
        .json(new ApiResponse(200, task, "Task retrieved successfully"));
    } catch (error) {
      console.error("Error in getTaskById:", error);
      throw new ApiError(500, "Internal server error");
    }
  }
);

export const iscompleted = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { taskId } = req.params;
      const userId = req?.user?._id;

      if (!userId) {
        throw new ApiError(401, "User not authenticated");
      }
      if (!taskId) {
        throw new ApiError(400, "Task ID is required");
      }

      const task = await Task.findOne({ _id: taskId, userId });

      if (!task) {
        throw new ApiError(404, "Task not found or not authorized");
      }

      task.completed = !task.completed;
      await task.save();

      return res
        .status(200)
        .json(new ApiResponse(200, task, "Task completion status updated"));
    } catch (error) {
      console.error("Error in iscompleted:", error);
      throw new ApiError(500, "Internal server error");
    }
  }
);
