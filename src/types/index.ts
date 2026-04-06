export type { Database, Json } from './database';

export interface ActionResult<T> {
  data: T | null;
  error: string | null;
}
