import { useState, useEffect } from "react";
import { Badge, Card, CardBody, Select, SelectItem } from "@heroui/react";

import DefaultLayout from "@/layouts/default";
import { title } from "@/components/primitives";
import { TaskService, Task } from "@/services/taskService";
import {
  StatsService,
  StreakStats,
  DailyHistoryItem,
} from "@/services/statsService";
import { useAuth } from "@/context/AuthContext";

// Helper functions (adapted from streakUtils)
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

const getTaskDayAbbreviations = (days: string[]) => {
  const dayMap: Record<string, string> = {
    monday: "L",
    tuesday: "M",
    wednesday: "X",
    thursday: "J",
    friday: "V",
    saturday: "S",
    sunday: "D",
  };

  return days
    .map((day) => dayMap[day.toLowerCase()] || day.slice(0, 1).toUpperCase())
    .join("");
};

export default function SummaryPage() {
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskStats, setTaskStats] = useState<Record<string, StreakStats>>({});
  const [dailyHistory, setDailyHistory] = useState<DailyHistoryItem[]>([]);
  const [selectedDays, setSelectedDays] = useState<string>("7");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || authLoading) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [tasksData, statsData, historyData] = await Promise.all([
          TaskService.getTasks(),
          StatsService.getUserStats(),
          StatsService.getDailyHistory(30),
        ]);

        setTasks(tasksData);
        setTaskStats(statsData.taskStreaks);
        setDailyHistory(historyData);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setError("Error al cargar los datos. Por favor, inténtalo de nuevo.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading]);

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
              Debes iniciar sesión para ver tu resumen.
            </p>
          </div>
        </section>
      </DefaultLayout>
    );
  }

  // Calculate overall stats
  const totalCompletions = dailyHistory.reduce(
    (total, day) => total + day.completedTasks.length,
    0,
  );
  const activeDays = dailyHistory.filter(
    (day) => day.completedTasks.length > 0,
  ).length;
  const overallConsistency = Math.round(
    (activeDays / Math.max(dailyHistory.length, 1)) * 100,
  );

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="inline-block max-w-lg text-center justify-center">
          <h1 className={title()}>Resumen de Tareas</h1>
        </div>

        <div className="max-w-6xl w-full px-4">
          {/* Task Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {tasks.map((task) => {
              const stats = taskStats[task.id];
              const colorClasses = getTaskColorClasses(task.color);

              return (
                <Card
                  key={task.id}
                  className={`${colorClasses.border} ${colorClasses.bg} shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
                >
                  <CardBody className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3
                        className={`text-lg font-semibold ${colorClasses.text}`}
                      >
                        {task.name}
                      </h3>
                      <Badge color="default" size="sm" variant="flat">
                        {getTaskDayAbbreviations(task.days)}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Racha actual:</span>
                        <span className="font-medium">
                          {stats?.currentStreak || 0} veces
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Racha anterior:</span>
                        <span className="font-medium">
                          {stats?.previousStreak || 0} veces
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Mejor racha:</span>
                        <span className="font-medium">
                          {stats?.longestStreak || 0} veces
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Últimos 30 días:</span>
                        <span className="font-medium">
                          {stats?.completionCount || 0} veces
                        </span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>

          {/* Recent Activity */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Actividad Reciente</h2>
              <div className="w-32">
                <Select
                  label="Días"
                  selectedKeys={[selectedDays]}
                  size="sm"
                  onSelectionChange={(keys) => {
                    const days = Array.from(keys)[0] as string;

                    setSelectedDays(days);
                  }}
                >
                  <SelectItem key="7">7 días</SelectItem>
                  <SelectItem key="14">14 días</SelectItem>
                  <SelectItem key="31">31 días</SelectItem>
                </Select>
              </div>
            </div>

            {/* Activity Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-blue-100 to-blue-200 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardBody className="text-center p-6">
                  <div className="text-3xl font-bold text-blue-700 mb-2">
                    {activeDays}
                  </div>
                  <div className="text-sm text-blue-600 font-medium">
                    Días activos
                  </div>
                </CardBody>
              </Card>

              <Card className="bg-gradient-to-br from-green-100 to-green-200 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardBody className="text-center p-6">
                  <div className="text-3xl font-bold text-green-700 mb-2">
                    {totalCompletions}
                  </div>
                  <div className="text-sm text-green-600 font-medium">
                    Total completadas
                  </div>
                </CardBody>
              </Card>

              <Card className="bg-gradient-to-br from-purple-100 to-purple-200 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardBody className="text-center p-6">
                  <div className="text-3xl font-bold text-purple-700 mb-2">
                    {overallConsistency}%
                  </div>
                  <div className="text-sm text-purple-600 font-medium">
                    Consistencia
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Daily Activity Cards */}
            <div className="space-y-3">
              {dailyHistory
                .slice(0, parseInt(selectedDays))
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime(),
                )
                .map((day) => {
                  const date = new Date(day.date);
                  const dayName = date.toLocaleDateString("es-ES", {
                    weekday: "long",
                  });
                  const formattedDate = date.toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "short",
                  });

                  // Check for streak breaks and missed tasks for this day
                  const streakBreaks = day.streakBrokenTasks || [];
                  const missedTasks = day.missedTasks || [];

                  return (
                    <Card
                      key={day.date}
                      className="w-full bg-gradient-to-r from-white/90 to-blue-50/80 backdrop-blur-sm border border-blue-200/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01]"
                    >
                      <CardBody className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div>
                              <h3 className="font-bold text-xl text-gray-800 capitalize">
                                {formattedDate}
                              </h3>
                              <p className="text-sm text-blue-600 font-medium capitalize">
                                {dayName}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                              {day.completedTasks.length}
                            </div>
                            <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">
                              completadas
                            </div>
                          </div>
                        </div>

                        {/* Streak Break Alerts */}
                        {streakBreaks.map((task) => (
                          <div
                            key={`break-${task.id}`}
                            className="mb-2 p-3 bg-red-50 border-l-4 border-red-500 rounded"
                          >
                            <div className="flex items-center">
                              <span className="text-red-600 mr-2">💔</span>
                              <div>
                                <div className="font-semibold text-red-800">
                                  ¡RACHA ROTA!
                                </div>
                                <div className="text-sm text-red-600">
                                  {task.name} - Se rompió tu racha
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Missed Task Alerts */}
                        {missedTasks.map((task) => (
                          <div
                            key={`missed-${task.id}`}
                            className="mb-2 p-2 bg-orange-50 border-l-4 border-orange-400 rounded"
                          >
                            <div className="flex items-center">
                              <span className="text-orange-500 mr-2">⚠️</span>
                              <div className="text-sm text-orange-700">
                                Tarea no completada: {task.name}
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Completed Tasks */}
                        {day.completedTasks.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {day.completedTasks.map((task) => {
                              const colorClasses = getTaskColorClasses(
                                task.color,
                              );

                              return (
                                <div
                                  key={task.id}
                                  className={`p-2 rounded-lg ${colorClasses.bg} ${colorClasses.border} border`}
                                >
                                  <div
                                    className={`font-medium text-sm ${colorClasses.text}`}
                                  >
                                    {task.name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {task.time}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          !streakBreaks.length &&
                          !missedTasks.length && (
                            <div className="flex items-center text-gray-500 text-sm">
                              <span className="mr-2">⭕</span>
                              No se completaron tareas este día
                            </div>
                          )
                        )}
                      </CardBody>
                    </Card>
                  );
                })}
            </div>
          </div>
        </div>
      </section>
    </DefaultLayout>
  );
}
