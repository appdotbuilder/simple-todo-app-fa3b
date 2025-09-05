import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput, type CreateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

// Helper to create a test task
const createTestTask = async (taskData: CreateTaskInput = {
  title: 'Original Task',
  description: 'Original description'
}) => {
  const result = await db.insert(tasksTable)
    .values({
      title: taskData.title,
      description: taskData.description,
      completed: false
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update task title only', async () => {
    const originalTask = await createTestTask();
    
    const updateInput: UpdateTaskInput = {
      id: originalTask.id,
      title: 'Updated Title'
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(originalTask.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual(originalTask.description); // Should preserve original
    expect(result.completed).toEqual(originalTask.completed); // Should preserve original
    expect(result.created_at).toEqual(originalTask.created_at); // Should preserve original
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > originalTask.updated_at).toBe(true); // Should be updated
  });

  it('should update task description only', async () => {
    const originalTask = await createTestTask();
    
    const updateInput: UpdateTaskInput = {
      id: originalTask.id,
      description: 'Updated description'
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(originalTask.id);
    expect(result.title).toEqual(originalTask.title); // Should preserve original
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toEqual(originalTask.completed); // Should preserve original
    expect(result.created_at).toEqual(originalTask.created_at); // Should preserve original
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > originalTask.updated_at).toBe(true);
  });

  it('should update task completion status only', async () => {
    const originalTask = await createTestTask();
    
    const updateInput: UpdateTaskInput = {
      id: originalTask.id,
      completed: true
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(originalTask.id);
    expect(result.title).toEqual(originalTask.title); // Should preserve original
    expect(result.description).toEqual(originalTask.description); // Should preserve original
    expect(result.completed).toEqual(true);
    expect(result.created_at).toEqual(originalTask.created_at); // Should preserve original
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > originalTask.updated_at).toBe(true);
  });

  it('should update multiple fields at once', async () => {
    const originalTask = await createTestTask();
    
    const updateInput: UpdateTaskInput = {
      id: originalTask.id,
      title: 'Complete Rewrite',
      description: 'Completely new description',
      completed: true
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(originalTask.id);
    expect(result.title).toEqual('Complete Rewrite');
    expect(result.description).toEqual('Completely new description');
    expect(result.completed).toEqual(true);
    expect(result.created_at).toEqual(originalTask.created_at); // Should preserve original
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > originalTask.updated_at).toBe(true);
  });

  it('should set description to null', async () => {
    const originalTask = await createTestTask({
      title: 'Task with description',
      description: 'This will be removed'
    });
    
    const updateInput: UpdateTaskInput = {
      id: originalTask.id,
      description: null
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(originalTask.id);
    expect(result.title).toEqual(originalTask.title); // Should preserve original
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(originalTask.completed); // Should preserve original
    expect(result.created_at).toEqual(originalTask.created_at); // Should preserve original
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > originalTask.updated_at).toBe(true);
  });

  it('should update task in database', async () => {
    const originalTask = await createTestTask();
    
    const updateInput: UpdateTaskInput = {
      id: originalTask.id,
      title: 'Database Updated Title',
      completed: true
    };

    await updateTask(updateInput);

    // Verify the task was actually updated in the database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, originalTask.id))
      .execute();

    expect(tasks).toHaveLength(1);
    const dbTask = tasks[0];
    expect(dbTask.title).toEqual('Database Updated Title');
    expect(dbTask.description).toEqual(originalTask.description); // Should preserve original
    expect(dbTask.completed).toEqual(true);
    expect(dbTask.created_at).toEqual(originalTask.created_at); // Should preserve original
    expect(dbTask.updated_at).toBeInstanceOf(Date);
    expect(dbTask.updated_at > originalTask.updated_at).toBe(true);
  });

  it('should throw error for non-existent task', async () => {
    const updateInput: UpdateTaskInput = {
      id: 99999, // Non-existent task ID
      title: 'This should fail'
    };

    expect(updateTask(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should update only timestamp when no fields provided', async () => {
    const originalTask = await createTestTask();
    
    const updateInput: UpdateTaskInput = {
      id: originalTask.id
      // No fields to update, only timestamp should change
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(originalTask.id);
    expect(result.title).toEqual(originalTask.title); // Should preserve original
    expect(result.description).toEqual(originalTask.description); // Should preserve original
    expect(result.completed).toEqual(originalTask.completed); // Should preserve original
    expect(result.created_at).toEqual(originalTask.created_at); // Should preserve original
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > originalTask.updated_at).toBe(true); // Should be updated
  });

  it('should handle task with null description', async () => {
    const originalTask = await createTestTask({
      title: 'Task without description',
      description: null
    });
    
    const updateInput: UpdateTaskInput = {
      id: originalTask.id,
      title: 'Updated title for null desc task'
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(originalTask.id);
    expect(result.title).toEqual('Updated title for null desc task');
    expect(result.description).toBeNull(); // Should remain null
    expect(result.completed).toEqual(originalTask.completed);
    expect(result.created_at).toEqual(originalTask.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > originalTask.updated_at).toBe(true);
  });
});