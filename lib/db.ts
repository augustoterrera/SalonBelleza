import { Pool } from "pg"

// Connection pool for PostgreSQL
// Set DATABASE_URL in your environment variables
// Format: postgresql://user:password@host:port/database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result.rows as T[]
  } finally {
    client.release()
  }
}

export async function queryOne<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows[0] || null
}

export async function execute(
  text: string,
  params?: unknown[]
): Promise<{ rowCount: number }> {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return { rowCount: result.rowCount || 0 }
  } finally {
    client.release()
  }
}

export async function transaction<T>(
  callback: (client: {
    query: <R = unknown>(text: string, params?: unknown[]) => Promise<R[]>
    queryOne: <R = unknown>(text: string, params?: unknown[]) => Promise<R | null>
    execute: (text: string, params?: unknown[]) => Promise<{ rowCount: number }>
  }) => Promise<T>
): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    const result = await callback({
      query: async <R = unknown>(text: string, params?: unknown[]) => {
        const res = await client.query(text, params)
        return res.rows as R[]
      },
      queryOne: async <R = unknown>(text: string, params?: unknown[]) => {
        const res = await client.query(text, params)
        return (res.rows[0] as R) || null
      },
      execute: async (text: string, params?: unknown[]) => {
        const res = await client.query(text, params)
        return { rowCount: res.rowCount || 0 }
      },
    })
    await client.query("COMMIT")
    return result
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

export default pool
