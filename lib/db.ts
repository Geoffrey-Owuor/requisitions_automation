import { Pool, QueryResultRow } from "pg";

const poolConfig = {
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  port: parseInt(process.env.DATABASE_PORT || "5432"), // Default standard Postgres port
  max: 100, //maximum of 100 open connection threads
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
};

// Singleton pattern to ensure only one pool is created in development
let pool: Pool;

// TypeScript hack to allow global assignment
declare global {
  var postgresPool: Pool | undefined;
}

if (process.env.NODE_ENV === "production") {
  pool = new Pool(poolConfig);
} else {
  // In development check if global pool already exists
  if (!global.postgresPool) {
    global.postgresPool = new Pool(poolConfig);
  }
  pool = global.postgresPool;
}

// 2. Export the pool instance directly (for manual advanced usage)
export { pool };

// 1. Define a strict type for valid SQL parameters
type SQLPrimitive = string | number | boolean | null | undefined | Date;

export async function query<T extends QueryResultRow>(
  text: string,
  params?: SQLPrimitive[],
) {
  const client = await pool.connect();
  try {
    const result = await client.query<T>(text, params);
    return result.rows;
  } finally {
    client.release();
  }
}
