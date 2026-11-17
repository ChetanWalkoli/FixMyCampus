import multer from "multer";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      const err = new Error("Only JPEG, PNG, and WebP images are allowed");
      err.statusCode = 400;
      return cb(err);
    }
    cb(null, true);
  },
});

/**
 * Inspect file magic bytes to ensure uploaded buffer is genuinely JPEG, PNG, or WebP.
 */
const hasValidImageSignature = (buffer) => {
  if (!buffer || buffer.length < 12) return false;

  // JPEG: FF D8 FF
  const isJpeg =
    buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;

  // WebP: "RIFF" .... "WEBP"
  const isWebp =
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP";

  return isJpeg || isPng || isWebp;
};

export const uploadSingleImage = (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "Image size cannot exceed 5 MB",
        });
      }
      return res.status(err.statusCode || 400).json({
        success: false,
        message: err.message || "Invalid file upload",
      });
    }

    if (req.file && !hasValidImageSignature(req.file.buffer)) {
      return res.status(400).json({
        success: false,
        message: "Uploaded file content is not a valid JPEG, PNG, or WebP image",
      });
    }

    next();
  });
};
