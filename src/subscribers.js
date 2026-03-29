import { getActiveSubscribers } from './db.js';

// Fetches active subscribers from PostgreSQL on each poll cycle
export async function getSubscribers() {
  return getActiveSubscribers();
}
