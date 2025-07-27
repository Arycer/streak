import { supabase } from "@/lib/supabaseClient";

export interface TaskCompletion {
  id: string;
  task_id: string;
  completion_date: string;
  created_at: string;
}

export interface CompletionsByDate {
  [date: string]: string[]; // date -> array of task IDs
}

export class CompletionService {
  /**
   * Obtener todas las completaciones del usuario en un rango de fechas
   */
  static async getCompletions(days: number = 30): Promise<CompletionsByDate> {
    const endDate = new Date();
    const startDate = new Date();

    startDate.setDate(endDate.getDate() - days + 1);

    const { data, error } = await supabase
      .from("task_completions")
      .select("task_id, completion_date")
      .gte("completion_date", startDate.toISOString().split("T")[0])
      .lte("completion_date", endDate.toISOString().split("T")[0])
      .order("completion_date", { ascending: false });

    if (error) {
      throw new Error("Failed to fetch completions");
    }

    // Agrupar por fecha
    const completionsByDate: CompletionsByDate = {};

    data?.forEach((completion) => {
      const date = completion.completion_date;

      if (!completionsByDate[date]) {
        completionsByDate[date] = [];
      }
      completionsByDate[date].push(completion.task_id.toString());
    });

    return completionsByDate;
  }

  /**
   * Marcar una tarea como completada en una fecha específica
   */
  static async markTaskComplete(
    taskId: string,
    date: string,
  ): Promise<TaskCompletion | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("task_completions")
      .insert([
        {
          task_id: parseInt(taskId),
          user_id: user.id,
          completion_date: date,
        },
      ])
      .select()
      .single();

    if (error) {
      // Si ya existe, no es un error crítico
      if (error.code === "23505") {
        return await this.getTaskCompletion(taskId, date);
      }
      throw new Error("Failed to mark task as complete");
    }

    return data;
  }

  /**
   * Desmarcar una tarea como completada en una fecha específica
   */
  static async markTaskIncomplete(taskId: string, date: string): Promise<void> {
    const { error } = await supabase
      .from("task_completions")
      .delete()
      .eq("task_id", parseInt(taskId))
      .eq("completion_date", date);

    if (error) {
      throw new Error("Failed to mark task as incomplete");
    }
  }

  /**
   * Alternar el estado de completación de una tarea
   */
  static async toggleTaskCompletion(
    taskId: string,
    date: string,
  ): Promise<boolean> {
    const completion = await this.getTaskCompletion(taskId, date);

    if (completion) {
      await this.markTaskIncomplete(taskId, date);

      return false; // Ahora está incompleta
    } else {
      await this.markTaskComplete(taskId, date);

      return true; // Ahora está completa
    }
  }

  /**
   * Verificar si una tarea está completada en una fecha específica
   */
  static async isTaskCompleted(taskId: string, date: string): Promise<boolean> {
    const completion = await this.getTaskCompletion(taskId, date);

    return completion !== null;
  }

  /**
   * Obtener una completación específica
   */
  static async getTaskCompletion(
    taskId: string,
    date: string,
  ): Promise<TaskCompletion | null> {
    const { data, error } = await supabase
      .from("task_completions")
      .select("*")
      .eq("task_id", parseInt(taskId))
      .eq("completion_date", date)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // No completion found
      }
      throw new Error("Failed to fetch task completion");
    }

    return data;
  }

  /**
   * Obtener todas las completaciones de una tarea específica
   */
  static async getTaskCompletions(
    taskId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<TaskCompletion[]> {
    let query = supabase
      .from("task_completions")
      .select("*")
      .eq("task_id", parseInt(taskId))
      .order("completion_date", { ascending: false });

    if (startDate) {
      query = query.gte("completion_date", startDate);
    }

    if (endDate) {
      query = query.lte("completion_date", endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error("Failed to fetch task completions");
    }

    return data || [];
  }

  /**
   * Obtener completaciones para una fecha específica
   */
  static async getCompletionsForDate(date: string): Promise<TaskCompletion[]> {
    const { data, error } = await supabase
      .from("task_completions")
      .select("*")
      .eq("completion_date", date)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error("Failed to fetch completions for date");
    }

    return data || [];
  }

  /**
   * Obtener estadísticas de completación del usuario
   */
  static async getCompletionStats(days: number = 30): Promise<{
    totalCompletions: number;
    uniqueDaysWithCompletions: number;
    averageCompletionsPerDay: number;
  }> {
    const endDate = new Date();
    const startDate = new Date();

    startDate.setDate(endDate.getDate() - days + 1);

    const { data, error } = await supabase
      .from("task_completions")
      .select("completion_date")
      .gte("completion_date", startDate.toISOString().split("T")[0])
      .lte("completion_date", endDate.toISOString().split("T")[0]);

    if (error) {
      throw new Error("Failed to fetch completion stats");
    }

    const totalCompletions = data?.length || 0;
    const uniqueDates = new Set(data?.map((d) => d.completion_date) || []);
    const uniqueDaysWithCompletions = uniqueDates.size;
    const averageCompletionsPerDay =
      uniqueDaysWithCompletions > 0
        ? totalCompletions / uniqueDaysWithCompletions
        : 0;

    return {
      totalCompletions,
      uniqueDaysWithCompletions,
      averageCompletionsPerDay:
        Math.round(averageCompletionsPerDay * 100) / 100,
    };
  }

  /**
   * Eliminar todas las completaciones de una tarea (usado cuando se elimina la tarea)
   */
  static async deleteTaskCompletions(taskId: string): Promise<void> {
    const { error } = await supabase
      .from("task_completions")
      .delete()
      .eq("task_id", parseInt(taskId));

    if (error) {
      throw new Error("Failed to delete task completions");
    }
  }
}
