import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { getTasks } from '../handlers/get_tasks';

// Test data for creating tasks
const testTasks: CreateTaskInput[] = [
  {
    title: 'First Task',
    description: 'This is the first task'
  },
  {
    title: 'Second Task', 
    description: null // Test null description
  },
  {
    title: 'Third Task',
    description: 'This is the third task'
  }
];

describe('getTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tasks exist', async () => {
    const result = await getTasks();
    
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all tasks ordered by created_at descending', async () => {
    // Insert test tasks with small delays to ensure different timestamps
    const insertedTasks = [];
    
    for (const taskData of testTasks) {
      const [task] = await db.insert(tasksTable)
        .values({
          title: taskData.title,
          description: taskData.description,
          completed: false
        })
        .returning()
        .execute();
      
      insertedTasks.push(task);
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const result = await getTasks();

    // Should return all 3 tasks
    expect(result).toHaveLength(3);
    
    // Verify all tasks are present
    expect(result.map(t => t.title)).toContain('First Task');
    expect(result.map(t => t.title)).toContain('Second Task');
    expect(result.map(t => t.title)).toContain('Third Task');

    // Verify ordering - newest first (descending by created_at)
    // The last inserted task should be first in the result
    expect(result[0].title).toEqual('Third Task');
    expect(result[2].title).toEqual('First Task');
    
    // Verify timestamps are in descending order
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].created_at.getTime()).toBeGreaterThanOrEqual(
        result[i + 1].created_at.getTime()
      );
    }
  });

  it('should return tasks with all required fields', async () => {
    // Insert a single task
    await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        description: 'Test description',
        completed: true
      })
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(1);
    
    const task = result[0];
    expect(task.id).toBeDefined();
    expect(typeof task.id).toBe('number');
    expect(task.title).toEqual('Test Task');
    expect(task.description).toEqual('Test description');
    expect(task.completed).toBe(true);
    expect(task.created_at).toBeInstanceOf(Date);
    expect(task.updated_at).toBeInstanceOf(Date);
  });

  it('should handle tasks with null description correctly', async () => {
    // Insert task with null description
    await db.insert(tasksTable)
      .values({
        title: 'Task with null description',
        description: null,
        completed: false
      })
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Task with null description');
    expect(result[0].description).toBeNull();
    expect(result[0].completed).toBe(false);
  });

  it('should handle mixed completed states correctly', async () => {
    // Insert tasks with different completion states
    await db.insert(tasksTable)
      .values([
        {
          title: 'Completed Task',
          description: 'This task is done',
          completed: true
        },
        {
          title: 'Incomplete Task',
          description: 'This task is not done',
          completed: false
        }
      ])
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(2);
    
    // Find tasks by title
    const completedTask = result.find(t => t.title === 'Completed Task');
    const incompleteTask = result.find(t => t.title === 'Incomplete Task');
    
    expect(completedTask).toBeDefined();
    expect(completedTask!.completed).toBe(true);
    
    expect(incompleteTask).toBeDefined();
    expect(incompleteTask!.completed).toBe(false);
  });

  it('should verify database persistence', async () => {
    // Insert a task
    const [insertedTask] = await db.insert(tasksTable)
      .values({
        title: 'Persistence Test',
        description: 'Testing database persistence',
        completed: false
      })
      .returning()
      .execute();

    // Get tasks through handler
    const result = await getTasks();

    // Verify the task exists in handler result
    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(insertedTask.id);
    expect(result[0].title).toEqual('Persistence Test');
    expect(result[0].description).toEqual('Testing database persistence');
    
    // Verify timestamps are properly handled
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });
});