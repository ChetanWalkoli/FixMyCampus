import mongoose from "mongoose";
import Notification from "../models/Notification.js";

export const createNotification = async ({
  recipient,
  complaint,
  title,
  message,
  type,
}) => {
  if (!recipient) return null;
  if (
    mongoose.connection.readyState !== 1 &&
    process.env.NODE_ENV === "test" &&
    !Notification.create?.mock
  ) {
    return null;
  }
  try {
    return await Notification.create({
      recipient,
      complaint,
      title,
      message,
      type,
    });
  } catch (error) {
    console.error("Failed to create notification:", error.message);
    return null;
  }
};
