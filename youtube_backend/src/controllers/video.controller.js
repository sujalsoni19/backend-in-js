import { Video } from "../models/video.model.js";
import { Apierror } from "../utils/Apierror.js";
import { Apiresponse } from "../utils/Apiresponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { normalizeImage } from "./user.controller.js";

const postaVideo = asyncHandler(async (req, res) => {
  const { title, description, isPublished } = req.body;

  if ([title, description, isPublished].some((field) => field?.trim() === "")) {
    throw new Apierror(400, "All fields are required");
  }

  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!thumbnailLocalPath) {
    throw new Apierror(400, "Thumbnail is required");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!thumbnail) {
    throw new Apierror(400, "Thumbnail upload failed");
  }

  const videoFileLocalPath = req.files?.videoFile?.[0]?.path;

  if (!videoFileLocalPath) {
    throw new Apierror(400, "videoFile is required");
  }

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);

  if (!videoFile) {
    throw new Apierror(400, "videoFile upload failed");
  }

  // add viewcount logic
  const video = await Video.create({
    videoFile: normalizeImage(videoFile),
    title,
    description,
    thumbnail: normalizeImage(thumbnail),
    duration: videoFile?.duration,
    isPublished,
    owner: req.user?._id,
  });

  const uploadedVideo = await Video.findById(video._id);

  if (!uploadedVideo) {
    throw new Apierror(500, "something went wrong while uploading a video");
  }

  return res
    .status(200)
    .json(new Apiresponse(200, uploadedVideo, "Video uploaded successfully"));
});

export { postaVideo }
