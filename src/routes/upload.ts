import { Router } from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = crypto.randomBytes(16).toString("hex") + ext;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    cb(null, allowed.includes(file.mimetype));
  },
});

router.post("/", authenticate, upload.single("file"), (req: AuthRequest, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No valid image uploaded" });
  }

  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
  const url = `${baseUrl}/uploads/${req.file.filename}`;

  res.json({ url });
});

export default router;
