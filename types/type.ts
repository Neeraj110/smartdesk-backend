import { Document, Types, HydratedDocument } from "mongoose";
import { Request } from "express";

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string | null;
  authProvider: "local" | "google";
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(password: string): Promise<boolean>;
  generateAuthToken(): string;
  toPublicJSON(): {
    _id: Types.ObjectId;
    name: string;
    email: string;
    authProvider: "local" | "google";
    createdAt: Date;
    updatedAt: Date;
  };
}

export type IUserDocument = HydratedDocument<IUser, IUserMethods>;

export interface AuthenticatedRequest extends Request {
  user?: IUserDocument;
}


export interface INotes {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  text: string;
  originalNote: string;
  summarizedNote: string;
  downloadedPdf: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITask {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  description?: string | null;
  completed: boolean;
  status: "pending" | "in-progress" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

export interface IAiLearningGuide {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  topic: string;
  durationDays: number;
  dailyPlan: IDailyPlan[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IDailyPlan {
  _id: Types.ObjectId;
  day: number;
  title: string;
  description: string;
  resources: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
