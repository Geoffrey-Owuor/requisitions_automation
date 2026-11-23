import { Pool, QueryResultRow } from "pg";
import { config } from "@/lib/config";

// TypeScript hack to allow global assignment
declare global {
  var postgresPool: Pool | undefined;
}

let productionPool: Pool | undefined;

// Created on first use, not at import, so a missing DATABASE_* variable fails
// the query that needs it (naming the variable) rather than the whole build.
function getPool(): Pool {
  if (config.isProduction) {
    productionPool ??= createPool();
    return productionPool;
  }
  // In development reuse one pool across hot reloads
  global.postgresPool ??= createPool();
  return global.postgresPool;
}

function createPool() {
  return new Pool({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name,
    port: config.database.port,
    max: 100, //maximum of 100 open connection threads
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
  });
}

// 2. Export the pool instance directly (for manual advanced usage). A proxy
// so importing it doesn't create the pool.
const pool = new Proxy({} as Pool, {
  get(_target, property) {
    const target = getPool();
    const value = Reflect.get(target, property, target);
    return typeof value === "function" ? value.bind(target) : value;
  },
});

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
