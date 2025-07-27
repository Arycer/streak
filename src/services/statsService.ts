import { TaskService, Task } from "./taskService";
import { CompletionService, TaskCompletion } from "./completionService";

export interface StreakStats {
  currentStreak: number;
  previousStreak: number;
  longestStreak: number;
  completionCount: number;
  isStreakBroken: boolean;
}

export interface UserStats {
  totalTasks: number;
  activeDays: number;
  totalCompletions: number;
  consistencyPercentage: number;
  taskStreaks: { [taskId: string]: StreakStats };
}

export interface DailyHistoryItem {
  date: string;
  completedTasks: Task[];
  missedTasks: Task[];
  streakBrokenTasks: Task[];
}

export class StatsService {
  /**
   * Obtener todas las fechas de los últimos N días
   */
  static getAllDates(days: number = 30): string[] {
    const dates: string[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);

      date.setDate(today.getDate() - i);
      dates.push(date.toISOString().split("T")[0]);
    }

    return dates;
  }

  /**
   * Convertir fecha a día de la semana
   */
  static getDayOfWeek(dateString: string): string {
    const date = new Date(dateString + "T00:00:00");
    const days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];

    return days[date.getDay()];
  }

  /**
   * Calcular racha actual de una tarea
   */
  static async calculateCurrentStreak(
    task: Task,
    completions: TaskCompletion[],
  ): Promise<number> {
    const today = new Date().toISOString().split("T")[0];
    const completionDates = new Set(completions.map((c) => c.completion_date));

    let streak = 0;
    let currentDate = new Date(today);

    while (true) {
      const dateString = currentDate.toISOString().split("T")[0];

      // No contar días antes de la creación de la tarea
      if (dateString < task.created_at) {
        break;
      }

      const dayOfWeek = this.getDayOfWeek(dateString);

      // Solo verificar días asignados a la tarea
      if (task.days.includes(dayOfWeek)) {
        if (completionDates.has(dateString)) {
          streak++;
        } else {
          break; // Racha rota
        }
      }

      // Retroceder un día
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
  }

  /**
   * Calcular racha anterior de una tarea
   */
  static async calculatePreviousStreak(
    task: Task,
    completions: TaskCompletion[],
  ): Promise<number> {
    const today = new Date().toISOString().split("T")[0];
    const completionDates = new Set(completions.map((c) => c.completion_date));

    let currentDate = new Date(today);
    let foundCurrentStreakEnd = false;
    let previousStreak = 0;

    while (true) {
      const dateString = currentDate.toISOString().split("T")[0];

      // No contar días antes de la creación de la tarea
      if (dateString < task.created_at) {
        break;
      }

      const dayOfWeek = this.getDayOfWeek(dateString);

      // Solo verificar días asignados a la tarea
      if (task.days.includes(dayOfWeek)) {
        const isCompleted = completionDates.has(dateString);

        if (!foundCurrentStreakEnd) {
          // Saltamos la racha actual
          if (!isCompleted) {
            foundCurrentStreakEnd = true;
          }
        } else {
          // Contamos la racha anterior
          if (isCompleted) {
            previousStreak++;
          } else {
            break; // Fin de la racha anterior
          }
        }
      }

      // Retroceder un día
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return previousStreak;
  }

  /**
   * Calcular la racha más larga de una tarea
   */
  static async calculateLongestStreak(
    task: Task,
    completions: TaskCompletion[],
  ): Promise<number> {
    const completionDates = new Set(completions.map((c) => c.completion_date));
    const allDates = this.getAllDates(365); // Revisar último año

    let longestStreak = 0;
    let currentStreak = 0;

    for (const date of allDates.reverse()) {
      // Empezar desde más antiguo
      // No contar días antes de la creación de la tarea
      if (date < task.created_at) {
        continue;
      }

      const dayOfWeek = this.getDayOfWeek(date);

      // Solo verificar días asignados a la tarea
      if (task.days.includes(dayOfWeek)) {
        if (completionDates.has(date)) {
          currentStreak++;
          longestStreak = Math.max(longestStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      }
    }

    return longestStreak;
  }

  /**
   * Contar completaciones en los últimos N días
   */
  static async getCompletionCount(
    task: Task,
    completions: TaskCompletion[],
    days: number = 30,
  ): Promise<number> {
    const cutoffDate = new Date();

    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffString = cutoffDate.toISOString().split("T")[0];

    return completions.filter(
      (c) =>
        c.completion_date >= cutoffString &&
        c.completion_date >= task.created_at,
    ).length;
  }

  /**
   * Verificar si una racha se rompió en un día específico
   */
  static async isStreakBrokenOnDay(
    task: Task,
    day: string,
    completions: TaskCompletion[],
  ): Promise<boolean> {
    const dayOfWeek = this.getDayOfWeek(day);

    // Solo verificar días asignados y después de la creación
    if (!task.days.includes(dayOfWeek) || day < task.created_at) {
      return false;
    }

    const completionDates = new Set(completions.map((c) => c.completion_date));

    // Si no se completó este día, verificar si había una racha antes
    if (completionDates.has(day)) {
      return false; // No está rota si se completó
    }

    // Verificar si había una racha el día anterior (asignado)
    let previousDate = new Date(day);

    previousDate.setDate(previousDate.getDate() - 1);

    while (previousDate.toISOString().split("T")[0] >= task.created_at) {
      const prevDateString = previousDate.toISOString().split("T")[0];
      const prevDayOfWeek = this.getDayOfWeek(prevDateString);

      if (task.days.includes(prevDayOfWeek)) {
        return completionDates.has(prevDateString); // Racha rota si el día anterior sí se completó
      }

      previousDate.setDate(previousDate.getDate() - 1);
    }

    return false;
  }

  /**
   * Calcular estadísticas de rachas para una tarea
   */
  static async calculateTaskStreakStats(task: Task): Promise<StreakStats> {
    const completions = await CompletionService.getTaskCompletions(task.id);
    const today = new Date().toISOString().split("T")[0];

    const [currentStreak, previousStreak, longestStreak, completionCount] =
      await Promise.all([
        this.calculateCurrentStreak(task, completions),
        this.calculatePreviousStreak(task, completions),
        this.calculateLongestStreak(task, completions),
        this.getCompletionCount(task, completions),
      ]);

    const isStreakBroken = await this.isStreakBrokenOnDay(
      task,
      today,
      completions,
    );

    return {
      currentStreak,
      previousStreak,
      longestStreak,
      completionCount,
      isStreakBroken,
    };
  }

  /**
   * Calcular estadísticas generales del usuario
   */
  static async getUserStats(): Promise<UserStats> {
    const [tasks, completionStats] = await Promise.all([
      TaskService.getTasks(),
      CompletionService.getCompletionStats(),
    ]);

    const taskStreaks: { [taskId: string]: StreakStats } = {};

    // Calcular rachas para cada tarea
    for (const task of tasks) {
      taskStreaks[task.id] = await this.calculateTaskStreakStats(task);
    }

    // Calcular consistencia
    const consistencyPercentage =
      await this.calculateConsistencyPercentage(tasks);

    return {
      totalTasks: tasks.length,
      activeDays: completionStats.uniqueDaysWithCompletions,
      totalCompletions: completionStats.totalCompletions,
      consistencyPercentage,
      taskStreaks,
    };
  }

  /**
   * Calcular porcentaje de consistencia real
   */
  static async calculateConsistencyPercentage(
    tasks: Task[],
    days: number = 30,
  ): Promise<number> {
    const allDates = this.getAllDates(days);
    const completionsByDate = await CompletionService.getCompletions(days);

    let totalTasksExpected = 0;
    let totalTasksCompleted = 0;

    for (const date of allDates) {
      const dayOfWeek = this.getDayOfWeek(date);
      const completedOnDay = completionsByDate[date] || [];

      // Contar tareas que deberían haberse hecho este día
      const tasksForDay = tasks.filter(
        (task) => task.days.includes(dayOfWeek) && date >= task.created_at,
      );

      totalTasksExpected += tasksForDay.length;

      // Contar cuántas se completaron realmente
      for (const task of tasksForDay) {
        if (completedOnDay.includes(task.id)) {
          totalTasksCompleted++;
        }
      }
    }

    if (totalTasksExpected === 0) return 100;

    return Math.round((totalTasksCompleted / totalTasksExpected) * 100);
  }

  /**
   * Obtener historial diario para la UI
   */
  static async getDailyHistory(days: number = 30): Promise<DailyHistoryItem[]> {
    const [tasks, completionsByDate] = await Promise.all([
      TaskService.getTasks(),
      CompletionService.getCompletions(days),
    ]);

    const allDates = this.getAllDates(days);
    const history: DailyHistoryItem[] = [];

    for (const date of allDates) {
      const dayOfWeek = this.getDayOfWeek(date);
      const completedTaskIds = completionsByDate[date] || [];

      // Tareas que deberían haberse hecho este día
      const expectedTasks = tasks.filter(
        (task) => task.days.includes(dayOfWeek) && date >= task.created_at,
      );

      const completedTasks = expectedTasks.filter((task) =>
        completedTaskIds.includes(task.id),
      );

      const missedTasks = expectedTasks.filter(
        (task) => !completedTaskIds.includes(task.id),
      );

      // Verificar qué tareas tuvieron rachas rotas
      const streakBrokenTasks: Task[] = [];

      for (const task of missedTasks) {
        const completions = await CompletionService.getTaskCompletions(task.id);
        const isStreakBroken = await this.isStreakBrokenOnDay(
          task,
          date,
          completions,
        );

        if (isStreakBroken) {
          streakBrokenTasks.push(task);
        }
      }

      history.push({
        date,
        completedTasks,
        missedTasks,
        streakBrokenTasks,
      });
    }

    return history.reverse(); // Más reciente primero
  }

  /**
   * Obtener abreviaciones de días en español
   */
  static getDayAbbreviations(days: string[]): string {
    const dayMap: { [key: string]: string } = {
      monday: "L",
      tuesday: "M",
      wednesday: "X",
      thursday: "J",
      friday: "V",
      saturday: "S",
      sunday: "D",
    };

    return days
      .map((day) => dayMap[day] || day.charAt(0).toUpperCase())
      .join(", ");
  }

  /**
   * Obtener clases de color para las tareas
   */
  static getColorClasses(color: string): {
    bg: string;
    border: string;
    text: string;
  } {
    const colorMap: {
      [key: string]: { bg: string; border: string; text: string };
    } = {
      blue: {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-800",
      },
      green: {
        bg: "bg-green-50",
        border: "border-green-200",
        text: "text-green-800",
      },
      purple: {
        bg: "bg-purple-50",
        border: "border-purple-200",
        text: "text-purple-800",
      },
      orange: {
        bg: "bg-orange-50",
        border: "border-orange-200",
        text: "text-orange-800",
      },
      pink: {
        bg: "bg-pink-50",
        border: "border-pink-200",
        text: "text-pink-800",
      },
      indigo: {
        bg: "bg-indigo-50",
        border: "border-indigo-200",
        text: "text-indigo-800",
      },
      teal: {
        bg: "bg-teal-50",
        border: "border-teal-200",
        text: "text-teal-800",
      },
      red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-800" },
    };

    return colorMap[color] || colorMap.blue;
  }
}
