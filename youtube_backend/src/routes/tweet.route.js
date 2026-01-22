import { Router } from "express";
import {
  createTweet,
  updateTweet,
  deleteTweet,
  getCurrentUsertweets,
  getUsertweets,
} from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/tweet").post(createTweet);
router.route("/tweet/:tweetId").patch(updateTweet);
router.route("/tweet").get(getCurrentUsertweets);
router.route("/tweet/:username").get(getUsertweets);
router.route("/tweet/:tweetId").delete(deleteTweet);

export default router;
