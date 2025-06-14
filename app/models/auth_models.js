import mongoose from "mongoose";
import bcrypt from "bcrypt";

// Define schema
const signupSchema = new mongoose.Schema({
  subId: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  recoveryToken: { type: String, required: true, unique: true },
}, { timestamps: true });

// Bycrpt password before saving
signupSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next(); // Only hash if password is modified
  try {
    const salt = await bcrypt.genSalt(10); // You can adjust salt rounds
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});


// Create and export model
const User = mongoose.model('User', signupSchema);
module.exports = { User };