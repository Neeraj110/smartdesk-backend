import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import { url } from "inspector";

dotenv.config();

if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  throw new Error(
    "Cloudinary configuration is missing in environment variables"
  );
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadFileToCloudinary = async (
  localFilePath: string,
  folder: string = "notes"
): Promise<{ url: string; public_id: string }> => {
  if (!localFilePath) throw new Error("File path not found");

  try {
    const result = await cloudinary.uploader.upload(localFilePath, {
      folder,
      resource_type: "raw",
    });

    fs.unlinkSync(localFilePath);

    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    fs.unlinkSync(localFilePath); // delete temp file even on error
    throw error;
  }
};

export const deleteFileFromCloudinary = async (url: string): Promise<void> => {
  if (!url) return;
  const public_id = url.split("/").slice(7, 9).join("/").split(".")[0];

  try {
    await cloudinary.uploader.destroy(public_id, {
      resource_type: "raw",
    });
  } catch (error) {
    console.error("Error deleting file from Cloudinary:", error);
    throw error;
  }
};
