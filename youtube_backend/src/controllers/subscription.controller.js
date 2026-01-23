import { asyncHandler } from "../utils/asyncHandler.js";
import { Apierror } from "../utils/Apierror.js";
import { Apiresponse } from "../utils/Apiresponse.js";
import { Subscription } from "../models/subscription.model.js";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new Apierror(400, "Invalid channelId");
  }

  const user = await User.findById(channelId);

  if (!user) {
    throw new Apierror(404, "no such channel found");
  }

  const subscription = await Subscription.findOne({
    subscriber: req.user._id,
    channel: channelId,
  });

  if (subscription) {
    await subscription.deleteOne();
    return res
      .status(200)
      .json(new Apiresponse(200, null, "subscription removed successfully"));
  }

  const newSubscription = await Subscription.create({
    subscriber: req.user._id,
    channel: channelId,
  });

  if (!newSubscription) {
    throw new Apierror(500, "error while creating subscription");
  }

  return res
    .status(201)
    .json(
      new Apiresponse(201, newSubscription, "subscription created successfully")
    );
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const result = await Subscription.aggregate([
    { $match: { channel: new mongoose.Types.ObjectId(req.user._id) } },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
        pipeline: [{ $project: { username: 1, fullName: 1, avatar: 1 } }],
      },
    },
    { $addFields: { subscriber: { $first: "$subscriber" } } },
    {
      $facet: {
        subscribers: [],
        totalCount: [{ $count: "count" }],
      },
    },
  ]);

  return res.status(200).json(
    new Apiresponse(
      200,
      {
        subscribers: result[0]?.subscribers || [],
        count: result[0]?.totalCount[0]?.count || 0,
      },
      "Subscribers fetched successfully"
    )
  );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const result = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channel",
        pipeline: [{ $project: { username: 1, fullName: 1, avatar: 1 } }],
      },
    },
    { $addFields: { channel: { $first: "$channel" } } },
    {
      $facet: {
        channels: [],
        totalCount: [{ $count: "count" }],
      },
    },
  ]);

  return res.status(200).json(
    new Apiresponse(
      200,
      {
        channels: result[0]?.channels || [],
        count: result[0]?.totalCount[0]?.count || 0,
      },
      "Channels fetched successfully"
    )
  );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
