import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type TaskIdInput } from '../schema';
import { deleteTask } from '../handlers/delete_task';
import { eq } from 'drizzle-orm';

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing task', async () => {
    // Create a test task first
    const createResult = await db.insert(tasksTable)
      .values({
        title: 'Task to Delete',
        description: 'This task will be deleted',
        completed: false
      })
      .returning()
      .execute();

    const taskId = createResult[0].id;
    const input: TaskIdInput = { id: taskId };

    // Delete the task
    const result = await deleteTask(input);

    // Verify the result
    expect(result.success).toBe(true);

    // Verify the task is actually deleted from database
    const deletedTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(deletedTask).toHaveLength(0);
  });

  it('should throw error when task does not exist', async () => {
    const nonExistentId = 99999;
    const input: TaskIdInput = { id: nonExistentId };

    // Attempt to delete non-existent task should throw error
    await expect(deleteTask(input)).rejects.toThrow(/Task with ID 99999 not found/i);
  });

  it('should handle task with null description', async () => {
    // Create a test task with null description
    const createResult = await db.insert(tasksTable)
      .values({
        title: 'Task with null description',
        description: null,
        completed: true
      })
      .returning()
      .execute();

    const taskId = createResult[0].id;
    const input: TaskIdInput = { id: taskId };

    // Delete the task
    const result = await deleteTask(input);

    // Verify the result
    expect(result.success).toBe(true);

    // Verify the task is actually deleted from database
    const deletedTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(deletedTask).toHaveLength(0);
  });

  it('should delete task regardless of completion status', async () => {
    // Create two test tasks - one completed, one not
    const createResults = await db.insert(tasksTable)
      .values([
        {
          title: 'Completed Task',
          description: 'This task is completed',
          completed: true
        },
        {
          title: 'Incomplete Task',
          description: 'This task is not completed',
          completed: false
        }
      ])
      .returning()
      .execute();

    const completedTaskId = createResults[0].id;
    const incompleteTaskId = createResults[1].id;

    // Delete both tasks
    const completedResult = await deleteTask({ id: completedTaskId });
    const incompleteResult = await deleteTask({ id: incompleteTaskId });

    // Verify both deletions succeeded
    expect(completedResult.success).toBe(true);
    expect(incompleteResult.success).toBe(true);

    // Verify both tasks are deleted from database
    const remainingTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, completedTaskId))
      .execute();

    const remainingTasks2 = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, incompleteTaskId))
      .execute();

    expect(remainingTasks).toHaveLength(0);
    expect(remainingTasks2).toHaveLength(0);
  });

  it('should not affect other tasks when deleting one', async () => {
    // Create multiple test tasks
    const createResults = await db.insert(tasksTable)
      .values([
        {
          title: 'Task 1',
          description: 'First task',
          completed: false
        },
        {
          title: 'Task 2',
          description: 'Second task',
          completed: true
        },
        {
          title: 'Task 3',
          description: 'Third task',
          completed: false
        }
      ])
      .returning()
      .execute();

    const taskToDeleteId = createResults[1].id; // Delete the middle task
    const input: TaskIdInput = { id: taskToDeleteId };

    // Delete one task
    const result = await deleteTask(input);
    expect(result.success).toBe(true);

    // Verify the specific task is deleted
    const deletedTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskToDeleteId))
      .execute();

    expect(deletedTask).toHaveLength(0);

    // Verify other tasks still exist
    const remainingTasks = await db.select()
      .from(tasksTable)
      .execute();

    expect(remainingTasks).toHaveLength(2);
    expect(remainingTasks[0].title).toBe('Task 1');
    expect(remainingTasks[1].title).toBe('Task 3');
  });
});