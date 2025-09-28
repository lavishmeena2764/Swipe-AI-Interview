import multer from "multer";

export const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, '/tmp'), 
  filename: (_req, file, cb) => {
    const safe = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
    cb(null, safe);
  },
});

export const upload = multer({ storage });