import { Request, Response } from "express";
import User from "../models/user.model";
import { IUserDocument } from "../types/type";
import { ApiError } from "../utils/responses/ApiError";
import { ApiResponse } from "../utils/responses/ApiResponse";
import { oauth2Client } from "../utils/googleClient";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../types/type";

const options = {
  expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  httpOnly: true,
  secure: true,
  sameSite: "none" as const,
};

const createToken = (user: IUserDocument) => {
  return user.generateAuthToken();
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      throw new ApiError(400, "All fields are required");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(400, "User already exists");
    }

    const newUser = await User.create({
      name,
      email,
      password,
      authProvider: "local",
    });

    res
      .status(201)
      .json(new ApiResponse(201, newUser, "User registered successfully"));
  } catch (error) {
    console.error("Error in register:", error);
    throw new ApiError(500, "Internal server error");
  }
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({ email }).select("+password");
    if (
      !user ||
      !(await user.comparePassword(password)) ||
      user.authProvider !== "local"
    ) {
      throw new ApiError(401, "Invalid email or password");
    }

    const token = createToken(user);

    if (!token) {
      throw new ApiError(500, "Failed to create authentication token");
    }

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      authProvider: user.authProvider,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res
      .cookie("token", token, options)
      .status(200)
      .json(new ApiResponse(200, userResponse, "Login successful"));
  } catch (error) {
    console.error("Error in login:", error);
    throw new ApiError(500, "Internal server error");
  }
});

export const googleLogin = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code) {
      throw new ApiError(400, "Google authorization code is required");
    }

    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens) {
      throw new ApiError(400, "Failed to retrieve tokens from Google");
    }
    oauth2Client.setCredentials(tokens);
    const userInfo = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    const userInfoJson = await userInfo.json();

    const { email, name } = userInfoJson;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        authProvider: "google",
      });
    }

    if (!user) {
      throw new ApiError(500, "User not found after creation");
    }

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      authProvider: user.authProvider,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    const token = createToken(user);

    if (!token) {
      throw new ApiError(500, "Failed to create authentication token");
    }
    res
      .cookie("token", token, options)
      .status(200)
      .json(new ApiResponse(200, userResponse, "Google login successful"));
  } catch (error) {
    console.error("Error in googleLogin:", error);
    throw new ApiError(500, "Error in googleLogin:");
  }
});

export const logout = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user;

      if (!user) {
        throw new ApiError(401, "User not authenticated");
      }

      res
        .clearCookie("token", options)
        .status(200)
        .json(new ApiResponse(200, null, "Logout successful"));
    } catch (error) {
      console.error("Error in logout:", error);
      throw new ApiError(500, "Internal server error");
    }
  }
);

export const getCurrentUser = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req?.user?._id;

      if (!userId) {
        throw new ApiError(401, "User not authenticated");
      }

      const user = await User.findById(userId).lean();

      const userResponse = {
        _id: user?._id,
        name: user?.name,
        email: user?.email,
        authProvider: user?.authProvider,
        createdAt: user?.createdAt,
        updatedAt: user?.updatedAt,
      };

      res
        .status(200)
        .json(new ApiResponse(200, userResponse, "User retrieved"));
    } catch (error) {
      console.error("Error in getCurrentUser:", error);
      throw new ApiError(500, "Internal server error");
    }
  }
);

export const updateUser = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?._id;
      const { name, email } = req.body;

      if (!userId) {
        throw new ApiError(401, "User not authenticated");
      }

      if (!name && !email) {
        throw new ApiError(400, "At least one field is required to update");
      }

      const updateData: Partial<IUserDocument> = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;

      const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
      }).lean();

      if (!updatedUser) {
        throw new ApiError(404, "User not found");
      }

      const userResponse = {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        authProvider: updatedUser.authProvider,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      };

      res
        .status(200)
        .json(new ApiResponse(200, userResponse, "User updated successfully"));
    } catch (error) {
      console.error("Error in updateUser:", error);
      throw new ApiError(500, "Internal server error");
    }
  }
);
