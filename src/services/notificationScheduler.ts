import { supabase } from "@/lib/supabaseClient";
import { Task } from "@/services/taskService";

export interface ScheduledNotification {
  id: string;
  user_id: string;
  task_id: string; // Matches Task.id which is string in TypeScript but bigint in DB
  scheduled_for: string;
  title: string;
  body: string;
  sent: boolean;
  created_at: string;
}

export class NotificationScheduler {
  private static instance: NotificationScheduler;
  private scheduledTimeouts: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    // Constructor privado para singleton
  }

  static getInstance(): NotificationScheduler {
    if (!NotificationScheduler.instance) {
      NotificationScheduler.instance = new NotificationScheduler();
    }

    return NotificationScheduler.instance;
  }

  // Programar notificaciones para todas las tareas del usuario
  async scheduleAllTaskNotifications(): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Obtener todas las tareas del usuario
      const { data: tasks, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      // Limpiar notificaciones programadas anteriormente
      this.clearAllScheduledNotifications();

      // Programar notificaciones para cada tarea
      for (const task of tasks || []) {
        await this.scheduleTaskNotifications(task);
      }

      console.log(
        `Programadas notificaciones para ${tasks?.length || 0} tareas`,
      );
    } catch (error) {
      console.error("Error programando notificaciones:", error);
    }
  }

  // Programar notificaciones para una tarea específica
  async scheduleTaskNotifications(task: Task): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Obtener la fecha actual
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Programar notificaciones para los próximos 7 días
      for (let i = 0; i < 7; i++) {
        const targetDate = new Date(today);

        targetDate.setDate(today.getDate() + i);

        const dayOfWeek = this.getDayOfWeek(targetDate);

        // Verificar si la tarea está programada para este día
        if (task.days.includes(dayOfWeek)) {
          const notificationTime = this.getNotificationDateTime(
            targetDate,
            task.time,
          );

          // Solo programar si es en el futuro
          if (notificationTime > now) {
            await this.scheduleNotification(task, notificationTime);
          }
        }
      }
    } catch (error) {
      console.error("Error programando notificaciones para tarea:", error);
    }
  }

  // Programar una notificación específica
  private async scheduleNotification(
    task: Task,
    scheduledTime: Date,
  ): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const title = `🎯 ${task.name}`;
      const body = `Es hora de completar tu hábito: ${task.name}`;

      // Guardar en la base de datos
      const { data, error } = await supabase
        .from("scheduled_notifications")
        .insert({
          user_id: user.id,
          task_id: task.id,
          scheduled_for: scheduledTime.toISOString(),
          title,
          body,
          sent: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Programar notificación local
      const delay = scheduledTime.getTime() - Date.now();

      if (delay > 0) {
        const timeoutId = setTimeout(() => {
          this.sendLocalNotification(task, title, body);
          this.scheduledTimeouts.delete(data.id);
        }, delay);

        this.scheduledTimeouts.set(data.id, timeoutId);
      }

      console.log(
        `Notificación programada para ${task.name} a las ${scheduledTime.toLocaleString()}`,
      );
    } catch (error) {
      console.error("Error programando notificación:", error);
    }
  }

  // Enviar notificación local
  private sendLocalNotification(task: Task, title: string, body: string): void {
    if (Notification.permission === "granted") {
      const notification = new Notification(title, {
        body,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-72x72.png",
        tag: `task-${task.id}`,
        requireInteraction: true,
        data: {
          taskId: task.id,
          url: "/today",
        },
      });

      // Auto-close after 30 seconds if not interacted
      setTimeout(() => {
        notification.close();
      }, 30000);
    }
  }

  // Cancelar notificación de una tarea
  async cancelTaskNotifications(taskId: string): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Marcar como canceladas en la base de datos
      const { error } = await supabase
        .from("scheduled_notifications")
        .delete()
        .eq("task_id", taskId)
        .eq("user_id", user.id)
        .eq("sent", false);

      if (error) throw error;

      // Cancelar timeouts locales
      for (const [
        notificationId,
        timeoutId,
      ] of this.scheduledTimeouts.entries()) {
        clearTimeout(timeoutId);
        this.scheduledTimeouts.delete(notificationId);
      }

      console.log(`Notificaciones canceladas para tarea ${taskId}`);
    } catch (error) {
      console.error("Error cancelando notificaciones:", error);
    }
  }

  // Limpiar todas las notificaciones programadas
  private clearAllScheduledNotifications(): void {
    for (const timeoutId of this.scheduledTimeouts.values()) {
      clearTimeout(timeoutId);
    }
    this.scheduledTimeouts.clear();
  }

  // Reprogramar notificaciones (útil cuando se actualiza una tarea)
  async rescheduleTaskNotifications(task: Task): Promise<void> {
    await this.cancelTaskNotifications(task.id);
    await this.scheduleTaskNotifications(task);
  }

  // Obtener día de la semana en formato compatible
  private getDayOfWeek(date: Date): string {
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

  // Combinar fecha y hora para crear DateTime de notificación
  private getNotificationDateTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(":").map(Number);
    const notificationTime = new Date(date);

    notificationTime.setHours(hours, minutes, 0, 0);

    return notificationTime;
  }

  // Inicializar el scheduler (llamar al cargar la app)
  async initialize(): Promise<void> {
    try {
      // Limpiar notificaciones antiguas
      await this.cleanupOldNotifications();

      // Programar notificaciones actuales
      await this.scheduleAllTaskNotifications();

      // Configurar reprogramación automática cada hora
      setInterval(
        () => {
          this.scheduleAllTaskNotifications();
        },
        60 * 60 * 1000,
      ); // 1 hora

      console.log("Notification Scheduler inicializado");
    } catch (error) {
      console.error("Error inicializando Notification Scheduler:", error);
    }
  }

  // Limpiar notificaciones antiguas de la base de datos
  private async cleanupOldNotifications(): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const yesterday = new Date();

      yesterday.setDate(yesterday.getDate() - 1);

      const { error } = await supabase
        .from("scheduled_notifications")
        .delete()
        .eq("user_id", user.id)
        .lt("scheduled_for", yesterday.toISOString());

      if (error) throw error;
    } catch (error) {
      console.error("Error limpiando notificaciones antiguas:", error);
    }
  }

  // Obtener estadísticas de notificaciones
  async getNotificationStats(): Promise<{ scheduled: number; sent: number }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return { scheduled: 0, sent: 0 };

      const { data, error } = await supabase
        .from("scheduled_notifications")
        .select("sent")
        .eq("user_id", user.id)
        .gte("scheduled_for", new Date().toISOString());

      if (error) throw error;

      const scheduled = data?.filter((n) => !n.sent).length || 0;
      const sent = data?.filter((n) => n.sent).length || 0;

      return { scheduled, sent };
    } catch (error) {
      console.error("Error obteniendo estadísticas:", error);

      return { scheduled: 0, sent: 0 };
    }
  }
}
