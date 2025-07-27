import { supabase } from '@/lib/supabaseClient';

export interface Task {
  id: string;
  name: string;
  color: string;
  time: string;
  days: string[];
  created_at: string;
  updated_at?: string;
}

export interface CreateTaskRequest {
  name: string;
  color: string;
  time: string;
  days: string[];
}

export interface UpdateTaskRequest {
  name?: string;
  color?: string;
  time?: string;
  days?: string[];
}

export class TaskService {
  
  /**
   * Obtener todas las tareas del usuario autenticado
   */
  static async getTasks(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching tasks:', error);
      throw new Error('Failed to fetch tasks');
    }

    return data || [];
  }

  /**
   * Crear una nueva tarea
   */
  static async createTask(taskData: CreateTaskRequest): Promise<Task> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          user_id: user.id,
          name: taskData.name,
          color: taskData.color,
          time: taskData.time,
          days: taskData.days,
          created_at: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      throw new Error('Failed to create task');
    }

    return data;
  }

  /**
   * Actualizar una tarea existente
   */
  static async updateTask(taskId: string, updates: UpdateTaskRequest): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      throw new Error('Failed to update task');
    }

    return data;
  }

  /**
   * Eliminar una tarea
   */
  static async deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      throw new Error('Failed to delete task');
    }
  }

  /**
   * Obtener una tarea específica por ID
   */
  static async getTask(taskId: string): Promise<Task | null> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Task not found
      }
      console.error('Error fetching task:', error);
      throw new Error('Failed to fetch task');
    }

    return data;
  }

  /**
   * Obtener tareas que deben realizarse en un día específico
   */
  static async getTasksForDay(dayOfWeek: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .contains('days', [dayOfWeek])
      .order('time', { ascending: true });

    if (error) {
      console.error('Error fetching tasks for day:', error);
      throw new Error('Failed to fetch tasks for day');
    }

    return data || [];
  }

  /**
   * Buscar tareas por nombre
   */
  static async searchTasks(query: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error searching tasks:', error);
      throw new Error('Failed to search tasks');
    }

    return data || [];
  }
}
