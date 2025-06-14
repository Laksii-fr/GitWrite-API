import mongoose from "mongoose";

const GitRepoSchema = new mongoose.Schema({
    username: { type: String, required: true },
    repoUrl: { type: String, required: true, unique: true },
    readme: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("GitRepo", GitRepoSchema);