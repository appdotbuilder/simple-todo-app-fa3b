import { z } from 'zod';

// Task schema for database records
export const taskSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(), // Can be explicitly null
  completed: z.boolean(),
  created_at: z.coerce.date(), // Converts string timestamps to Date objects
  updated_at: z.coerce.date()
});

export type Task = z.infer<typeof taskSchema>;

// Input schema for creating tasks
export const createTaskInputSchema = z.object({
  title: z.string().min(1, "Title is required"), // Validate non-empty title
  description: z.string().nullable() // Explicit null allowed, undefined not allowed
});

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

// Input schema for updating tasks
export const updateTaskInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1, "Title is required").optional(), // Optional but must be non-empty if provided
  description: z.string().nullable().optional(), // Can be null or undefined
  completed: z.boolean().optional()
});

export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

// Input schema for task ID parameter
export const taskIdInputSchema = z.object({
  id: z.number()
});

export type TaskIdInput = z.infer<typeof taskIdInputSchema>;