import { useState } from "react";
import {
  Card,
  CardBody,
  Badge,
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
import tasks from "@/data/weekly_tasks.json";

// Types
interface Task {
  id: string;
  name: string;
  days: string[];
  time: string;
  color: string;
}

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

// Clean up task data to ensure all IDs are valid
const cleanTaskData = (tasks: Task[]): Task[] => {
  return tasks.filter(
    (task) =>
      task.id &&
      !isNaN(parseInt(task.id)) &&
      task.name &&
      task.days &&
      Array.isArray(task.days) &&
      task.time &&
      task.color,
  );
};

export default function WeekPage() {
  const [weeklyTasks, setWeeklyTasks] = useState<Task[]>(
    cleanTaskData(tasks as Task[]),
  );
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

  // Group tasks by day and time for display
  const getTasksForDay = (day: string) => {
    return weeklyTasks
      .filter((task) => task.days.includes(day))
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  // Handle task editing
  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    onEditOpen();
  };

  // Handle task deletion
  const handleDeleteTask = (taskId: string) => {
    setWeeklyTasks((prev) => prev.filter((task) => task.id !== taskId));
    onEditClose();
  };

  // Handle task update
  const handleUpdateTask = (updatedTask: Task) => {
    setWeeklyTasks((prev) =>
      prev.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
    );
    onEditClose();
  };

  // Handle new task creation
  const handleCreateTask = () => {
    if (newTask.name.trim() && newTask.days.length > 0) {
      // Generate a safe new ID
      const existingIds = weeklyTasks
        .map((t) => parseInt(t.id))
        .filter((id) => !isNaN(id));
      const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
      const newId = (maxId + 1).toString();
      const taskToAdd: Task = {
        id: newId,
        name: newTask.name.trim(),
        days: newTask.days,
        time: newTask.time,
        color: newTask.color,
      };

      setWeeklyTasks((prev) => [...prev, taskToAdd]);
      setNewTask({ name: "", days: [], time: "08:00", color: "blue" });
      onNewClose();
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
    const updatedDays = selectedTask.days.includes(day)
      ? selectedTask.days.filter((d) => d !== day)
      : [...selectedTask.days, day];

    setSelectedTask({ ...selectedTask, days: updatedDays });
  };

  // Drag and drop handlers
  const handleDragStart = (
    e: React.DragEvent,
    task: Task,
    sourceDay: string | null = null,
  ) => {
    setDraggedTask({ task, sourceDay });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", "");
  };

  const handleDragOver = (e: React.DragEvent, targetDay: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverDay(targetDay);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear drag over if we're leaving the drop zone completely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverDay(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetDay: string) => {
    e.preventDefault();
    setDragOverDay(null);

    if (!draggedTask) return;

    const { task, sourceDay } = draggedTask;

    // If dropping on the same day, do nothing
    if (sourceDay === targetDay) {
      setDraggedTask(null);

      return;
    }

    let updatedDays: string[];

    if (sourceDay === null) {
      // Coming from task palette - just add to target day
      updatedDays = task.days.includes(targetDay)
        ? task.days
        : [...task.days, targetDay];
    } else {
      // Coming from another day - move from source to target
      updatedDays = task.days.filter((day) => day !== sourceDay);
      if (!updatedDays.includes(targetDay)) {
        updatedDays.push(targetDay);
      }
    }

    // Update the task in the list
    setWeeklyTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, days: updatedDays } : t)),
    );

    setDraggedTask(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverDay(null);
  };

  // Handle dropping task outside calendar (delete from day)
  const handleDeleteDrop = (e: React.DragEvent) => {
    e.preventDefault();

    if (!draggedTask || !draggedTask.sourceDay) return;

    const { task, sourceDay } = draggedTask;

    // Remove the task from the source day
    const updatedDays = task.days.filter((day) => day !== sourceDay);

    if (updatedDays.length === 0) {
      // If no days left, delete the entire task
      setWeeklyTasks((prev) => prev.filter((t) => t.id !== task.id));
    } else {
      // Update the task with remaining days
      setWeeklyTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, days: updatedDays } : t)),
      );
    }

    setDraggedTask(null);
  };

  return (
    <DefaultLayout>
      <section className="flex flex-col gap-6 py-8 px-4 md:px-10">
        <div className="flex items-center justify-between">
          <h1 className={title()}>Vista Semanal</h1>
          <div className="flex gap-2">
            <Button
              color="secondary"
              variant="flat"
              onPress={() => setIsTaskPaletteOpen(!isTaskPaletteOpen)}
            >
              {isTaskPaletteOpen ? "← Ocultar Tareas" : "Mostrar Tareas →"}
            </Button>
            <Button color="primary" onPress={onNewOpen}>
              + Nueva Tarea
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex gap-4">
          {/* Task Palette Panel */}
          {isTaskPaletteOpen && (
            <div className="w-64 flex-shrink-0">
              <Card className="h-fit">
                <CardBody className="p-4">
                  <h3 className="text-lg font-semibold mb-3">
                    Todas las Tareas
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Arrastra cualquier tarea a un día para asignarla
                  </p>

                  <div className="space-y-2">
                    {weeklyTasks
                      .filter((task) => task.id && !isNaN(parseInt(task.id))) // Filter out invalid tasks
                      .map((task) => (
                        <div
                          key={`palette-${task.id}`}
                          draggable
                          className={`cursor-move transition-all duration-200 rounded-lg border-2 p-3 ${getTaskColorClasses(
                            task.color,
                          )} ${draggedTask?.task.id === task.id && draggedTask?.sourceDay === null ? "opacity-50" : ""}`}
                          onDragEnd={handleDragEnd}
                          onDragStart={(e) => handleDragStart(e, task, null)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <Badge
                              className="bg-white/70"
                              size="sm"
                              variant="flat"
                            >
                              {task.time}
                            </Badge>
                            <div className="text-xs text-gray-500">📋</div>
                          </div>
                          <p className="text-sm font-medium text-gray-800">
                            {task.name}
                          </p>
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-1">
                              {task.days.map((day) => {
                                const dayInfo = DAYS_OF_WEEK.find(
                                  (d) => d.key === day,
                                );

                                return (
                                  <Chip key={day} size="sm" variant="flat">
                                    {dayInfo?.short || day}
                                  </Chip>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardBody>
              </Card>
            </div>
          )}

          {/* Weekly Schedule Grid */}
          <div
            className={`grid grid-cols-1 lg:grid-cols-7 gap-4 flex-1 ${isTaskPaletteOpen ? "min-w-0" : ""}`}
          >
            {DAYS_OF_WEEK.map((day) => (
              <Card
                key={day.key}
                className={`min-h-[400px] transition-all duration-200 ${
                  dragOverDay === day.key
                    ? "ring-2 ring-blue-400 bg-blue-50"
                    : ""
                }`}
              >
                <CardBody
                  className="p-4 h-full"
                  onDragLeave={handleDragLeave}
                  onDragOver={(e) => handleDragOver(e, day.key)}
                  onDrop={(e) => handleDrop(e, day.key)}
                >
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold">{day.short}</h3>
                    <p className="text-sm text-gray-500">{day.label}</p>
                  </div>

                  <div className="space-y-2 flex-1">
                    {getTasksForDay(day.key)
                      .filter((task) => task.id && !isNaN(parseInt(task.id))) // Filter out invalid tasks
                      .map((task) => (
                        <div
                          key={`${task.id}-${day.key}`}
                          draggable
                          className={`cursor-move transition-all duration-200 rounded-lg border-2 p-3 ${getTaskColorClasses(
                            task.color,
                          )} ${draggedTask?.task.id === task.id && draggedTask?.sourceDay === day.key ? "opacity-50" : ""}`}
                          onClick={() => handleEditTask(task)}
                          onDragEnd={handleDragEnd}
                          onDragStart={(e) => handleDragStart(e, task, day.key)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <Badge
                              className="bg-white/70"
                              size="sm"
                              variant="flat"
                            >
                              {task.time}
                            </Badge>
                            <div className="text-xs text-gray-500">📋</div>
                          </div>
                          <p className="text-sm font-medium text-gray-800">
                            {task.name}
                          </p>
                        </div>
                      ))}

                    {getTasksForDay(day.key).length === 0 && (
                      <div className="text-center text-gray-400 text-sm py-8 flex-1 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                        {dragOverDay === day.key ? "Suelta aquí" : "Sin tareas"}
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>

        {/* Delete Zone */}
        {draggedTask && draggedTask.sourceDay && (
          <div
            className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg border-2 border-dashed border-red-300 transition-all duration-200 hover:bg-red-600"
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
            }}
            onDrop={handleDeleteDrop}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🗑️</span>
              <span className="text-sm font-medium">
                Arrastra aquí para eliminar de{" "}
                {
                  DAYS_OF_WEEK.find((d) => d.key === draggedTask.sourceDay)
                    ?.label
                }
              </span>
            </div>
          </div>
        )}

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
                      setSelectedTask({ ...selectedTask, name: e.target.value })
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
                          className={`w-8 h-8 rounded-full cursor-pointer border-2 transition-all ${
                            selectedTask.color === colorOption.key
                              ? "border-gray-800 scale-110"
                              : "border-gray-300 hover:border-gray-500"
                          } ${getTaskColorClasses(colorOption.key).split(" ")[0]}`}
                          title={colorOption.label}
                          onClick={() =>
                            setSelectedTask({
                              ...selectedTask,
                              color: colorOption.key,
                            })
                          }
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
                        className={`w-8 h-8 rounded-full cursor-pointer border-2 transition-all ${
                          newTask.color === colorOption.key
                            ? "border-gray-800 scale-110"
                            : "border-gray-300 hover:border-gray-500"
                        } ${getTaskColorClasses(colorOption.key).split(" ")[0]}`}
                        title={colorOption.label}
                        onClick={() =>
                          setNewTask({ ...newTask, color: colorOption.key })
                        }
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
