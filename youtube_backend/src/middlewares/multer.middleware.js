import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // not recommended to store file via og filename
  },
});

export const upload = multer({
  storage,
});

/*
        Multer  →  fs  →  Cloudinary

            Browser uploads file
            ↓
            Multer reconstructs file
            ↓
            Temp file saved on disk
            ↓
            Cloudinary uploads file
            ↓
            fs deletes temp file
            ↓
            Response sent to user

*/
