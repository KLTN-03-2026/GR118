import { Router } from 'express';
import { checkProfanity } from '../modules/AI.controller/AIcheck.controller';

const router = Router();

router.post('/check-profanity', checkProfanity);

export default router;
