import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type TaskIdInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteTask(input: TaskIdInput): Promise<{ success: boolean }> {
  try {
    // First, check if the task exists
    const existingTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .execute();

    if (existingTask.length === 0) {
      throw new Error(`Task with ID ${input.id} not found`);
    }

    // Delete the task
    const result = await db.delete(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Task deletion failed:', error);
    throw error;
  }
}