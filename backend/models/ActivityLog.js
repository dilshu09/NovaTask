import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'user_register',
        'user_verify',
        'user_login',
        'user_logout',
        'task_create',
        'task_update',
        'task_delete',
        'task_bulk_update',
        'voice_command',
        'settings_update',
        'profile_update',
      ],
    },
    details: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only log creation time
  }
);

export default mongoose.model('ActivityLog', ActivityLogSchema);
