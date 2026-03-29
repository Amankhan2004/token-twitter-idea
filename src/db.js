import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS subscribers (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL UNIQUE,
      handle VARCHAR(64) NOT NULL,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log('[DB] Schema initialized');
}

export async function getActiveSubscribers() {
  const { rows } = await pool.query(
    'SELECT user_id AS "userId", handle FROM subscribers WHERE active = true ORDER BY created_at'
  );
  return rows;
}

export async function addSubscriber(userId, handle) {
  const { rows } = await pool.query(
    `INSERT INTO subscribers (user_id, handle)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET handle = $2, active = true
     RETURNING *`,
    [userId, handle]
  );
  return rows[0];
}

export async function removeSubscriber(userId) {
  const { rowCount } = await pool.query(
    'UPDATE subscribers SET active = false WHERE user_id = $1',
    [userId]
  );
  return rowCount > 0;
}

export async function listSubscribers() {
  const { rows } = await pool.query(
    'SELECT id, user_id AS "userId", handle, active, created_at AS "createdAt" FROM subscribers ORDER BY created_at'
  );
  return rows;
}

export { pool };
