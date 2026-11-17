import mongoose from "mongoose";
import env from "./env.js";

/**
 * Connect to MongoDB Atlas using Mongoose.
 * Fails fast if MONGODB_URI is missing or the connection cannot be established.
 */
const connectDB = async () => {
  if (!env.mongodbUri) {
    throw new Error(
      "MONGODB_URI is not defined. Please configure it in backend/.env"
    );
  }

  const conn = await mongoose.connect(env.mongodbUri, {
    dbName: "fixmycampus",
    serverSelectionTimeoutMS: 5000,
  });

  console.log(
    `MongoDB connected: ${conn.connection.host} (db: ${conn.connection.name})`
  );
  return conn;
};

export default connectDB;
