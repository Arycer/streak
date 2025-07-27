import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Input,
  Select,
  SelectItem,
  Chip,
} from "@heroui/react";

import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import { TaskService, Task } from "@/services/taskService";
import { useAuth } from "@/context/AuthContext";

// Types
interface NewTask {
  name: string;
  days: string[];
  time: string;
  color: string;
}

const DAYS_OF_WEEK = [
  { key: "monday", label: "Lunes", short: "LUN" },
  { key: "tuesday", label: "Martes", short: "MAR" },
  { key: "wednesday", label: "Miércoles", short: "MIÉ" },
  { key: "thursday", label: "Jueves", short: "JUE" },
  { key: "friday", label: "Viernes", short: "VIE" },
  { key: "saturday", label: "Sábado", short: "SÁB" },
  { key: "sunday", label: "Domingo", short: "DOM" },
];

const TIME_SLOTS = [
  "06:00",
  "06:30",
  "07:00",
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
  "22:30",
  "23:00",
];

// Color palette for different tasks
const getTaskColorClasses = (color: string) => {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-100 border-blue-300 hover:bg-blue-200",
    green: "bg-green-100 border-green-300 hover:bg-green-200",
    purple: "bg-purple-100 border-purple-300 hover:bg-purple-200",
    orange: "bg-orange-100 border-orange-300 hover:bg-orange-200",
    pink: "bg-pink-100 border-pink-300 hover:bg-pink-200",
    indigo: "bg-indigo-100 border-indigo-300 hover:bg-indigo-200",
    teal: "bg-teal-100 border-teal-300 hover:bg-teal-200",
    red: "bg-red-100 border-red-300 hover:bg-red-200",
  };

  return colorMap[color] || "bg-gray-100 border-gray-300 hover:bg-gray-200";
};

const AVAILABLE_COLORS = [
  { key: "blue", label: "Azul" },
  { key: "green", label: "Verde" },
  { key: "purple", label: "Morado" },
  { key: "orange", label: "Naranja" },
  { key: "pink", label: "Rosa" },
  { key: "indigo", label: "Índigo" },
  { key: "teal", label: "Teal" },
  { key: "red", label: "Rojo" },
];

export default function WeekPage() {
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState<NewTask>({
    name: "",
    days: [],
    time: "08:00",
    color: "blue",
  });
  const [draggedTask, setDraggedTask] = useState<{
    task: Task;
    sourceDay: string | null;
  } | null>(null);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);
  const [isTaskPaletteOpen, setIsTaskPaletteOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const {
    isOpen: isNewOpen,
    onOpen: onNewOpen,
    onClose: onNewClose,
  } = useDisclosure();

  // Check if device is mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  useEffect(() => {
    if (!user || authLoading) return;

    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        const tasksData = await TaskService.getTasks();

        setTasks(tasksData);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setError("Error al cargar las tareas. Por favor, inténtalo de nuevo.");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [user, authLoading]);

  // Group tasks by day and time for display
  const getTasksForDay = (day: string) => {
    return tasks
      .filter((task) => task.days.includes(day))
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  // Handle task editing
  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    onEditOpen();
  };

  // Handle task deletion
  const handleDeleteTask = async (taskId: string) => {
    try {
      await TaskService.deleteTask(taskId);
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      onEditClose();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setError("Error al eliminar la tarea. Por favor, inténtalo de nuevo.");
    }
  };

  // Handle task update
  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      const updated = await TaskService.updateTask(updatedTask.id, {
        name: updatedTask.name,
        days: updatedTask.days,
        time: updatedTask.time,
        color: updatedTask.color,
      });

      setTasks((prev) =>
        prev.map((task) => (task.id === updated.id ? updated : task)),
      );
      onEditClose();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setError("Error al actualizar la tarea. Por favor, inténtalo de nuevo.");
    }
  };

  // Handle new task creation
  const handleCreateTask = async () => {
    if (!newTask.name.trim() || newTask.days.length === 0) return;

    try {
      const created = await TaskService.createTask({
        name: newTask.name.trim(),
        days: newTask.days,
        time: newTask.time,
        color: newTask.color,
      });

      setTasks((prev) => [...prev, created]);
      setNewTask({
        name: "",
        days: [],
        time: "08:00",
        color: "blue",
      });
      onNewClose();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setError("Error al crear la tarea. Por favor, inténtalo de nuevo.");
    }
  };

  // Toggle day for new task
  const toggleDay = (day: string) => {
    setNewTask((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  };

  // Toggle day for existing task
  const toggleTaskDay = (day: string) => {
    if (!selectedTask) return;
    setSelectedTask((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        days: prev.days.includes(day)
          ? prev.days.filter((d) => d !== day)
          : [...prev.days, day],
      };
    });
  };

  // Drag and drop handlers
  const handleDragStart = (
    e: React.DragEvent,
    task: Task,
    sourceDay: string | null = null,
  ) => {
    setDraggedTask({ task, sourceDay });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, targetDay: string) => {
    e.preventDefault();
    setDragOverDay(targetDay);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverDay(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetDay: string) => {
    e.preventDefault();
    setDragOverDay(null);

    if (!draggedTask) return;

    const { task, sourceDay } = draggedTask;

    // Don't do anything if dropping on the same day
    if (sourceDay === targetDay) {
      setDraggedTask(null);

      return;
    }

    try {
      let updatedDays = [...task.days];

      if (sourceDay) {
        // Moving from one day to another - remove from source, add to target
        updatedDays = updatedDays.filter((day) => day !== sourceDay);
        if (!updatedDays.includes(targetDay)) {
          updatedDays.push(targetDay);
        }
      } else {
        // Adding to a new day from palette
        if (!updatedDays.includes(targetDay)) {
          updatedDays.push(targetDay);
        }
      }

      const updated = await TaskService.updateTask(task.id, {
        name: task.name,
        days: updatedDays,
        time: task.time,
        color: task.color,
      });

      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setError("Error al mover la tarea. Por favor, inténtalo de nuevo.");
    }

    setDraggedTask(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverDay(null);
  };

  // Handle dropping task outside calendar (delete from day)
  const handleDeleteDrop = async (e: React.DragEvent) => {
    e.preventDefault();

    if (!draggedTask || !draggedTask.sourceDay) return;

    const { task, sourceDay } = draggedTask;

    try {
      const updatedDays = task.days.filter((day) => day !== sourceDay);

      if (updatedDays.length === 0) {
        // If no days left, delete the entire task
        await TaskService.deleteTask(task.id);
        setTasks((prev) => prev.filter((t) => t.id !== task.id));
      } else {
        // Otherwise just remove from that day
        const updated = await TaskService.updateTask(task.id, {
          name: task.name,
          days: updatedDays,
          time: task.time,
          color: task.color,
        });

        setTasks((prev) =>
          prev.map((t) => (t.id === updated.id ? updated : t)),
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setError(
        "Error al eliminar la tarea del día. Por favor, inténtalo de nuevo.",
      );
    }

    setDraggedTask(null);
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
            <Button
              className="mt-4"
              color="primary"
              onPress={() => window.location.reload()}
            >
              Reintentar
            </Button>
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
              Debes iniciar sesión para ver tu calendario semanal.
            </p>
          </div>
        </section>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="inline-block max-w-lg text-center justify-center">
          <h1 className={title()}>Calendario Semanal</h1>
        </div>

        <div className="max-w-7xl w-full px-4">
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 mb-6">
            <Button
              className="font-medium w-full sm:w-auto"
              color="primary"
              onPress={onNewOpen}
            >
              Nueva Tarea
            </Button>
            <Button
              className="hidden sm:block w-full sm:w-auto"
              color="secondary"
              variant="flat"
              onPress={() => setIsTaskPaletteOpen(!isTaskPaletteOpen)}
            >
              {isTaskPaletteOpen ? "Ocultar" : "Mostrar"} Paleta de Tareas
            </Button>
          </div>

          {/* Task Palette */}
          {isTaskPaletteOpen && (
            <Card className="mb-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardBody className="p-4">
                <h3 className="text-base sm:text-lg font-semibold mb-3">
                  <span className="sm:hidden">Paleta de Tareas</span>
                  <span className="hidden sm:inline">
                    Paleta de Tareas (Arrastra para asignar)
                  </span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                  {tasks.map((task) => (
                    <div
                      key={`palette-${task.id}`}
                      draggable
                      aria-label={`Arrastrar tarea ${task.name}`}
                      className={`p-2 rounded-lg border cursor-move transition-all ${getTaskColorClasses(
                        task.color,
                      )} ${
                        draggedTask?.task.id === task.id
                          ? "opacity-50 scale-95"
                          : ""
                      }`}
                      role="button"
                      tabIndex={0}
                      onDragEnd={handleDragEnd}
                      onDragStart={(e) => handleDragStart(e, task)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          // Could implement keyboard drag functionality here
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">📋</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {task.name}
                          </div>
                          <div className="text-xs text-gray-600">
                            {task.time}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Weekly Calendar Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-4">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day.key} className="text-center">
                <h3 className="font-semibold text-lg mb-2 sm:text-base lg:text-lg">
                  <span className="sm:hidden">{day.label}</span>
                  <span className="hidden sm:inline lg:hidden">
                    {day.short}
                  </span>
                  <span className="hidden lg:inline">{day.short}</span>
                </h3>
                <div
                  className={`min-h-[300px] sm:min-h-[350px] lg:min-h-[400px] p-2 sm:p-3 rounded-xl border-2 border-dashed transition-all ${
                    dragOverDay === day.key
                      ? "border-blue-400 bg-blue-100/50 backdrop-blur-sm"
                      : "border-gray-300/50 bg-white/30 backdrop-blur-sm"
                  }`}
                  onDragLeave={handleDragLeave}
                  onDragOver={(e) => handleDragOver(e, day.key)}
                  onDrop={(e) => handleDrop(e, day.key)}
                >
                  <div className="space-y-2">
                    {getTasksForDay(day.key).map((task) => (
                      <div
                        key={`${task.id}-${day.key}`}
                        aria-label={`Tarea ${task.name} en ${day.label}. Click para editar${!isMobile ? " o arrastrar para mover" : ""}`}
                        className={`p-2 sm:p-3 rounded-lg border cursor-pointer sm:cursor-move transition-all shadow-md hover:shadow-lg hover:scale-105 ${getTaskColorClasses(
                          task.color,
                        )} ${
                          draggedTask?.task.id === task.id &&
                          draggedTask?.sourceDay === day.key
                            ? "opacity-50 scale-95"
                            : ""
                        }`}
                        draggable={!isMobile}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleEditTask(task)}
                        onDragEnd={!isMobile ? handleDragEnd : undefined}
                        onDragStart={
                          !isMobile
                            ? (e) => handleDragStart(e, task, day.key)
                            : undefined
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleEditTask(task);
                          } else if (e.key === " ") {
                            e.preventDefault();
                            // Could implement keyboard drag functionality here
                          }
                        }}
                      >
                        <div className="text-sm font-medium truncate">
                          {task.name}
                        </div>
                        <div className="text-xs text-gray-600">{task.time}</div>
                      </div>
                    ))}

                    {!isMobile && dragOverDay === day.key && (
                      <div className="p-2 text-center text-xs sm:text-sm text-blue-600 bg-blue-100 rounded-lg border-2 border-dashed border-blue-300">
                        Suelta aquí
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Delete Zone */}
          {!isMobile && draggedTask && draggedTask.sourceDay && (
            <div
              aria-label="Zona de eliminación de tareas"
              className="fixed bottom-4 right-4 p-4 bg-red-100 border-2 border-dashed border-red-400 rounded-lg text-red-700 text-center z-50"
              role="region"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDeleteDrop}
            >
              <div className="text-2xl mb-1">🗑️</div>
              <div className="text-sm font-medium">
                Eliminar del{" "}
                {
                  DAYS_OF_WEEK.find((d) => d.key === draggedTask.sourceDay)
                    ?.label
                }
              </div>
            </div>
          )}
        </div>

        {/* Edit Task Modal */}
        <Modal isOpen={isEditOpen} size="2xl" onClose={onEditClose}>
          <ModalContent>
            <ModalHeader>Editar Tarea</ModalHeader>
            <ModalBody>
              {selectedTask && (
                <div className="space-y-4">
                  <Input
                    label="Nombre de la tarea"
                    value={selectedTask.name}
                    onChange={(e) =>
                      setSelectedTask({
                        ...selectedTask,
                        name: e.target.value,
                      })
                    }
                  />

                  <Select
                    label="Hora"
                    selectedKeys={[selectedTask.time]}
                    onSelectionChange={(keys) => {
                      const time = Array.from(keys)[0] as string;

                      setSelectedTask({ ...selectedTask, time });
                    }}
                  >
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time}>{time}</SelectItem>
                    ))}
                  </Select>

                  <div>
                    <p className="text-sm font-medium mb-2">
                      Días de la semana:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <Chip
                          key={day.key}
                          className="cursor-pointer"
                          color={
                            selectedTask.days.includes(day.key)
                              ? "primary"
                              : "default"
                          }
                          variant={
                            selectedTask.days.includes(day.key)
                              ? "solid"
                              : "bordered"
                          }
                          onClick={() => toggleTaskDay(day.key)}
                        >
                          {day.short}
                        </Chip>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Color:</p>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_COLORS.map((colorOption) => (
                        <div
                          key={colorOption.key}
                          aria-label={`Seleccionar color ${colorOption.label}`}
                          aria-pressed={selectedTask.color === colorOption.key}
                          className={`w-8 h-8 rounded-full cursor-pointer border-2 transition-all ${
                            selectedTask.color === colorOption.key
                              ? "border-gray-800 scale-110"
                              : "border-gray-300 hover:border-gray-500"
                          } ${getTaskColorClasses(colorOption.key).split(" ")[0]}`}
                          role="button"
                          tabIndex={0}
                          title={colorOption.label}
                          onClick={() =>
                            setSelectedTask({
                              ...selectedTask,
                              color: colorOption.key,
                            })
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedTask({
                                ...selectedTask,
                                color: colorOption.key,
                              });
                            }
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button
                color="danger"
                variant="light"
                onPress={() =>
                  selectedTask && handleDeleteTask(selectedTask.id)
                }
              >
                Eliminar
              </Button>
              <Button color="default" variant="light" onPress={onEditClose}>
                Cancelar
              </Button>
              <Button
                color="primary"
                onPress={() => selectedTask && handleUpdateTask(selectedTask)}
              >
                Guardar
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* New Task Modal */}
        <Modal isOpen={isNewOpen} size="2xl" onClose={onNewClose}>
          <ModalContent>
            <ModalHeader>Nueva Tarea</ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <Input
                  label="Nombre de la tarea"
                  placeholder="Ej: Hacer ejercicio"
                  value={newTask.name}
                  onChange={(e) =>
                    setNewTask({ ...newTask, name: e.target.value })
                  }
                />

                <Select
                  label="Hora"
                  selectedKeys={[newTask.time]}
                  onSelectionChange={(keys) => {
                    const time = Array.from(keys)[0] as string;

                    setNewTask({ ...newTask, time });
                  }}
                >
                  {TIME_SLOTS.map((time) => (
                    <SelectItem key={time}>{time}</SelectItem>
                  ))}
                </Select>

                <div>
                  <p className="text-sm font-medium mb-2">Días de la semana:</p>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <Chip
                        key={day.key}
                        className="cursor-pointer"
                        color={
                          newTask.days.includes(day.key) ? "primary" : "default"
                        }
                        variant={
                          newTask.days.includes(day.key) ? "solid" : "bordered"
                        }
                        onClick={() => toggleDay(day.key)}
                      >
                        {day.short}
                      </Chip>
                    ))}
                  </div>
                  {newTask.days.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      Selecciona al menos un día
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Color:</p>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_COLORS.map((colorOption) => (
                      <div
                        key={colorOption.key}
                        aria-label={`Seleccionar color ${colorOption.label}`}
                        aria-pressed={newTask.color === colorOption.key}
                        className={`w-8 h-8 rounded-full cursor-pointer border-2 transition-all ${
                          newTask.color === colorOption.key
                            ? "border-gray-800 scale-110"
                            : "border-gray-300 hover:border-gray-500"
                        } ${getTaskColorClasses(colorOption.key).split(" ")[0]}`}
                        role="button"
                        tabIndex={0}
                        title={colorOption.label}
                        onClick={() =>
                          setNewTask({ ...newTask, color: colorOption.key })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setNewTask({ ...newTask, color: colorOption.key });
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="default" variant="light" onPress={onNewClose}>
                Cancelar
              </Button>
              <Button
                color="primary"
                isDisabled={!newTask.name.trim() || newTask.days.length === 0}
                onPress={handleCreateTask}
              >
                Crear Tarea
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </section>
    </DefaultLayout>
  );
}
