import { asyncHandler } from "../utils/asyncHandler.js";
import { Apierror } from "../utils/Apierror.js";
import { Apiresponse } from "../utils/Apiresponse.js";
import { Video } from "../models/video.model.js";
import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { User } from "../models/user.model.js";

const getUserStats = asyncHandler(async (req, res) => {
  const totalViews = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $group: {
        _id: null,
        totalViews: { $sum: "$views" },
      },
    },
  ]);

  const totalSubscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $count: "totalSubscribers",
    },
  ]);

  const totalVideos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $count: "totalVideos",
    },
  ]);

  const result = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $addFields: {
        likeCount: { $size: "$likes" },
      },
    },
    {
      $group: {
        _id: null,
        totalLikes: { $sum: "$likeCount" },
      },
    },
  ]);

  const stats = {
    viewCount: totalViews[0]?.totalViews || 0,
    subscriberCount: totalSubscribers[0]?.totalSubscribers || 0,
    likeCount: result[0]?.totalLikes || 0,
    videoCount: totalVideos[0]?.totalVideos || 0,
  };

  return res
    .status(200)
    .json(new Apiresponse(200, stats, "user stats fetched successfully"));
});

const getMyVideos = asyncHandler(async (req, res) => {
  const videos = await Video.find({
    owner: req.user._id,
  }).sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new Apiresponse(200, videos, "Your videos fetched successfully"));
});

export { getUserStats, getMyVideos };
