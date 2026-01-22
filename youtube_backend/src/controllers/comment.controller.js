import { asyncHandler } from "../utils/asyncHandler.js";
import { Apierror } from "../utils/Apierror.js";
import { Apiresponse } from "../utils/Apiresponse.js";
import { Comment } from "../models/comment.model.js";
import mongoose from "mongoose";

const createComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;

  if (!content) {
    throw new Apierror(400, "Content is required");
  }

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new Apierror(400, "VideoId is not valid");
  }

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user?._id,
  });

  if (!comment) {
    throw new error(500, " error while creating comment");
  }

  return res
    .status(201)
    .json(new Apiresponse(201, comment, "Comment created successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { videoId, commentId } = req.params;
  const { content } = req.body;

  if (!content) {
    throw new Apierror(400, "Content is required");
  }

  if (
    !mongoose.Types.ObjectId.isValid(videoId) ||
    !mongoose.Types.ObjectId.isValid(commentId)
  ) {
    throw new Apierror(400, "Id is not valid");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new Apierror(404, "No comment found");
  }

  if (!comment.video.equals(videoId)) {
    throw new Apierror(400, "Comment does not belong to this video");
  }

  if (!comment.owner.equals(req.user._id)) {
    throw new Apierror(403, "You are not allowed to update comments");
  }

  comment.content = content;
  await comment.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new Apiresponse(200, comment, "comment updated successfully"));
});

const getAllComments = asyncHandler(async(req, res) => {

    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new Apierror(400, "invalid video id")
    }

    // will work but manual pagination
    // const comments = await Comment.find({video: videoId}).populate("owner","username avatar")

    const pipeline = Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
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
                            fullName: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: { $first: "$owner" }
            }
        },
        {
            $sort: {createdAt: -1}
        },
    ])

    const result = await Comment.aggregatePaginate(pipeline,{
        page: Number(page),
        limit: Number(limit)
    })

    return res
    .status(200)
    .json(new Apiresponse(200, result, "all comments fetch successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
  const { videoId, commentId } = req.params;

  if (
    !mongoose.Types.ObjectId.isValid(videoId) ||
    !mongoose.Types.ObjectId.isValid(commentId)
  ) {
    throw new Apierror(400, "Id is not valid");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new Apierror(404, "No comment found");
  }

  if (!comment.video.equals(videoId)) {
    throw new Apierror(400, "Comment does not belong to this video");
  }

  if (!comment.owner.equals(req.user._id)) {
    throw new Apierror(403, "You are not allowed to update comments");
  }

  await comment.deleteOne();

  return res
  .status(200)
  .json(new Apiresponse(200, null, "comment deleted successfully"))
});

export { createComment, updateComment, deleteComment, getAllComments };
