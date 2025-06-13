// File: aiLearning.controller.ts

import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/responses/ApiError";
import { ApiResponse } from "../utils/responses/ApiResponse";
import { Response } from "express";
import { AuthenticatedRequest } from "../types/type";
import AiLearning from "../models/aiLearning.model";
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { IDailyPlan } from "../types/type";

const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY_2!,
});

interface ParsedResponse {
  dailyPlan: IDailyPlan[];
}

export const createAiLearning = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { topic, durationDays = 7 } = req.body;
    const userId = req.user?._id;

    if (!userId) throw new ApiError(401, "User authentication required");
    if (!topic) throw new ApiError(400, "Topic is required");
    if (durationDays < 1 || durationDays > 7) {
      throw new ApiError(400, "Duration must be between 1 and 7 days");
    }

    const prompt = `You are an expert roadmap planner. Create a structured ${durationDays}-day learning roadmap for the topic "${topic}".\n
Respond strictly in this JSON format, no extra explanation or intro text:\n
\`\`\`json
{
  "dailyPlan": [
    {
      "day": 1,
      "title": "Day 1: Introduction",
      "description": "Brief overview of the topic...",
      "resources": ["YouTube video", "Official Docs", "Practice Exercise"]
    },
    ...
  ]
}
\`\`\`
Ensure the learning builds progressively across the ${durationDays} days.`;

    try {
      const response: GenerateContentResponse =
        await gemini.models.generateContent({
          model: "gemini-2.0-flash",
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          config: {
            maxOutputTokens: 2000,
            temperature: 0.7,
          },
        });

      const aiResponse =
        response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!aiResponse) throw new ApiError(500, "AI did not return any content");

      let parsedResponse: ParsedResponse;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No valid JSON found");
        parsedResponse = JSON.parse(jsonMatch[0]);
      } catch (err) {
        throw new ApiError(500, "Failed to parse AI response into JSON");
      }

      if (
        !parsedResponse.dailyPlan ||
        !Array.isArray(parsedResponse.dailyPlan)
      ) {
        throw new ApiError(500, "Invalid roadmap structure received from AI");
      }

      const learningGuide = new AiLearning({
        userId,
        topic: topic.trim(),
        durationDays,
        dailyPlan: parsedResponse.dailyPlan.map((plan, index) => ({
          day: plan.day || index + 1,
          title: plan.title || `Day ${index + 1}`,
          description: plan.description || "Learning objectives for the day",
          resources: Array.isArray(plan.resources)
            ? plan.resources
            : ["General reading", "Online tutorials"],
        })),
      });

      await learningGuide.save();

      return res
        .status(201)
        .json(
          new ApiResponse(
            201,
            learningGuide,
            "Learning roadmap created successfully"
          )
        );
    } catch (error: any) {
      console.error("Gemini API Error:", error);

      if (error.code === "insufficient_quota") {
        throw new ApiError(503, "AI service temporarily unavailable");
      }

      if (error.code === "rate_limit_exceeded") {
        throw new ApiError(429, "Too many requests. Please try again later");
      }

      throw new ApiError(
        500,
        error.message || "Failed to create learning roadmap"
      );
    }
  }
);

export const getUserLearningGuides = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
      throw new ApiError(401, "User authentication required");
    }

    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const learningGuides = await AiLearning.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select("topic durationDays dailyPlan createdAt");

    const total = await AiLearning.countDocuments({ userId });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          guides: learningGuides,
          pagination: {
            currentPage: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            totalGuides: total,
            hasNext: skip + learningGuides.length < total,
            hasPrev: Number(page) > 1,
          },
        },
        "Learning guides retrieved successfully"
      )
    );
  }
);

export const getLearningGuide = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      throw new ApiError(401, "User authentication required");
    }

    const learningGuide = await AiLearning.findOne({
      _id: id,
      userId,
    });

    if (!learningGuide) {
      throw new ApiError(404, "Learning guide not found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          learningGuide,
          "Learning guide retrieved successfully"
        )
      );
  }
);

export const deleteLearningGuide = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      throw new ApiError(401, "User authentication required");
    }

    const learningGuide = await AiLearning.findOneAndDelete({
      _id: id,
      userId,
    });

    if (!learningGuide) {
      throw new ApiError(404, "Learning guide not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Learning guide deleted successfully"));
  }
);

export const deleteAllUserLearningGuides = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
      throw new ApiError(401, "User authentication required");
    }

    const result = await AiLearning.deleteMany({ userId });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { deletedCount: result.deletedCount },
          "All learning guides deleted successfully"
        )
      );
  }
);
