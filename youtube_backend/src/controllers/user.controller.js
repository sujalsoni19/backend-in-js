import { asyncHandler } from "../utils/asyncHandler.js";
import { Apierror } from "../utils/Apierror.js";
import { Apiresponse } from "../utils/Apiresponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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

  const coverImage = coverImgLocalPath        // better version
    ? await uploadOnCloudinary(coverImgLocalPath)
    : null;

  if (!avatar) {
    throw new Apierror(400, "Avatar upload failed");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
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

export { registerUser };
