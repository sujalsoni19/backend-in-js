import { Apierror } from "../utils/Apierror.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken || // for browsers
      req.header("Authorization")?.replace("Bearer ", ""); // for mobile apps/api clients

    if (!token) {
      throw new Apierror(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new Apierror(401, "Invalid Access Token");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new Apierror(404, error?.message || "Invalid Access Token");
  }
});
