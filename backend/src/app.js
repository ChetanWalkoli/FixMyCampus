import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import env from "./config/env.js";
import apiRoutes from "./routes/index.js";
import {
  notFoundHandler,
  errorHandler,
} from "./middleware/errorMiddleware.js";

const app = express();

// Trust first proxy (required for Render / reverse proxies for rate-limit & secure cookies)
app.set("trust proxy", 1);

// Security headers
app.use(helmet());

// Credentials-enabled CORS for configured frontend origin(s)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser / same-origin requests without an Origin header
      if (!origin) return callback(null, true);
      const normalized = origin.replace(/\/+$/, "");
      if (env.allowedOrigins.includes(normalized)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

// Request logging
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

// Body & cookie parsers
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Strip MongoDB operator keys ($...) from request body to prevent NoSQL operator injection
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== "object") return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key.includes(".")) {
      delete obj[key];
    } else {
      sanitizeObject(obj[key]);
    }
  }
};

app.use((req, _res, next) => {
  sanitizeObject(req.body);
  next();
});

// Basic rate limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

app.use("/api/v1", apiLimiter, apiRoutes);

// 404 & global error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
