import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const sql = neon(import.meta.env.VITE_DATABASE_URL);
import * as schema from "./schema"
export const db = drizzle({ client: sql },schema);

// const result = await db.execute('select 1');
