import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/responses/ApiError";
import type { AuthenticatedRequest, IUserDocument } from "../types/type";
import User from "../models/user.model";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken";

export const authMiddleware = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    let token =
      req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized access, token not found");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as IUserDocument;
    if (!decoded) {
      throw new ApiError(401, "Unauthorized access");
    }

    const user = await User.findById(decoded._id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    req.user = user;
    next();
  }
);
