import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
      lowercase: true,
      trim: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    googleId: {
      type: String,
      sparse: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      code: String,
      expiresAt: Date,
    },
    refreshTokens: [String], // Array for multiple devices
  },
  {
    timestamps: true,
  }
);

// Cascade delete user data (settings, tasks, activity logs, notifications)
UserSchema.pre(['deleteOne', 'findOneAndDelete'], { document: true, query: true }, async function (next) {
  try {
    let userId;
    let email;

    if (this.getQuery) {
      const query = this.getQuery();
      userId = query._id;
      if (userId) {
        const user = await mongoose.model('User').findById(userId);
        if (user) {
          email = user.email;
        }
      }
    } else {
      userId = this._id;
      email = this.email;
    }

    if (userId) {
      const taskQuery = {
        $or: [
          { user: userId }
        ]
      };
      if (email) {
        taskQuery.$or.push({ 'assignee.email': email.toLowerCase() });
        taskQuery.$or.push({ 'assignees.email': email.toLowerCase() });
      }
      await mongoose.model('Task').deleteMany(taskQuery);

      await mongoose.model('UserSettings').deleteMany({ user: userId });
      await mongoose.model('ActivityLog').deleteMany({ user: userId });
      await mongoose.model('Notification').deleteMany({ user: userId });
    }
    next();
  } catch (err) {
    next(err);
  }
});

export default mongoose.model('User', UserSchema);
