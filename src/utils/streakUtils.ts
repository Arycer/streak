// Streak calculation and detection utilities

export interface Task {
  id: string;
  name: string;
  days: string[];
  time: string;
  color: string;
  createdAt: string;
}

export interface CompletedTasks {
  [date: string]: string[];
}

// Get all dates in the last 30 days
export const getAllDates = (): string[] => {
  const dates: string[] = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);

    date.setDate(today.getDate() - i);
    dates.push(date.toISOString().slice(0, 10));
  }

  return dates;
};

// Convert date string to day of week
export const getDayOfWeek = (dateString: string): string => {
  const date = new Date(dateString);
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

// Calculate current streak for a task
export const calculateCurrentStreak = (
  task: Task,
  completedTasks: CompletedTasks,
): number => {
  const allDates = getAllDates();
  const relevantDates = allDates.filter((date) => {
    const dayOfWeek = getDayOfWeek(date);

    return task.days.includes(dayOfWeek) && date >= task.createdAt;
  });

  let currentStreak = 0;

  // Count backwards from the most recent relevant date
  for (let i = relevantDates.length - 1; i >= 0; i--) {
    const date = relevantDates[i];
    const completed = completedTasks[date] || [];

    if (completed.includes(task.id)) {
      currentStreak++;
    } else {
      break;
    }
  }

  return currentStreak;
};

// Calculate previous streak for a task
export const calculatePreviousStreak = (
  task: Task,
  completedTasks: CompletedTasks,
): number => {
  const allDates = getAllDates();
  const relevantDates = allDates.filter((date) => {
    const dayOfWeek = getDayOfWeek(date);

    return task.days.includes(dayOfWeek) && date >= task.createdAt;
  });

  let currentStreak = 0;
  let previousStreak = 0;
  let foundBreak = false;

  // Count backwards from the most recent relevant date
  for (let i = relevantDates.length - 1; i >= 0; i--) {
    const date = relevantDates[i];
    const completed = completedTasks[date] || [];

    if (completed.includes(task.id)) {
      if (foundBreak) {
        previousStreak++;
      } else {
        currentStreak++;
      }
    } else {
      if (currentStreak > 0 && !foundBreak) {
        foundBreak = true;
      } else if (foundBreak && previousStreak > 0) {
        break;
      }
    }
  }

  return previousStreak;
};

// Calculate longest streak for a task (global, not just last 30 days)
export const calculateLongestStreak = (
  task: Task,
  completedTasks: CompletedTasks,
): number => {
  // For now, we'll use the same 30-day window, but this could be extended
  // to use all historical data when backend is implemented
  const allDates = getAllDates();
  const relevantDates = allDates.filter((date) => {
    const dayOfWeek = getDayOfWeek(date);

    return task.days.includes(dayOfWeek) && date >= task.createdAt;
  });

  let longestStreak = 0;
  let currentStreak = 0;

  for (const date of relevantDates) {
    const completed = completedTasks[date] || [];

    if (completed.includes(task.id)) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return longestStreak;
};

// Get count of completions in last 30 days
export const getCompletionCount = (
  task: Task,
  completedTasks: CompletedTasks,
): number => {
  const allDates = getAllDates();
  let count = 0;

  for (const date of allDates) {
    // Only count dates after task creation
    if (date >= task.createdAt) {
      const completed = completedTasks[date] || [];

      if (completed.includes(task.id)) {
        count++;
      }
    }
  }

  return count;
};

// Check if a task's streak was broken on a specific day (first day of break)
export const isStreakBrokenOnDay = (
  task: Task,
  day: string,
  completedTasks: CompletedTasks,
): boolean => {
  const dayOfWeek = getDayOfWeek(day);

  // Only check if this task is supposed to be done on this day
  if (!task.days.includes(dayOfWeek)) {
    return false;
  }

  const completedOnDay = completedTasks[day] || [];
  const wasCompleted = completedOnDay.includes(task.id);

  if (wasCompleted) {
    return false; // Task was completed, no streak broken
  }

  // Get all dates and find relevant dates for this task (before current day)
  const allDates = getAllDates().filter((d) => d < day);
  const relevantDates = allDates.filter((date) => {
    const dayOfWeek = getDayOfWeek(date);

    return task.days.includes(dayOfWeek) && date >= task.createdAt;
  });

  if (relevantDates.length === 0) {
    return false; // No previous days to check
  }

  // Check if the immediately previous relevant day was completed
  const previousDay = relevantDates[relevantDates.length - 1];
  const prevCompleted = completedTasks[previousDay] || [];
  const wasPrevCompleted = prevCompleted.includes(task.id);

  if (!wasPrevCompleted) {
    return false; // Previous day wasn't completed, so no streak to break
  }

  // Count consecutive completions before this day
  let consecutiveCount = 0;

  for (let i = relevantDates.length - 1; i >= 0; i--) {
    const date = relevantDates[i];
    const completed = completedTasks[date] || [];

    if (completed.includes(task.id)) {
      consecutiveCount++;
    } else {
      break;
    }
  }

  // Only show dramatic alert if there was a streak of 2+ days
  // AND this is the first day we're missing after the streak
  if (consecutiveCount >= 2) {
    // Check if we already showed a dramatic alert for this task in recent days
    const allDatesAfter = getAllDates().filter(
      (d) => d > previousDay && d < day,
    );
    const recentMissedDates = allDatesAfter.filter((date) => {
      const dayOfWeek = getDayOfWeek(date);

      if (!task.days.includes(dayOfWeek)) return false;

      const completed = completedTasks[date] || [];

      return !completed.includes(task.id);
    });

    // Only show dramatic alert if this is the first missed day after the streak
    return recentMissedDates.length === 0;
  }

  return false;
};

// Check if a task was simply missed on a day (less dramatic)
export const isTaskMissedOnDay = (
  task: Task,
  day: string,
  completedTasks: CompletedTasks,
): boolean => {
  const dayOfWeek = getDayOfWeek(day);

  // Only check if this task is supposed to be done on this day and after creation date
  if (!task.days.includes(dayOfWeek) || day < task.createdAt) {
    return false;
  }

  const completedOnDay = completedTasks[day] || [];
  const wasCompleted = completedOnDay.includes(task.id);

  // Task was missed if it wasn't completed AND it's not a streak break day
  return !wasCompleted && !isStreakBrokenOnDay(task, day, completedTasks);
};

// Get day abbreviations in Spanish
export const getDayAbbreviations = (days: string[]): string => {
  const dayMap: { [key: string]: string } = {
    monday: "L",
    tuesday: "M",
    wednesday: "X",
    thursday: "J",
    friday: "V",
    saturday: "S",
    sunday: "D",
  };

  return days.map((day) => dayMap[day] || "?").join("");
};

// Calculate real consistency percentage based on tasks that should have been done vs actually completed
export const calculateConsistencyPercentage = (
  tasks: Task[],
  completedTasks: CompletedTasks,
): number => {
  const allDates = getAllDates();
  let totalTasksExpected = 0;
  let totalTasksCompleted = 0;

  for (const date of allDates) {
    const dayOfWeek = getDayOfWeek(date);
    const completedOnDay = completedTasks[date] || [];

    // Count tasks that should have been done on this day (only after creation date)
    const tasksForDay = tasks.filter(
      (task) => task.days.includes(dayOfWeek) && date >= task.createdAt,
    );

    totalTasksExpected += tasksForDay.length;

    // Count how many of those were actually completed
    for (const task of tasksForDay) {
      if (completedOnDay.includes(task.id)) {
        totalTasksCompleted++;
      }
    }
  }

  if (totalTasksExpected === 0) return 100;

  return Math.round((totalTasksCompleted / totalTasksExpected) * 100);
};

// Get color mapping for tasks
export const getColorClasses = (color: string) => {
  const colorMap: {
    [key: string]: { border: string; bg: string; text: string };
  } = {
    blue: {
      border: "border-blue-200",
      bg: "bg-blue-50",
      text: "text-blue-700",
    },
    green: {
      border: "border-green-200",
      bg: "bg-green-50",
      text: "text-green-700",
    },
    purple: {
      border: "border-purple-200",
      bg: "bg-purple-50",
      text: "text-purple-700",
    },
    orange: {
      border: "border-orange-200",
      bg: "bg-orange-50",
      text: "text-orange-700",
    },
    red: { border: "border-red-200", bg: "bg-red-50", text: "text-red-700" },
    yellow: {
      border: "border-yellow-200",
      bg: "bg-yellow-50",
      text: "text-yellow-700",
    },
    pink: {
      border: "border-pink-200",
      bg: "bg-pink-50",
      text: "text-pink-700",
    },
    indigo: {
      border: "border-indigo-200",
      bg: "bg-indigo-50",
      text: "text-indigo-700",
    },
  };

  return colorMap[color] || colorMap.blue;
};
