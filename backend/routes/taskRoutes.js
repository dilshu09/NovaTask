import express from 'express';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  bulkTasksAction,
  getAISuggestions,
} from '../controllers/taskController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply protect middleware to all task routes
router.use(protect);

router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/bulk')
  .post(bulkTasksAction);

router.route('/ai-suggest')
  .get(getAISuggestions);

router.route('/:id')
  .put(updateTask)
  .delete(deleteTask);

export default router;
