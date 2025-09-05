import { type UpdateTaskInput, type Task } from '../schema';

export async function updateTask(input: UpdateTaskInput): Promise<Task> {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is updating an existing task in the database.
    // It should update only the provided fields (title, description, completed status)
    // and automatically update the updated_at timestamp.
    // Should throw an error if the task with given ID doesn't exist.
    return Promise.resolve({
        id: input.id,
        title: 'Updated Task', // Placeholder - should fetch and merge with existing data
        description: input.description || null,
        completed: input.completed || false,
        created_at: new Date(), // Should preserve original created_at
        updated_at: new Date()  // Should be updated to current time
    } as Task);
}