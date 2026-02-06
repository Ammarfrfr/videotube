import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // ✅ SAFE DELETE
    const absolutePath = path.resolve(process.cwd(), localFilePath);

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    return response;

  } catch (error) {
    console.error("Cloudinary upload failed:", error);

    // ✅ SAFE DELETE EVEN ON ERROR
    if (localFilePath) {
      const absolutePath = path.resolve(process.cwd(), localFilePath);
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    }

    return null;
  }
};

const deleteFromCloudinary = async (publicId, resourceType) => {
  if (!publicId) return null;

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    console.log(`File deleted from cloudinary: ${publicId}`);
  } catch (error) {
    console.log(
      `Error while deleting file from cloudinary: ${publicId}`,
      error
    );
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };