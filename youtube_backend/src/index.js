// require('dotenv').config({path: './env'})

import "dotenv/config";

// import dotenv from "dotenv";
// dotenv.config({
//   path: "./.env",
// });



import connectDB from "./db/index.js";
import { app } from "./app.js"

const port = process.env.PORT || 8000

connectDB()
.then(() => {
    app.listen(port, () => {
        console.log(`server is running on port:${port}`)
    })
})
.catch((error) => {
    console.log("mongodb connection failed",error)
})


/*

import mongoose from 'mongoose';
import {DB_NAME} from "./constants.js";

import express from "express";
const app = express()


(async () => {
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${
            DB_NAME}`)
            // app.on("error", (error) => {
            //     console.log("ERROR: ",error);
            //     throw error
            // })

            app.listen(process.env.PORT, () => {
                console.log(`app is listening on port ${process.env.PORT}`)
            })

    }catch(error){
        console.error("ERROR: ",error)
        throw error
    }
})()

*/




