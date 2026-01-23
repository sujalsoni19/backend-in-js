import { Router } from "express";
import { getUserStats, getMyVideos } from "../controllers/dashboard.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/stats").get(getUserStats);
router.route("/my-videos").get(getMyVideos);    

export default router;