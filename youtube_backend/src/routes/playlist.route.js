import { Router } from "express";
import {
  createPlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  updatePlaylist,
  getUserPlaylists,
  getPlaylistbyId,
  deletePlaylist,
} from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

router.route("/")
  .post(createPlaylist)
  .get(getUserPlaylists);

router.route("/:playlistId")
  .get(getPlaylistbyId)
  .patch(updatePlaylist)
  .delete(deletePlaylist);

router.route("/:playlistId/videos/:videoId")
  .post(addVideoToPlaylist)
  .delete(removeVideoFromPlaylist);

export default router;

