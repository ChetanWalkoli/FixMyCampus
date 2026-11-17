import mongoose from "mongoose";
import app from "./app.js";
import connectDB from "./config/db.js";
import env from "./config/env.js";

let server;

const shutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      console.log("HTTP server closed.");
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log("MongoDB connection closed.");
    }
    process.exit(0);
  } catch (error) {
    console.error("Error during graceful shutdown:", error.message);
    process.exit(1);
  }
};

const startServer = async () => {
  try {
    await connectDB();

    server = app.listen(env.port, () => {
      console.log(
        `FixMyCampus API listening on http://localhost:${env.port} (${env.nodeEnv})`
      );
    });
  } catch (error) {
    console.error("Failed to start FixMyCampus server:", error.message);
    process.exit(1);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServer();
