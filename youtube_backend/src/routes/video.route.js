import { Router } from "express";
import {
  postaVideo,
  getAllVideos,
  getVideoById,
  addToWatchHistory,
  getAllVideosbyUser,
  updateDetails,
  updateThumbnail,
  changePublishToggle,
  deleteVideo,
} from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/post-video").post(
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  postaVideo
);
router.route("/all-videos").get(getAllVideos);

router.route("/video/:id").get(addToWatchHistory, getVideoById);

router.route("/video/:id/details").patch(updateDetails);

router.route("/video/user/:userId").get(getAllVideosbyUser)

router
  .route("/video/:id/thumbnail")
  .patch(upload.single("thumbnail"), updateThumbnail);

router.route("/video/:id/publish").patch(changePublishToggle);

router.route("/video/:id").delete(deleteVideo);

export default router;
