import { asyncHandler } from "../utils/asyncHandler.js";
import { Apierror } from "../utils/Apierror.js";
import { Apiresponse } from "../utils/Apiresponse.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

export const normalizeImage = (file) => ({
  url: file?.secure_url,
  publicId: file?.public_id,
});

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new Apierror(500, "something went wrong while generating tokens");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to clodinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  const { fullName, email, username, password } = req.body;
  //   console.log(req.body);

  // if(fullName === ""){
  //     throw new ApiError(400,"fullname is required")
  // }
  // keep on writing separate ifs for evrey field

  //        OR

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new Apierror(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new Apierror(409, "user with email or username already exists");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImgLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new Apierror(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  //const coverImage = await uploadOnCloudinary(coverImgLocalPathLocalPath);

  const coverImage = coverImgLocalPath // better version
    ? await uploadOnCloudinary(coverImgLocalPath)
    : null;

  if (!avatar) {
    throw new Apierror(400, "Avatar upload failed");
  }

  const user = await User.create({
    fullName,
    avatar: normalizeImage(avatar),
    coverImage: coverImage ? normalizeImage(coverImage) : "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new Apierror(500, "something went wrong while registering a user");
  }

  return res
    .status(201)
    .json(new Apiresponse(200, createdUser, "user is registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // take data from user(email,password)
  // (valiadate)-> not empty
  // match it against the db
  // if unsuccessful => throw error
  // if successful => generate access and refresh token
  // send token to the user via cookie

  const { email, username, password } = req.body;

  if (!(username || email)) {
    throw new Apierror(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new Apierror(404, "user doesn't exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new Apierror(404, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new Apiresponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

//The server is stateless and does not know who you are unless the request carries an identifier,
// and cookies are the browser’s automatic way of sending that identifier.

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new Apiresponse(200, {}, "User logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new Apierror(401, "Unauthorized request");
  }

  console.log("incomingRefreshToken:", incomingRefreshToken);

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new Apierror(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new Apierror(401, "Refresh token is expired or used");
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new Apiresponse(
          200,
          {
            accessToken,
            newRefreshToken,
          },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new Apierror(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldpassword, newpassword } = req.body;

  if ([oldpassword, newpassword].some((field) => field?.trim() === "")) {
    throw new Apierror(400, "All fields are required");
  }

  const user = await User.findById(req.user?._id);

  const isMatch = await user.isPasswordCorrect(oldpassword);

  if (!isMatch) {
    throw new Apierror(404, "Invalid old password");
  }

  user.password = newpassword;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new Apiresponse(200, {}, "password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new Apiresponse(200, req.user, "current user fetched successfully "));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if ([fullName, email].some((field) => field?.trim() === "")) {
    throw new Apierror(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new Apiresponse(200, user, "Account details changed successfully"));
});

// file should be updated separately

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new Apierror(400, "Avatar file is misssing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new Apierror(400, "Error while uploading avatar");
  }

  const user = await User.findById(req.user?._id);

  const oldPublicId = user.avatar?.publicId;

  // Update
  user.avatar = normalizeImage(avatar);
  await user.save({ validateBeforeSave: false });

  // Delete old avatar AFTER successful save
  if (oldPublicId) {
    const res1 = await deleteFromCloudinary(oldPublicId);
    console.log(res1);
  }

  return res
    .status(200)
    .json(new Apiresponse(200, user, "Avatar updated successfully"));
});

const updateUsercoverimg = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new Apierror(400, "coverimg file is misssing");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new Apierror(400, "Error while uploading coverImage");
  }

  const user = await User.findById(req.user?._id);

  const oldPublicId = user.coverImage?.publicId;

  // Update
  user.avatar = normalizeImage(coverImage);
  await user.save({ validateBeforeSave: false });

  // Delete old coverImage AFTER successful save
  if (oldPublicId) {
    const res1 = await deleteFromCloudinary(oldPublicId);
    console.log(res1);
  }

  return res
    .status(200)
    .json(new Apiresponse(200, user, "coverImage updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new Apierror(400, "Username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new Apierror(404, "channel doesn't exist");
  }

  return res
    .status(200)
    .json(
      new Apiresponse(200, channel[0], "User channel fetched successfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
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
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new Apiresponse(
        200,
        user[0]?.watchHistory || [],
        "Watch History fetched successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUsercoverimg,
  getUserChannelProfile,
  getWatchHistory,
};
