const mongoose = require('mongoose');

const adminLockoutSchema = new mongoose.Schema(
  {
    identifier: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    failedAttempts: {
      type: Number,
      default: 0,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
    lastAttemptAt: {
      type: Date,
      default: Date.now,
    },
    history: [
      {
        timestamp: { type: Date, default: Date.now },
        ip: String,
        success: Boolean,
        userAgent: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.AdminLockout ||
  mongoose.model('AdminLockout', adminLockoutSchema);
