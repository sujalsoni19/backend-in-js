import { asyncHandler } from "../utils/asyncHandler.js";
import { Apierror } from "../utils/Apierror.js";
import { Apiresponse } from "../utils/Apiresponse.js";
import { Playlist } from "../models/playlist.model.js";
import mongoose from "mongoose";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || !description) {
    throw new Apierror(400, "Both fields are required");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user._id,
  });

  if (!playlist) {
    throw new Apierror(500, "error creating playlist");
  }

  return res
    .status(201)
    .json(new Apiresponse(201, playlist, "Playlist created successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { videoId, playlistId } = req.params;

  if (
    !mongoose.Types.ObjectId.isValid(videoId) ||
    !mongoose.Types.ObjectId.isValid(playlistId)
  ) {
    throw new Apierror(400, "invalid id(s)");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new Apierror(404, "playlist not found");
  }

  if (!playlist.owner.equals(req.user?._id)) {
    throw new Apierror(401, "you are not authorized to do this");
  }

  if (playlist.videos.some((v) => v.equals(videoId))) {
    throw new Apierror(400, "Video already exists in playlist");
  }

  playlist.videos.push(videoId);

  await playlist.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new Apiresponse(200, playlist, "Video added successfully"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { videoId, playlistId } = req.params;

  if (
    !mongoose.Types.ObjectId.isValid(videoId) ||
    !mongoose.Types.ObjectId.isValid(playlistId)
  ) {
    throw new Apierror(400, "invalid id(s)");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new Apierror(404, "playlist not found");
  }

  if (!playlist.owner.equals(req.user?._id)) {
    throw new Apierror(403, "you are not authorized to do this");
  }

  playlist.videos = playlist.videos.filter((video) => !video.equals(videoId));

  await playlist.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new Apiresponse(200, playlist, "Video removed successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const { playlistId } = req.params;

  if (!name || !description) {
    throw new Apierror(400, "Both fields are required");
  }

  if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new Apierror(400, "invalid playlistId");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new Apierror(404, "playlist not found");
  }

  if (!playlist.owner.equals(req.user?._id)) {
    throw new Apierror(401, "you are not authorized to do this");
  }

  playlist.name = name;
  playlist.description = description;

  await playlist.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new Apiresponse(200, playlist, "playlist updated successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  // const playlists = Playlist.find({owner: req.user?._id}).populate("videos")

  const result = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
      },
    },
    {
      $addFields: {
        totalvideos: { $size: "$videos" },
      },
    },
    {
      $sort: { createdAt: -1 },
    },
  ]);

  return res
    .status(200)
    .json(new Apiresponse(200, result, "all playlists fetched successfully"));
});

const getPlaylistbyId = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new Apierror(400, "invalid playlistId");
  }

  const playlist = await Playlist.findById(playlistId).populate("videos");

  if (!playlist) {
    throw new Apierror(404, "playlist not found");
  }

  if (!playlist.owner.equals(req.user._id)) {
    throw new Apierror(403, "Not authorized");
  }

  return res
    .status(200)
    .json(new Apiresponse(200, playlist, "playlist fetched successfully"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new Apierror(400, "invalid playlistId");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new Apierror(404, "playlist not found");
  }

  if (!playlist.owner.equals(req.user?._id)) {
    throw new Apierror(401, "you are not authorized to do this");
  }

  await playlist.deleteOne();

  return res
    .status(200)
    .json(new Apiresponse(200, null, "playlist deleted successfully"));
});

export {
  createPlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  updatePlaylist,
  getUserPlaylists,
  getPlaylistbyId,
  deletePlaylist,
};
