import mongoose, { Schema, Document } from "mongoose";
import { IUserDocument } from "../types/type";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      default: null,
      minlength: [4, "Password must be at least 4 characters"],
      required: function (this: IUserDocument) {
        return this.authProvider === "local";
      },
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
      required: [true, "Authentication provider is required"],
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ name: 1 });

userSchema.pre<IUserDocument>("save", async function (next) {
  if (
    this.isModified("password") &&
    this.password &&
    this.authProvider === "local"
  ) {
    try {
      const salt = await bcryptjs.genSalt(10);
      this.password = await bcryptjs.hash(this.password, salt);
    } catch (error: any) {
      return next(error);
    }
  }
  next();
});

userSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  if (this.authProvider !== "local") return false;
  return bcryptjs.compare(password, this.password);
};

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    { _id: this._id, email: this.email, name: this.name },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );
  return token;
};

const User = mongoose.model<IUserDocument & Document>("User", userSchema);
export default User;
