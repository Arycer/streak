import { Badge, Card, CardBody } from "@heroui/react";

import DefaultLayout from "@/layouts/default";
import { title } from "@/components/primitives";
import tasks from "@/data/weekly_tasks.json";
import completedTasks from "@/data/completed_tasks.json";
import {
  Task,
  CompletedTasks,
  getAllDates,
  calculateCurrentStreak,
  calculatePreviousStreak,
  calculateLongestStreak,
  getCompletionCount,
  isStreakBrokenOnDay,
  isTaskMissedOnDay,
  getDayAbbreviations,
  getColorClasses,
  calculateConsistencyPercentage,
} from "@/utils/streakUtils";

export default function SummaryPage() {
  const last30Days = getAllDates();

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="inline-block max-w-lg text-center justify-center">
          <h1 className={title()}>Resumen de Tareas</h1>
        </div>

        <div className="max-w-6xl w-full px-4">
          {/* Task Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {(tasks as Task[]).map((task) => {
              const currentStreak = calculateCurrentStreak(
                task,
                completedTasks as CompletedTasks,
              );
              const previousStreak = calculatePreviousStreak(
                task,
                completedTasks as CompletedTasks,
              );
              const longestStreak = calculateLongestStreak(
                task,
                completedTasks as CompletedTasks,
              );
              const completionCount = getCompletionCount(
                task,
                completedTasks as CompletedTasks,
              );
              const colorClasses = getColorClasses(task.color);

              return (
                <Card
                  key={task.id}
                  className={`${colorClasses.border} ${colorClasses.bg}`}
                >
                  <CardBody className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`font-semibold ${colorClasses.text}`}>
                        {task.name}
                      </h3>
                      <Badge color="default" size="sm" variant="flat">
                        {getDayAbbreviations(task.days)}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Racha actual:</span>
                        <span className="font-medium">
                          {currentStreak} veces
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Racha anterior:</span>
                        <span className="font-medium">
                          {previousStreak} veces
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Mejor racha:</span>
                        <span className="font-medium">
                          {longestStreak} veces
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Últimos 30 días:</span>
                        <span className="font-medium">
                          {completionCount} veces
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
            <h2 className="text-2xl font-bold mb-4">Actividad Reciente</h2>

            {/* Activity Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardBody className="text-center p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {
                      last30Days.filter((day) => {
                        const completed =
                          (completedTasks as CompletedTasks)[day] || [];

                        return completed.length > 0;
                      }).length
                    }
                  </div>
                  <div className="text-sm text-gray-600">Días activos</div>
                </CardBody>
              </Card>

              <Card>
                <CardBody className="text-center p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {last30Days.reduce((total, day) => {
                      const completed =
                        (completedTasks as CompletedTasks)[day] || [];

                      return total + completed.length;
                    }, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total completadas</div>
                </CardBody>
              </Card>

              <Card>
                <CardBody className="text-center p-4">
                  <div className="text-2xl font-bold text-purple-600">
                    {calculateConsistencyPercentage(
                      tasks as Task[],
                      completedTasks as CompletedTasks,
                    )}
                    %
                  </div>
                  <div className="text-sm text-gray-600">Consistencia</div>
                </CardBody>
              </Card>
            </div>

            {/* Daily Activity Cards */}
            <div className="space-y-3">
              {last30Days.reverse().map((day) => {
                const completed = (completedTasks as CompletedTasks)[day] || [];
                const date = new Date(day);
                const dayName = date.toLocaleDateString("es-ES", {
                  weekday: "long",
                });
                const formattedDate = date.toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                });

                // Check for streak breaks and missed tasks
                const streakBreaks = (tasks as Task[]).filter((task) =>
                  isStreakBrokenOnDay(
                    task,
                    day,
                    completedTasks as CompletedTasks,
                  ),
                );
                const missedTasks = (tasks as Task[]).filter((task) =>
                  isTaskMissedOnDay(
                    task,
                    day,
                    completedTasks as CompletedTasks,
                  ),
                );

                return (
                  <Card key={day} className="w-full">
                    <CardBody className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg capitalize">
                            {formattedDate}
                          </h3>
                          <p className="text-sm text-gray-600 capitalize">
                            {dayName}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-800">
                            {completed.length}
                          </div>
                          <div className="text-xs text-gray-500">
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
                      {completed.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {completed.map((taskId) => {
                            const task = (tasks as Task[]).find(
                              (t) => t.id === taskId,
                            );

                            if (!task) return null;

                            const colorClasses = getColorClasses(task.color);

                            return (
                              <div
                                key={taskId}
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
