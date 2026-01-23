import { asyncHandler } from "../utils/asyncHandler.js";
import { Apierror } from "../utils/Apierror.js";
import { Apiresponse } from "../utils/Apiresponse.js";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";
import mongoose from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { Comment } from "../models/comment.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new Apierror(400, "Invalid videoId");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new Apierror(404, "Video not found");
  }

  const like = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  });

  if (like) {
    await like.deleteOne();
    return res
      .status(200)
      .json(new Apiresponse(200, null, "Like removed successfully"));
  }

  const newLike = await Like.create({
    video: videoId,
    likedBy: req.user._id,
  });

  if (!newLike) {
    throw new Apierror(500, "Like could not be created");
  }

  return res
    .status(201)
    .json(new Apiresponse(201, newLike, "Like added successfully"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new Apierror(400, "invalid tweetId");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new Apierror(404, "tweet not found");
  }

  const like = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user._id,
  });

  if (like) {
    await like.deleteOne();
    return res
      .status(200)
      .json(new Apiresponse(200, null, "like removed successfully"));
  }

  const newLike = await Like.create({
    tweet: tweetId,
    likedBy: req.user._id,
  });

  if (!newLike) {
    throw new Apierror(500, "Like could not be created");
  }

  return res
    .status(201)
    .json(new Apiresponse(201, newLike, "like created successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new Apierror(400, "invalid commentId");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new Apierror(404, "comment not found");
  }

  const like = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id,
  });

  if (like) {
    await like.deleteOne();
    return res
      .status(200)
      .json(new Apiresponse(200, null, "like removed successfully"));
  }

  const newLike = await Like.create({
    comment: commentId,
    likedBy: req.user._id,
  });

  if (!newLike) {
    throw new Apierror(500, "Like could not be created");
  }

  return res
    .status(201)
    .json(new Apiresponse(201, newLike, "like created successfully"));
});

const getAllLikedVideos = asyncHandler(async (req, res) => {
  const result = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user._id),
        video: { $exists: true, $ne: null },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
      },
    },
    { $unwind: "$video" },
    {
      $facet: {
        videos: [{ $sort: { createdAt: -1 } }],
        totalCount: [{ $count: "count" }],
      },
    },
  ]);

  return res.status(200).json(
    new Apiresponse(
      200,
      {
        videos: result[0].videos,
        totalLikedVideos: result[0].totalCount[0]?.count || 0
      },
      "Liked videos fetched successfully"
    )
  );
});

export {
  toggleVideoLike,
  toggleTweetLike,
  toggleCommentLike,
  getAllLikedVideos,
};
