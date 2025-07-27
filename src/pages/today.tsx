import { useState, useEffect } from "react";
import { Button, Card, CardBody, Checkbox, Badge, Chip } from "@heroui/react";

import DefaultLayout from "@/layouts/default";
import { title } from "@/components/primitives";
import { TaskService, Task } from "@/services/taskService";
import { CompletionService } from "@/services/completionService";
import { StatsService, StreakStats } from "@/services/statsService";
import { useAuth } from "@/context/AuthContext";

// Helper functions
const getDayOfWeek = (dateString: string): string => {
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
};

const getTaskColorClasses = (color: string) => {
  const colorMap: Record<string, { bg: string; text: string; border: string }> =
    {
      blue: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        border: "border-blue-200",
      },
      green: {
        bg: "bg-green-100",
        text: "text-green-800",
        border: "border-green-200",
      },
      red: { bg: "bg-red-100", text: "text-red-800", border: "border-red-200" },
      orange: {
        bg: "bg-orange-100",
        text: "text-orange-800",
        border: "border-orange-200",
      },
      purple: {
        bg: "bg-purple-100",
        text: "text-purple-800",
        border: "border-purple-200",
      },
      pink: {
        bg: "bg-pink-100",
        text: "text-pink-800",
        border: "border-pink-200",
      },
      indigo: {
        bg: "bg-indigo-100",
        text: "text-indigo-800",
        border: "border-indigo-200",
      },
      teal: {
        bg: "bg-teal-100",
        text: "text-teal-800",
        border: "border-teal-200",
      },
      gray: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        border: "border-gray-200",
      },
    };

  return colorMap[color] || colorMap.gray;
};

export default function TodayPage() {
  const { user, loading: authLoading } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskStats, setTaskStats] = useState<Record<string, StreakStats>>({});
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get tasks for the selected day
  const selectedDayOfWeek = getDayOfWeek(selectedDate);
  const tasksForDay = tasks.filter(
    (task) =>
      task.days.includes(selectedDayOfWeek) && selectedDate >= task.created_at,
  );

  useEffect(() => {
    if (!user || authLoading) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [tasksData, statsData, completionsData] = await Promise.all([
          TaskService.getTasks(),
          StatsService.getUserStats(),
          CompletionService.getCompletionsForDate(selectedDate),
        ]);

        setTasks(tasksData);
        setTaskStats(statsData.taskStreaks);
        setCompletedTaskIds(
          completionsData.map((completion) => completion.task_id),
        );
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setError("Error al cargar los datos. Por favor, inténtalo de nuevo.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading, selectedDate]);

  // Navigation functions
  const goToPreviousDay = () => {
    const date = new Date(selectedDate);

    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().slice(0, 10));
  };

  const goToNextDay = () => {
    const date = new Date(selectedDate);

    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().slice(0, 10));
  };

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().slice(0, 10));
  };

  // Toggle task completion
  const toggleTaskCompletion = async (taskId: string) => {
    try {
      const isCompleted = completedTaskIds.includes(taskId);

      if (isCompleted) {
        await CompletionService.markTaskIncomplete(taskId, selectedDate);
        setCompletedTaskIds((prev) => prev.filter((id) => id !== taskId));
      } else {
        await CompletionService.markTaskComplete(taskId, selectedDate);
        setCompletedTaskIds((prev) => [...prev, taskId]);
      }

      // Refresh stats after completion change
      const updatedStats = await StatsService.getUserStats();

      setTaskStats(updatedStats.taskStreaks);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setError("Error al actualizar la tarea. Por favor, inténtalo de nuevo.");
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date();

    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date();

    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateString === today) {
      return "Hoy";
    } else if (dateString === yesterday.toISOString().slice(0, 10)) {
      return "Ayer";
    } else if (dateString === tomorrow.toISOString().slice(0, 10)) {
      return "Mañana";
    } else {
      return date.toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
    }
  };

  if (authLoading || loading) {
    return (
      <DefaultLayout>
        <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
          <div className="animate-pulse text-center">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4" />
            <div className="h-4 bg-gray-200 rounded w-48 mx-auto" />
          </div>
        </section>
      </DefaultLayout>
    );
  }

  if (error) {
    return (
      <DefaultLayout>
        <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
          <div className="text-center">
            <h1 className={title()}>Error</h1>
            <p className="text-red-600 mt-4">{error}</p>
          </div>
        </section>
      </DefaultLayout>
    );
  }

  if (!user) {
    return (
      <DefaultLayout>
        <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
          <div className="text-center">
            <h1 className={title()}>Acceso Requerido</h1>
            <p className="text-gray-600 mt-4">
              Debes iniciar sesión para ver tus tareas.
            </p>
          </div>
        </section>
      </DefaultLayout>
    );
  }

  const isToday = selectedDate === new Date().toISOString().slice(0, 10);
  const isFuture = selectedDate > new Date().toISOString().slice(0, 10);

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="inline-block max-w-lg text-center justify-center">
          <h1 className={title()}>Tareas Diarias</h1>
        </div>

        <div className="max-w-4xl w-full px-4">
          {/* Date Navigation */}
          <div className="flex items-center justify-between mb-6 bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border-0">
            <Button
              isIconOnly
              className="text-gray-600 hover:text-gray-800"
              variant="light"
              onPress={goToPreviousDay}
            >
              ←
            </Button>

            <div className="text-center">
              <h2 className="text-xl font-semibold capitalize">
                {formatDate(selectedDate)}
              </h2>
              <p className="text-sm text-gray-500">
                {new Date(selectedDate).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>

            <div className="flex gap-2">
              {!isToday && (
                <Button size="sm" variant="flat" onPress={goToToday}>
                  Hoy
                </Button>
              )}
              <Button
                isIconOnly
                className="text-gray-600 hover:text-gray-800"
                variant="light"
                onPress={goToNextDay}
              >
                →
              </Button>
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-4">
            {tasksForDay.length > 0 ? (
              tasksForDay.map((task) => {
                const isCompleted = completedTaskIds.includes(task.id);
                const stats = taskStats[task.id];
                const currentStreak = stats?.currentStreak || 0;
                const colorClasses = getTaskColorClasses(task.color);

                // Check if streak would be broken (only for today and past days)
                const isStreakBroken =
                  !isFuture && !isCompleted && stats?.isStreakBroken;

                return (
                  <Card
                    key={task.id}
                    className={`${colorClasses.border} ${
                      isCompleted ? colorClasses.bg : "bg-white/90"
                    } shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2`}
                  >
                    <CardBody className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <Checkbox
                            className="scale-125"
                            color="success"
                            isDisabled={isFuture}
                            isSelected={isCompleted}
                            size="lg"
                            onValueChange={() => toggleTaskCompletion(task.id)}
                          />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3
                              className={`text-xl font-bold ${
                                isCompleted
                                  ? `line-through ${colorClasses.text}`
                                  : "text-gray-800"
                              }`}
                            >
                              {task.name}
                            </h3>

                            {isStreakBroken && (
                              <Chip color="danger" size="sm" variant="flat">
                                💔 Racha rota
                              </Chip>
                            )}

                            {isFuture && (
                              <Chip color="default" size="sm" variant="flat">
                                🔮 Día futuro
                              </Chip>
                            )}

                            {isCompleted && (
                              <Chip color="success" size="sm" variant="flat">
                                ✅ Completada
                              </Chip>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>⏰ {task.time}</span>
                            <span>🔥 Racha actual: {currentStreak}</span>
                            <Badge color="default" size="sm" variant="flat">
                              {task.days
                                .map((day) => {
                                  const dayMap: { [key: string]: string } = {
                                    monday: "L",
                                    tuesday: "M",
                                    wednesday: "X",
                                    thursday: "J",
                                    friday: "V",
                                    saturday: "S",
                                    sunday: "D",
                                  };

                                  return dayMap[day] || "?";
                                })
                                .join("")}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })
            ) : (
              <Card className="bg-gray-50">
                <CardBody className="p-8 text-center">
                  <div className="text-gray-500">
                    <div className="text-4xl mb-2">🎉</div>
                    <h3 className="text-lg font-medium mb-1">¡Día libre!</h3>
                    <p className="text-sm">
                      No tienes tareas programadas para este día.
                    </p>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>

          {/* Day Summary */}
          {tasksForDay.length > 0 && (
            <Card className="mt-6 bg-blue-50 border-blue-200">
              <CardBody className="p-4">
                <div className="text-center">
                  <h3 className="font-semibold text-blue-800 mb-2">
                    Resumen del día
                  </h3>
                  <div className="flex justify-center gap-6 text-sm">
                    <div>
                      <span className="text-blue-600 font-medium">
                        {completedTaskIds.length}
                      </span>
                      <span className="text-blue-700 ml-1">completadas</span>
                    </div>
                    <div>
                      <span className="text-blue-600 font-medium">
                        {tasksForDay.length - completedTaskIds.length}
                      </span>
                      <span className="text-blue-700 ml-1">pendientes</span>
                    </div>
                    <div>
                      <span className="text-blue-600 font-medium">
                        {Math.round(
                          (completedTaskIds.length / tasksForDay.length) * 100,
                        )}
                        %
                      </span>
                      <span className="text-blue-700 ml-1">progreso</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </section>
    </DefaultLayout>
  );
}
