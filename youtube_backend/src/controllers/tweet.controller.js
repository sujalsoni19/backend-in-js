import { Apierror } from "../utils/Apierror.js";
import { Apiresponse } from "../utils/Apiresponse.js";
import { Tweet } from "../models/tweet.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content) {
    throw new Apierror(400, "Content is required");
  }

  const tweet = await Tweet.create({
    content,
    owner: req.user?._id,
  });

  if (!tweet) {
    throw new Apierror(500, "error while creating tweet");
  }

  return res
    .status(201)
    .json(new Apiresponse(201, tweet, "Tweet created successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { tweetId } = req.params;

  if (!content) {
    throw new Apierror(400, "Content is required");
  }

  if (!mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new Apierror(400, "invalid tweetId");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new Apierror(404, "Tweet not found");
  }

  if (!tweet.owner.equals(req.user?._id)) {
    throw new Apierror(403, "You are not allowed to do this");
  }

  tweet.content = content;
  await tweet.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new Apiresponse(200, tweet, "tweet updated successfully"));
});

const getCurrentUsertweets = asyncHandler(async (req, res) => {
  // const tweets = await Tweet.find({owner: new mongoose.Types.ObjectId(req.user._id)})
  const tweets = await Tweet.find({ owner: req.user?._id });

  return res
    .status(200)
    .json(
      new Apiresponse(200, tweets, "Current user tweets fetched successfully")
    );
});

const getUsertweets = asyncHandler(async (req, res) => {
  const { username } = req.params;

  const user = await User.findOne({ username });

  if (!user) {
    throw new Apierror(404, "No user found");
  }

  const tweets = await Tweet.find({ owner: user._id });

  return res
    .status(200)
    .json(
      new Apiresponse(
        200,
        tweets,
        "Given user's all tweets fetched successfully "
      )
    );
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new Apierror(400, "invalid tweetId");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new Apierror(404, "Tweet not found");
  }

  if (!tweet.owner.equals(req.user?._id)) {
    throw new Apierror(403, "You are not allowed to do this");
  }

  await tweet.deleteOne();

  return res
    .status(200)
    .json(new Apiresponse(200, null, "Tweet deleted successfully"));
});

export {
  createTweet,
  updateTweet,
  deleteTweet,
  getCurrentUsertweets,
  getUsertweets,
};
