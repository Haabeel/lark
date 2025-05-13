import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  isWithinInterval,
  differenceInCalendarDays,
  subDays,
  addDays,
} from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createBackgroundHue() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 40%)`;
}

export function initials(name: string) {
  if (!name) return "";
  const words = name.split(" ").filter(Boolean);
  if (words.length >= 2) {
    const firstLetter = words[0]?.[0] ?? "";
    const secondLetter = words[1]?.[0] ?? "";
    return (firstLetter + secondLetter).toUpperCase();
  } else if (words.length === 1) {
    return words[0]?.[0]?.toUpperCase() ?? "";
  }
  return "";
}

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

interface User {
  id: string;
  name: string;
  email: string;
  firstName: string;
  lastName?: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Member {
  id: string;
  userId: string;
  projectId: string;
  role: string;
  user: User;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  order: number;
  startDate: Date;
  endDate: Date;
  projectId: string;
  assigneeId?: string | null;
  assignee?: Member | null;
  createdById: string;
  createdBy: Member;
  columnId?: string | null;
  column?: unknown;
  createdAt: Date;
  updatedAt: Date;
}

interface FilterOptions {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  dueInDays?: number;
}

function filterTasks(tasks: Task[], options: FilterOptions): Task[] {
  const { status, priority, assigneeId, dateRange, dueInDays } = options;

  return tasks.filter((task) => {
    if (status && task.status !== status) return false;
    if (priority && task.priority !== priority) return false;
    if (assigneeId && task.assignee?.id !== assigneeId) return false;

    if (
      dateRange?.from &&
      dateRange?.to &&
      !isWithinInterval(new Date(task.createdAt), {
        start: dateRange.from,
        end: dateRange.to,
      })
    ) {
      return false;
    }

    if (
      typeof dueInDays === "number" &&
      differenceInCalendarDays(new Date(task.endDate), new Date()) > dueInDays
    ) {
      return false;
    }

    return true;
  });
}

// Helper for creating users
const createUser = (id: string, name: string, email: string): User => ({
  id,
  name,
  email,
  firstName: name.split(" ")[0]!,
  lastName: name.split(" ")[1],
  emailVerified: true,
  createdAt: subDays(new Date(), 100),
  updatedAt: new Date(),
  image: null,
});

// Shared users/members
const users = {
  alice: createUser("user1", "Alice Johnson", "alice@example.com"),
  bob: createUser("user2", "Bob Smith", "bob@example.com"),
  charlie: createUser("user3", "Charlie Rose", "charlie@example.com"),
};

const members = {
  member1: {
    id: "member1",
    userId: "user1",
    projectId: "project1",
    role: "CONTRIBUTOR",
    user: users.alice,
  },
  member2: {
    id: "member2",
    userId: "user2",
    projectId: "project1",
    role: "MAINTAINER",
    user: users.bob,
  },
  member3: {
    id: "member3",
    userId: "user3",
    projectId: "project1",
    role: "CONTRIBUTOR",
    user: users.charlie,
  },
};

// Sample tasks
const mockTasks: Task[] = [
  {
    id: "task1",
    title: "Fix login bug",
    status: "TODO",
    priority: "HIGH",
    order: 1,
    startDate: subDays(new Date(), 5),
    endDate: addDays(new Date(), 2),
    projectId: "project1",
    assigneeId: "member1",
    assignee: members.member1,
    createdById: "member2",
    createdBy: members.member2,
    columnId: null,
    column: null,
    createdAt: subDays(new Date(), 5),
    updatedAt: new Date(),
  },
  {
    id: "task2",
    title: "Add dark mode",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    order: 2,
    startDate: subDays(new Date(), 3),
    endDate: addDays(new Date(), 10),
    projectId: "project1",
    assigneeId: "member3",
    assignee: members.member3,
    createdById: "member2",
    createdBy: members.member2,
    columnId: null,
    column: null,
    createdAt: subDays(new Date(), 3),
    updatedAt: new Date(),
  },
  {
    id: "task3",
    title: "Deploy to production",
    status: "DONE",
    priority: "LOW",
    order: 3,
    startDate: subDays(new Date(), 15),
    endDate: addDays(new Date(), 1),
    projectId: "project1",
    assigneeId: "member2",
    assignee: members.member2,
    createdById: "member1",
    createdBy: members.member1,
    columnId: null,
    column: null,
    createdAt: subDays(new Date(), 14),
    updatedAt: new Date(),
  },
  {
    id: "task4",
    title: "Write tests",
    status: "TODO",
    priority: "MEDIUM",
    order: 4,
    startDate: subDays(new Date(), 1),
    endDate: addDays(new Date(), 7),
    projectId: "project1",
    assigneeId: "member3",
    assignee: members.member3,
    createdById: "member2",
    createdBy: members.member2,
    columnId: null,
    column: null,
    createdAt: subDays(new Date(), 1),
    updatedAt: new Date(),
  },
];

// ========= TEST CASES =========

const tests: { label: string; filter: FilterOptions }[] = [
  { label: "Filter by status = TODO", filter: { status: "TODO" } },
  { label: "Filter by priority = MEDIUM", filter: { priority: "MEDIUM" } },
  {
    label: "Filter by assigneeId = member3",
    filter: { assigneeId: "member3" },
  },
  {
    label: "Filter by dateRange (last 7 days)",
    filter: {
      dateRange: {
        from: subDays(new Date(), 7),
        to: new Date(),
      },
    },
  },
  {
    label: "Filter by dueInDays = 3",
    filter: {
      dueInDays: 3,
    },
  },
  {
    label: "Filter by TODO + HIGH + member1 + recent + dueSoon",
    filter: {
      status: "TODO",
      priority: "HIGH",
      assigneeId: "member1",
      dateRange: {
        from: subDays(new Date(), 10),
        to: new Date(),
      },
      dueInDays: 3,
    },
  },
];

console.log("UNFILTERED LIST\n", mockTasks);

console.log("=== Task Filter Tests ===");

// ========= RUN TESTS =========
tests.forEach(({ label, filter }) => {
  const result = filterTasks(mockTasks, filter);
  console.log(`\n--- ${label} ---`);
  result.forEach((task) => console.log(`✔ ${task.id} : ${task.title}`));
  if (result.length === 0) console.log("No tasks matched.");
});
