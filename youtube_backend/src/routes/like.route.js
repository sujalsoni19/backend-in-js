import { Router } from "express";
import {
  toggleVideoLike,
  toggleTweetLike,
  toggleCommentLike,
  getAllLikedVideos,
} from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/").get(getAllLikedVideos);
router.route("/video/:videoId").post(toggleVideoLike);
router.route("/tweet/:tweetId").post(toggleTweetLike);
router.route("/comment/:commentId").post(toggleCommentLike);


export default router;
