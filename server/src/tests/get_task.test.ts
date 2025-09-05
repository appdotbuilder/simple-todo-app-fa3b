import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type TaskIdInput, type CreateTaskInput } from '../schema';
import { getTask } from '../handlers/get_task';

// Test data for creating prerequisite tasks
const testTaskInput: CreateTaskInput = {
  title: 'Test Task',
  description: 'A task for testing'
};

const testTaskWithNullDescription: CreateTaskInput = {
  title: 'Task with null description',
  description: null
};

describe('getTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve an existing task by ID', async () => {
    // Create a task first
    const insertResult = await db.insert(tasksTable)
      .values({
        title: testTaskInput.title,
        description: testTaskInput.description,
        completed: false
      })
      .returning()
      .execute();

    const createdTask = insertResult[0];
    
    // Test retrieving the task
    const input: TaskIdInput = { id: createdTask.id };
    const result = await getTask(input);

    // Verify all fields
    expect(result.id).toEqual(createdTask.id);
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A task for testing');
    expect(result.completed).toEqual(false);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should handle tasks with null description', async () => {
    // Create a task with null description
    const insertResult = await db.insert(tasksTable)
      .values({
        title: testTaskWithNullDescription.title,
        description: testTaskWithNullDescription.description,
        completed: false
      })
      .returning()
      .execute();

    const createdTask = insertResult[0];
    
    // Test retrieving the task
    const input: TaskIdInput = { id: createdTask.id };
    const result = await getTask(input);

    // Verify the description is properly null
    expect(result.id).toEqual(createdTask.id);
    expect(result.title).toEqual('Task with null description');
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(false);
  });

  it('should retrieve a completed task correctly', async () => {
    // Create a completed task
    const insertResult = await db.insert(tasksTable)
      .values({
        title: 'Completed Task',
        description: 'This task is done',
        completed: true
      })
      .returning()
      .execute();

    const createdTask = insertResult[0];
    
    // Test retrieving the task
    const input: TaskIdInput = { id: createdTask.id };
    const result = await getTask(input);

    // Verify completion status
    expect(result.id).toEqual(createdTask.id);
    expect(result.title).toEqual('Completed Task');
    expect(result.description).toEqual('This task is done');
    expect(result.completed).toEqual(true);
  });

  it('should throw error for non-existent task ID', async () => {
    const input: TaskIdInput = { id: 99999 };
    
    // Should throw an error for non-existent task
    await expect(getTask(input)).rejects.toThrow(/Task with ID 99999 not found/i);
  });

  it('should throw error for invalid task ID (zero)', async () => {
    const input: TaskIdInput = { id: 0 };
    
    // Should throw an error for invalid ID
    await expect(getTask(input)).rejects.toThrow(/Task with ID 0 not found/i);
  });

  it('should handle negative task ID gracefully', async () => {
    const input: TaskIdInput = { id: -1 };
    
    // Should throw an error for negative ID
    await expect(getTask(input)).rejects.toThrow(/Task with ID -1 not found/i);
  });

  it('should verify date fields are proper Date instances', async () => {
    // Create a task
    const insertResult = await db.insert(tasksTable)
      .values({
        title: 'Date Test Task',
        description: 'Testing date fields',
        completed: false
      })
      .returning()
      .execute();

    const createdTask = insertResult[0];
    
    // Test retrieving the task
    const input: TaskIdInput = { id: createdTask.id };
    const result = await getTask(input);

    // Verify date fields are Date instances and have reasonable values
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Check that dates are recent (within last minute)
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    
    expect(result.created_at >= oneMinuteAgo).toBe(true);
    expect(result.created_at <= now).toBe(true);
    expect(result.updated_at >= oneMinuteAgo).toBe(true);
    expect(result.updated_at <= now).toBe(true);
  });
});