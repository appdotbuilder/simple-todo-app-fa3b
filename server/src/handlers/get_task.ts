import { type TaskIdInput, type Task } from '../schema';

export async function getTask(input: TaskIdInput): Promise<Task> {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is fetching a single task by ID from the database.
    // Should throw an error if the task with given ID doesn't exist.
    return Promise.resolve({
        id: input.id,
        title: 'Sample Task', // Placeholder - should fetch from database
        description: null,
        completed: false,
        created_at: new Date(), // Placeholder date
        updated_at: new Date()  // Placeholder date
    } as Task);
}