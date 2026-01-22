import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))

app.use(express.urlencoded({extended: true, limit: "16kb"}))

app.use(express.static("public"))

app.use(cookieParser())

//routes import

import userRouter from "./routes/user.route.js"

//routes declaration
//http://localhost:8000/api/v1/users/register
app.use("/api/v1/users",userRouter)


import videoRouter from "./routes/video.route.js"

app.use("/api/v1/videos",videoRouter)


import tweetRouter from "./routes/tweet.route.js"

app.use("/api/v1/tweets",tweetRouter)


import commentRouter from "./routes/comment.route.js"

app.use("/api/v1/videos/:videoId/comments", commentRouter);


import playlistRouter from "./routes/playlist.route.js"

app.use("/api/v1/playlists", playlistRouter);






export { app }