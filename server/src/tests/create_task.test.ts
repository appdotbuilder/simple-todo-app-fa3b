import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateTaskInput = {
  title: 'Test Task',
  description: 'A task for testing'
};

// Test input with null description
const testInputNullDesc: CreateTaskInput = {
  title: 'Task with null description',
  description: null
};

describe('createTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a task with description', async () => {
    const result = await createTask(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A task for testing');
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a task with null description', async () => {
    const result = await createTask(testInputNullDesc);

    // Basic field validation
    expect(result.title).toEqual('Task with null description');
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save task to database', async () => {
    const result = await createTask(testInput);

    // Query using proper drizzle syntax
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Test Task');
    expect(tasks[0].description).toEqual('A task for testing');
    expect(tasks[0].completed).toEqual(false);
    expect(tasks[0].created_at).toBeInstanceOf(Date);
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should set completed to false by default', async () => {
    const result = await createTask(testInput);

    expect(result.completed).toEqual(false);

    // Verify in database as well
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks[0].completed).toEqual(false);
  });

  it('should auto-generate timestamps', async () => {
    const beforeCreate = new Date();
    const result = await createTask(testInput);
    const afterCreate = new Date();

    // Verify timestamps are within reasonable range
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());

    // Initially, created_at and updated_at should be very close (within 1 second)
    const timeDiff = Math.abs(result.updated_at.getTime() - result.created_at.getTime());
    expect(timeDiff).toBeLessThan(1000); // Less than 1 second difference
  });

  it('should create multiple tasks with unique IDs', async () => {
    const task1 = await createTask({
      title: 'First Task',
      description: 'First description'
    });

    const task2 = await createTask({
      title: 'Second Task', 
      description: 'Second description'
    });

    // Verify unique IDs
    expect(task1.id).not.toEqual(task2.id);
    expect(task1.id).toBeGreaterThan(0);
    expect(task2.id).toBeGreaterThan(0);

    // Verify both saved to database
    const allTasks = await db.select().from(tasksTable).execute();
    expect(allTasks).toHaveLength(2);
    
    const titles = allTasks.map(task => task.title);
    expect(titles).toContain('First Task');
    expect(titles).toContain('Second Task');
  });

  it('should handle tasks with only title (minimal input)', async () => {
    const minimalInput: CreateTaskInput = {
      title: 'Minimal Task',
      description: null
    };

    const result = await createTask(minimalInput);

    expect(result.title).toEqual('Minimal Task');
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});