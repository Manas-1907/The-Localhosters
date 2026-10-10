import { Router } from 'express';
import { z } from 'zod';
import { wrap } from '../middleware/error.js';
import { translateTexts } from '../utils/gemini.js';

const router = Router();

const translateSchema = z.object({
  texts: z.union([z.string(), z.array(z.string())]),
  targetLang: z.string().default('hi')
});

router.post('/', wrap(async (req, res) => {
  const { texts, targetLang } = translateSchema.parse(req.body);
  const result = await translateTexts(texts, targetLang);
  return res.json({ result, targetLang });
}));

export default router;
