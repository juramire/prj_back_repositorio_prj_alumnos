import express from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { listCiclos } from './ciclos.service.js';

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const items = await listCiclos(req.query);
    res.json(items);
  })
);

export default router;
