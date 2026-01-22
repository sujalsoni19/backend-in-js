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

  playlist.videos = videoId;
  await playlist.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new Apiresponse(200, playlist, "Video added successfully"));
});

const deleteVideoFromPlaylist = asyncHandler(async (req, res) => {
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

  playlist.videos = playlist.videos.filter(
    (video) => !video._id.equals(videoId)
  );
  await playlist.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new Apiresponse(200, playlist, "Video removed successfully"));
});

const updatePlaylist = asyncHandler(async(req, res) => {
    const { name, description } = req.body;
    const { playlistId } =req.params;

    if (!name || !description) {
    throw new Apierror(400, "Both fields are required");
  }

  if(!mongoose.Types.ObjectId.isValid(playlistId)){
    throw new Apierror(400, "invalid playlistId")
  }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
    throw new Apierror(404, "playlist not found");
  }

  if (!playlist.owner.equals(req.user?._id)) {
    throw new Apierror(401, "you are not authorized to do this");
  }

  playlist.name = name
  playlist.description = description

  await playlist.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new Apiresponse(200, playlist, "playlist updated successfully"));

})

// const getUserPlaylists = asyncHandler(async(req, res) => {

// })
