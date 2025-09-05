import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../../server/src/schema';
import { PlusIcon, EditIcon, TrashIcon } from 'lucide-react';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Form state for creating new tasks
  const [newTaskForm, setNewTaskForm] = useState<CreateTaskInput>({
    title: '',
    description: null
  });

  // Form state for editing tasks
  const [editTaskForm, setEditTaskForm] = useState<UpdateTaskInput>({
    id: 0,
    title: '',
    description: null,
    completed: false
  });

  // Load all tasks
  const loadTasks = useCallback(async () => {
    try {
      const result = await trpc.getTasks.query();
      setTasks(result);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Create new task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskForm.title.trim()) return;

    setIsLoading(true);
    try {
      const newTask = await trpc.createTask.mutate(newTaskForm);
      setTasks((prev: Task[]) => [newTask, ...prev]);
      setNewTaskForm({ title: '', description: null });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle task completion
  const toggleTaskCompletion = async (task: Task) => {
    try {
      await trpc.updateTask.mutate({
        id: task.id,
        completed: !task.completed
      });
      setTasks((prev: Task[]) =>
        prev.map((t: Task) => (t.id === task.id ? { ...t, completed: !t.completed } : t))
      );
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  // Update task
  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTaskForm.title?.trim() || !editingTask) return;

    setIsLoading(true);
    try {
      await trpc.updateTask.mutate(editTaskForm);
      setTasks((prev: Task[]) =>
        prev.map((t: Task) => 
          t.id === editingTask.id 
            ? { ...t, title: editTaskForm.title!, description: editTaskForm.description ?? null }
            : t
        )
      );
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: number) => {
    try {
      await trpc.deleteTask.mutate({ id: taskId });
      setTasks((prev: Task[]) => prev.filter((t: Task) => t.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  // Start editing a task
  const startEditing = (task: Task) => {
    setEditingTask(task);
    setEditTaskForm({
      id: task.id,
      title: task.title,
      description: task.description,
      completed: task.completed
    });
  };

  // Filter tasks based on completion status
  const filteredTasks = tasks.filter((task: Task) => {
    switch (filter) {
      case 'active':
        return !task.completed;
      case 'completed':
        return task.completed;
      default:
        return true;
    }
  });

  const completedCount = tasks.filter((task: Task) => task.completed).length;
  const activeCount = tasks.length - completedCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📝 My Tasks</h1>
          <p className="text-gray-600">Stay organized and get things done!</p>
        </div>

        {/* Stats and Add Task Button */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex gap-4 text-sm">
            <Badge variant="outline" className="bg-white">
              📋 Total: {tasks.length}
            </Badge>
            <Badge variant="outline" className="bg-white">
              ⏳ Active: {activeCount}
            </Badge>
            <Badge variant="outline" className="bg-white">
              ✅ Completed: {completedCount}
            </Badge>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <PlusIcon className="w-4 h-4 mr-2" />
                Add New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Add a new task to your todo list. Give it a title and an optional description.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTask}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter task title..."
                      value={newTaskForm.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewTaskForm((prev: CreateTaskInput) => ({ ...prev, title: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter task description (optional)..."
                      value={newTaskForm.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setNewTaskForm((prev: CreateTaskInput) => ({
                          ...prev,
                          description: e.target.value || null
                        }))
                      }
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading || !newTaskForm.title.trim()}>
                    {isLoading ? 'Creating...' : 'Create Task'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter Buttons */}
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-lg p-1 shadow-sm border">
            {(['all', 'active', 'completed'] as const).map((filterOption) => (
              <Button
                key={filterOption}
                variant={filter === filterOption ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter(filterOption)}
                className="capitalize"
              >
                {filterOption === 'all' && '📋 All'}
                {filterOption === 'active' && '⏳ Active'}
                {filterOption === 'completed' && '✅ Completed'}
              </Button>
            ))}
          </div>
        </div>

        {/* Tasks List */}
        {filteredTasks.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-6xl mb-4">
                {filter === 'all' && '📝'}
                {filter === 'active' && '⏳'}
                {filter === 'completed' && '🎉'}
              </div>
              <p className="text-gray-500 text-lg">
                {filter === 'all' && 'No tasks yet. Create your first task above!'}
                {filter === 'active' && 'No active tasks. Great job staying on top of things!'}
                {filter === 'completed' && 'No completed tasks yet. Get started and check some off!'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task: Task) => (
              <Card key={task.id} className={`transition-all hover:shadow-md ${task.completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <div className="mt-1">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => toggleTaskCompletion(task)}
                        className="w-5 h-5"
                      />
                    </div>

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold text-lg ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className={`text-sm mt-1 ${task.completed ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>Created: {task.created_at.toLocaleDateString()}</span>
                        {task.updated_at.getTime() !== task.created_at.getTime() && (
                          <span>Updated: {task.updated_at.toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(task)}
                        className="h-8 w-8 p-0 hover:bg-blue-100"
                      >
                        <EditIcon className="w-4 h-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-red-100"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Task</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{task.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteTask(task.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Task Dialog */}
        {editingTask && (
          <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Task</DialogTitle>
                <DialogDescription>
                  Make changes to your task details.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpdateTask}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-title">Title *</Label>
                    <Input
                      id="edit-title"
                      placeholder="Enter task title..."
                      value={editTaskForm.title || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditTaskForm((prev: UpdateTaskInput) => ({ ...prev, title: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      placeholder="Enter task description (optional)..."
                      value={editTaskForm.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setEditTaskForm((prev: UpdateTaskInput) => ({
                          ...prev,
                          description: e.target.value || null
                        }))
                      }
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingTask(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading || !editTaskForm.title?.trim()}>
                    {isLoading ? 'Updating...' : 'Update Task'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

export default App;