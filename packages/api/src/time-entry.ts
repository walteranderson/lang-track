import { TimeEntry, validateTimeEntry } from "@lang-track/shared";
import { err, ok } from "./result";

export async function createTimeEntry(env: Env, entry: TimeEntry) {
  try {
    const now = new Date().toISOString();
    const query = `
      INSERT INTO time_entries(user_id, start_time, end_time, description, created_at, updated_at)
      VALUES (?, ?, ?, ?)
      RETURNING id
    `;
    const { id } = await env.DB.prepare(query)
      .bind(
        entry.userId,
        entry.startTime,
        entry.endTime,
        entry.description,
        now,
        now,
      )
      .first<{ id: number }>();

    const timeEntry = validateTimeEntry({
      id,
      ...entry,
    });
    return ok(timeEntry);
  } catch (error) {
    return err(error as Error);
  }
}
