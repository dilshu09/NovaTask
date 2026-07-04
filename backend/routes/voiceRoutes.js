import express from 'express';
import { processVoiceCommand } from '../controllers/voiceController.js';

const router = express.Router();

router.post('/process', processVoiceCommand);

export default router;
