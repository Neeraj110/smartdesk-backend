import fs from "fs";
import { Response } from "express";
import { ApiResponse } from "../utils/responses/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/responses/ApiError";
import { AuthenticatedRequest } from "../types/type";
import Notes from "../models/note.model";
import {
  uploadFileToCloudinary,
  deleteFileFromCloudinary,
} from "../utils/cloudinary";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const gemini = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GEN_AI_API_KEY!,
});

const getSummaryWordCount = (length: string): string => {
  const map: Record<string, string> = {
    short: "100-120",
    medium: "150-200",
    long: "180-200",
  };
  return map[length] || map["medium"];
};

const extractTextFromFile = async (
  filePath: string,
  extension: string
): Promise<string> => {
  switch (extension.toLowerCase()) {
    case "pdf":
      return (await pdfParse(fs.readFileSync(filePath))).text;
    case "txt":
      return fs.readFileSync(filePath, "utf-8");
    case "docx":
      return (await mammoth.extractRawText({ path: filePath })).value;
    default:
      throw new ApiError(400, "Unsupported file type");
  }
};

const generateSummary = async (
  text: string,
  wordCount: string
): Promise<string> => {
  if (!text || text.trim().length === 0) {
    throw new ApiError(400, "Input text cannot be empty");
  }
  try {
    const response: GenerateContentResponse =
      await gemini.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Summarize the following text in approximately ${wordCount} words:\n\n${text}`,
              },
            ],
          },
        ],
        config: {
          maxOutputTokens: 500,
          temperature: 0.5,
        },
      });

    if (!response?.candidates?.length) {
      throw new ApiError(500, "No summary generated from Gemini");
    }

    const summary = response.candidates[0]?.content?.parts?.[0]?.text?.trim();
    if (!summary) {
      throw new ApiError(500, "Failed to extract summary from Gemini response");
    }

    return summary;
  } catch (error: any) {
    console.error("Error generating summary:", error);
    if (error.status === 429) {
      throw new ApiError(429, "Rate limit exceeded. Please try again later.");
    }
    if (error.status === 401) {
      throw new ApiError(401, "Invalid or missing Gemini API key.");
    }
    if (error.status === 400) {
      throw new ApiError(400, "Invalid request to Gemini API.");
    }

    throw new ApiError(
      500,
      error.message || "Failed to generate summary from Gemini"
    );
  }
};

export const summarienote = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { title, text, summaryLength = "medium" } = req.body;
    const file = req.file;

    if (!title || title.length < 3 || title.length > 20) {
      throw new ApiError(400, "Title must be between 3 and 20 characters");
    }

    if (!file && !text) {
      throw new ApiError(400, "File or text is required for summarization");
    }

    let fileText = text || "";
    let fileUrl = "";

    if (file) {
      const ext = file.originalname.split(".").pop() || "";
      fileText = await extractTextFromFile(file.path, ext);
      fileUrl = (await uploadFileToCloudinary(file.path, "notes")).url;
    }

    const summary = await generateSummary(
      fileText,
      getSummaryWordCount(summaryLength)
    );

    if (!summary) {
      throw new ApiError(500, "Failed to generate summary from Gemini");
    }

    const note = await Notes.create({
      userId: req.user?._id,
      title,
      text: fileText,
      originalNote: fileUrl,
      summarizedNote: summary,
      downloadedPdf: false,
    });

    res
      .status(200)
      .json(
        new ApiResponse(200, note, "Note uploaded and summarized successfully")
      );
  }
);

export const updatenote = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { title, text, summaryLength = "medium" } = req.body;
    const file = req.file;

    if (!id) throw new ApiError(400, "Note ID is required");
    if (!title || title.length < 3 || title.length > 20) {
      throw new ApiError(400, "Title must be between 3 and 20 characters");
    }
    if (!file && !text) {
      throw new ApiError(400, "File or text is required for summarization");
    }

    const note = await Notes.findById(id);
    if (!note) throw new ApiError(404, "Note not found");
    if (note.userId.toString() !== req.user?._id.toString()) {
      throw new ApiError(403, "You do not have permission to update this note");
    }

    let fileText = text || note.text;
    let fileUrl = note.originalNote;

    if (file) {
      const ext = file.originalname.split(".").pop() || "";
      fileText = await extractTextFromFile(file.path, ext);

      if (note.originalNote) await deleteFileFromCloudinary(note.originalNote);
      fileUrl = (await uploadFileToCloudinary(file.path, "notes")).url;
    }

    const summary = await generateSummary(
      fileText,
      getSummaryWordCount(summaryLength)
    );

    if (!summary) {
      throw new ApiError(500, "Failed to generate summary from Gemini");
    }

    const updatedNote = await Notes.findByIdAndUpdate(
      id,
      {
        title,
        text: fileText,
        originalNote: fileUrl,
        summarizedNote: summary,
        updatedAt: new Date(),
      },
      { new: true }
    );

    res
      .status(200)
      .json(new ApiResponse(200, updatedNote, "Note updated successfully"));
  }
);

export const deletenote = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "Note ID is required");

    const note = await Notes.findById(id);
    if (!note) throw new ApiError(404, "Note not found");
    if (note.userId.toString() !== req.user?._id.toString()) {
      throw new ApiError(403, "You do not have permission to delete this note");
    }

    if (note.originalNote) await deleteFileFromCloudinary(note.originalNote);
    await Notes.findByIdAndDelete(id);

    res
      .status(200)
      .json(new ApiResponse(200, null, "Note deleted successfully"));
  }
);

export const getnotes = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const notes = await Notes.find({ userId: req.user?._id })
      .sort({ createdAt: -1 })
      .lean();

    if (!notes || notes.length === 0) {
      throw new ApiError(404, "No notes found for this user");
    }

    res
      .status(200)
      .json(new ApiResponse(200, notes, "Notes retrieved successfully"));
  }
);
