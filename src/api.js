import express from 'express';
import { addSubscriber, removeSubscriber, listSubscribers } from './db.js';

const router = express.Router();
router.use(express.json());

// GET /api/subscribers — list all subscribers
router.get('/subscribers', async (req, res) => {
  try {
    const subs = await listSubscribers();
    res.json(subs);
  } catch (err) {
    console.log(`[API] Error listing subscribers: ${err.message}`);
    res.status(500).json({ error: 'Failed to list subscribers' });
  }
});

// POST /api/subscribers — add a subscriber { userId, handle }
router.post('/subscribers', async (req, res) => {
  const { userId, handle } = req.body;
  if (!userId || !handle) {
    return res.status(400).json({ error: 'userId and handle are required' });
  }
  try {
    const sub = await addSubscriber(userId, handle);
    console.log(`[API] Added subscriber @${handle} (${userId})`);
    res.status(201).json(sub);
  } catch (err) {
    console.log(`[API] Error adding subscriber: ${err.message}`);
    res.status(500).json({ error: 'Failed to add subscriber' });
  }
});

// DELETE /api/subscribers/:userId — deactivate a subscriber
router.delete('/subscribers/:userId', async (req, res) => {
  try {
    const removed = await removeSubscriber(req.params.userId);
    if (!removed) {
      return res.status(404).json({ error: 'Subscriber not found' });
    }
    console.log(`[API] Removed subscriber ${req.params.userId}`);
    res.json({ success: true });
  } catch (err) {
    console.log(`[API] Error removing subscriber: ${err.message}`);
    res.status(500).json({ error: 'Failed to remove subscriber' });
  }
});

export function createApi() {
  const app = express();
  app.use('/api', router);
  return app;
}
