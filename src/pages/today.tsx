import { useState } from "react";
import { Button, Card, CardBody, Checkbox, Badge, Chip } from "@heroui/react";

import DefaultLayout from "@/layouts/default";
import { title } from "@/components/primitives";
import tasks from "@/data/weekly_tasks.json";
import completedTasks from "@/data/completed_tasks.json";
import {
  Task,
  CompletedTasks,
  getDayOfWeek,
  getColorClasses,
  calculateCurrentStreak,
  isStreakBrokenOnDay,
} from "@/utils/streakUtils";

export default function TodayPage() {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [completedTasksState, setCompletedTasksState] =
    useState<CompletedTasks>(completedTasks as CompletedTasks);

  // Get tasks for the selected day
  const selectedDayOfWeek = getDayOfWeek(selectedDate);
  const tasksForDay = (tasks as Task[]).filter((task) =>
    task.days.includes(selectedDayOfWeek),
  );

  const completedToday = completedTasksState[selectedDate] || [];

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
  const toggleTaskCompletion = (taskId: string) => {
    setCompletedTasksState((prev) => {
      const currentCompleted = prev[selectedDate] || [];
      const isCompleted = currentCompleted.includes(taskId);

      let newCompleted: string[];

      if (isCompleted) {
        // Remove task from completed
        newCompleted = currentCompleted.filter((id) => id !== taskId);
      } else {
        // Add task to completed
        newCompleted = [...currentCompleted, taskId];
      }

      const newState = { ...prev };

      if (newCompleted.length > 0) {
        newState[selectedDate] = newCompleted;
      } else {
        // Remove empty arrays to keep JSON clean
        delete newState[selectedDate];
      }

      return newState;
    });
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
          <div className="flex items-center justify-between mb-6 bg-white rounded-lg p-4 shadow-sm border">
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
                  month: "short",
                  year: "numeric",
                })}
              </p>
              {!isToday && (
                <Button
                  className="mt-1 text-blue-600"
                  size="sm"
                  variant="light"
                  onPress={goToToday}
                >
                  Ir a hoy
                </Button>
              )}
            </div>

            <Button
              isIconOnly
              className="text-gray-600 hover:text-gray-800"
              variant="light"
              onPress={goToNextDay}
            >
              →
            </Button>
          </div>

          {/* Tasks for the day */}
          <div className="space-y-4">
            {tasksForDay.length > 0 ? (
              tasksForDay.map((task) => {
                const isCompleted = completedToday.includes(task.id);
                const colorClasses = getColorClasses(task.color);
                const currentStreak = calculateCurrentStreak(
                  task,
                  completedTasksState,
                );
                const isStreakBroken =
                  !isCompleted &&
                  !isFuture &&
                  isStreakBrokenOnDay(task, selectedDate, completedTasksState);

                return (
                  <Card
                    key={task.id}
                    className={`transition-all duration-200 ${
                      isCompleted
                        ? `${colorClasses.bg} ${colorClasses.border} border-2`
                        : isStreakBroken
                          ? "bg-red-50 border-2 border-red-200"
                          : "bg-gray-50 border border-gray-200"
                    } ${isFuture ? "opacity-60" : ""}`}
                  >
                    <CardBody className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <Checkbox
                            color={isCompleted ? "success" : "default"}
                            isDisabled={isFuture}
                            isSelected={isCompleted}
                            size="lg"
                            onValueChange={() => toggleTaskCompletion(task.id)}
                          />

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3
                                className={`text-lg font-medium ${
                                  isCompleted
                                    ? `${colorClasses.text}`
                                    : isStreakBroken
                                      ? "text-red-700"
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
                        {completedToday.length}
                      </span>
                      <span className="text-blue-700 ml-1">completadas</span>
                    </div>
                    <div>
                      <span className="text-blue-600 font-medium">
                        {tasksForDay.length - completedToday.length}
                      </span>
                      <span className="text-blue-700 ml-1">pendientes</span>
                    </div>
                    <div>
                      <span className="text-blue-600 font-medium">
                        {Math.round(
                          (completedToday.length / tasksForDay.length) * 100,
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
