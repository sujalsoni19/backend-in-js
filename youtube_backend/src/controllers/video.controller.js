import { Video } from "../models/video.model.js";
import { Apierror } from "../utils/Apierror.js";
import { Apiresponse } from "../utils/Apiresponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
  deleteVideoFileFromCloudinary,
} from "../utils/cloudinary.js";
import { normalizeImage } from "./user.controller.js";
import mongoose from "mongoose";

const postaVideo = asyncHandler(async (req, res) => {
  const { title, description, isPublished = true } = req.body;

  if (!title || !description) {
    throw new Apierror(
      400,
      "Title, description and publish status are required"
    );
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

  if (!video) {
    throw new Apierror(500, "something went wrong while uploading a video");
  }

  return res
    .status(200)
    .json(new Apiresponse(200, video, "Video uploaded successfully"));
});

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const pipeline = Video.aggregate([
    {
      $match: { isPublished: true },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: { $first: "$owner" },
      },
    },
    { $sort: { createdAt: -1 } },
  ]);

  const result = await Video.aggregatePaginate(pipeline, {
    page: Number(page),
    limit: Number(limit),
  });

  return res
    .status(200)
    .json(new Apiresponse(200, result, "All videos fetched successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Apierror(400, "Invalid video id");
  }

  const video = await Video.findOneAndUpdate(
    { _id: id },
    { $inc: { views: 1 } },
    { new: true }
  ).populate("owner", "username fullName avatar");

  if (!video) {
    throw new Apierror(404, "Video not found");
  }

  return res
    .status(200)
    .json(new Apiresponse(200, video, "Video fetched successfully"));
});

const updateDetails = asyncHandler(async (req, res) => {
  const { title, description, isPublished } = req.body;
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Apierror(400, "Invalid video id");
  }

  if (!title || !description) {
    throw new Apierror(400, "Title and description are required");
  }

  const video = await Video.findById(id);

  if (!video) {
    throw new Apierror(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new Apierror(403, "You are not allowed to update this video");
  }

  video.title = title;
  video.description = description;
  video.isPublished = isPublished;

  await video.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new Apiresponse(200, video, "Video details updated successfully"));
});

const updateThumbnail = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Apierror(400, "Invalid video id");
  }

  const thumbnailLocalPath = req.file?.path;

  if (!thumbnailLocalPath) {
    throw new Apierror(400, "Thumbnail file is missing");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!thumbnail.secure_url) {
    throw new Apierror(400, "error while updating Thumbnail");
  }

  const video = await Video.findById(id);

  if (!video) {
    throw new Apierror(404, "Video not found");
  }

  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new Apierror(403, "You are not allowed to update this video");
  }

  const oldthumbnailid = video?.thumbnail?.publicId;

  video.thumbnail = normalizeImage(thumbnail);
  await video.save({ validateBeforeSave: false });

  if (oldthumbnailid) {
    const res1 = await deleteFromCloudinary(oldthumbnailid);
    // console.log(res1);
  }

  return res
    .status(200)
    .json(new Apiresponse(200, video, "updated thumbnail successfully"));
});

const changePublishToggle = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Apierror(400, "Invalid video id");
  }

  const video = await Video.findById(id);

  if (!video) {
    throw new Apierror(400, "Video not found");
  }

  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new Apierror(403, "You are not allowed to update this video");
  }

  video.isPublished = !video.isPublished;
  await video.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new Apiresponse(200, video, "Publish status changed successfully"));
});

const addToWatchHistory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Apierror(400, "Invalid video id");
  }

  // 1 Remove if already exists
  await User.findByIdAndUpdate(req.user._id, { $pull: { watchHistory: id } });

  // 2 Add to top
  await User.findByIdAndUpdate(req.user._id, {
    $push: {
      watchHistory: {
        $each: [id],
        $position: 0,
        $slice: 30,
      },
    },
  });

  next();
});

const getAllVideosbyUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Apierror(400, "Inavlid user id");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new Apierror(404, "no such user exists");
  }
  const videos = await Video.find({ owner: userId }).sort({ createdAt: -1 });

  return res
    .status(200)
    .json(
      new Apiresponse(200, videos, "all videos of user fetched successfully")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Apierror(400, "Invalid video id");
  }

  const video = await Video.findById(id);

  if (!video) {
    throw new Apierror(400, "Video not found");
  }

  // authority check -> more recommended
  if (!video.owner.equals(req.user?._id)) {
    throw new Apierror(403, "You are not allowed to update this video");
  }

  if (video.videoFile?.publicId) {
    const res1 = await deleteVideoFileFromCloudinary(video);
    // console.log(res1);
  }

  if (video.thumbnail?.publicId) {
    const res1 = await deleteFromCloudinary(video.thumbnail.publicId);
    // console.log(res1);
  }

  await video.deleteOne();

  return res
    .status(200)
    .json(new Apiresponse(200, null, "Video deleted successfully"));
});

export {
  postaVideo,
  getAllVideos,
  getVideoById,
  addToWatchHistory,
  getAllVideosbyUser,
  updateDetails,
  updateThumbnail,
  changePublishToggle,
  deleteVideo,
};
