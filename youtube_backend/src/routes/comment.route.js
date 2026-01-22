import { Router } from "express";
import { createComment, updateComment, deleteComment, getAllComments } from "../controllers/comment.controller.js";
import  { verifyJWT }  from "../middlewares/auth.middleware.js";

const router = Router({ mergeParams: true });

router.use(verifyJWT)

router.route("/").post(createComment)
router.route("/:commentId").patch(updateComment)
router.route("/").get(getAllComments)
router.route("/:commentId").delete(deleteComment)

export default router;