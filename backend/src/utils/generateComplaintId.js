import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 1000 },
});

const Counter =
  mongoose.models.Counter || mongoose.model("Counter", counterSchema);

/**
 * Atomically generate the next unique complaint tracking ID (e.g., FMC-1001).
 */
export const generateComplaintId = async () => {
  const counter = await Counter.findByIdAndUpdate(
    "complaintId",
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );

  const number = counter.seq < 1001 ? 1001 : counter.seq;
  return `FMC-${number}`;
};
