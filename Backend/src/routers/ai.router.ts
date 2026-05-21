import { Router } from 'express';
import { checkProfanity } from '../modules/AI.controller/AIcheck.controller';
import { chatWithAI } from '../modules/AI.controller/chat.controller';

const router = Router();

router.post('/check-profanity', checkProfanity);
router.post('/chat', chatWithAI);

export default router;
