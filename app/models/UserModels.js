import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  githubId: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String },
  profileUrl: { type: String },
  avatarUrl: { type: String },
  accessToken: { type: String, required: true },
  credit_tokens: { type: Number, default: 5, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
