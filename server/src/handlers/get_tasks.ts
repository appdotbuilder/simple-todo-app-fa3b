import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type Task } from '../schema';
import { desc } from 'drizzle-orm';

export async function getTasks(): Promise<Task[]> {
  try {
    // Fetch all tasks ordered by created_at descending (newest first)
    const results = await db.select()
      .from(tasksTable)
      .orderBy(desc(tasksTable.created_at))
      .execute();

    // Return the results as they match the Task schema
    return results;
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    throw error;
  }
}