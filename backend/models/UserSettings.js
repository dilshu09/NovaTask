import mongoose from 'mongoose';

const UserSettingsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'dark',
    },
    highContrast: {
      type: Boolean,
      default: false,
    },
    reducedMotion: {
      type: Boolean,
      default: false,
    },
    voiceEnabled: {
      type: Boolean,
      default: true,
    },
    voiceWakePhrase: {
      type: String,
      default: 'Hey Nova',
    },
    voiceSpeed: {
      type: Number,
      default: 1.0, // multiplier
    },
    voicePitch: {
      type: Number,
      default: 1.0,
    },
    members: {
      type: [
        {
          name: { type: String, default: '' },
          email: { type: String, required: true },
          avatar: { type: String, default: null },
          role: { type: String, enum: ['owner', 'admin', 'editor', 'viewer'], default: 'editor' },
          status: { type: String, enum: ['active', 'invited', 'inactive'], default: 'active' }
        }
      ],
      default: []
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('UserSettings', UserSettingsSchema);
