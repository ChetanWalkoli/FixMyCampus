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

// Security headers
app.use(helmet());

// Credentials-enabled CORS for the configured frontend origin
app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
);

// Request logging
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

// Body & cookie parsers
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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
