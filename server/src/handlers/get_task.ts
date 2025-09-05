import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type TaskIdInput, type Task } from '../schema';
import { eq } from 'drizzle-orm';

export async function getTask(input: TaskIdInput): Promise<Task> {
  try {
    // Query the database for the task with the given ID
    const result = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .execute();

    // Check if task exists
    if (result.length === 0) {
      throw new Error(`Task with ID ${input.id} not found`);
    }

    // Return the first (and only) task
    return result[0];
  } catch (error) {
    console.error('Get task failed:', error);
    throw error;
  }
}