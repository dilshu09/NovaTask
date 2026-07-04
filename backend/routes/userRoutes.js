import express from 'express';
import {
  updateProfile,
  updateSettings,
  updateMembers,
  getActivityLogs,
  getNotifications,
  markNotificationRead,
  deleteNotification,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply protect middleware to all user routes
router.use(protect);

router.put('/profile', updateProfile);
router.put('/settings', updateSettings);
router.put('/settings/members', updateMembers);
router.get('/activities', getActivityLogs);

router.route('/notifications')
  .get(getNotifications);

router.route('/notifications/:id')
  .delete(deleteNotification);

router.put('/notifications/:id/read', markNotificationRead);

export default router;
