import {
  Bot,
  LayoutDashboard,
  ListTodo,
  ChartLine,
  Users,
  GitGraphIcon,
  Settings,
} from "lucide-react";

export const sidebarItems = {
  ai: [
    { name: "Commits", url: "commits", icon: GitGraphIcon },
    { name: "Q&A", url: "qa", icon: Bot },
  ],
  management: [
    { name: "Project", url: "project", icon: LayoutDashboard },
    { name: "Members", url: "members", icon: Users },
    { name: "Tasks", url: "tasks", icon: ListTodo },
    { name: "Analytics", url: "analytics", icon: ChartLine },
  ],
  me: [
    { name: "My Tasks", url: "my-tasks", icon: ListTodo },
    { name: "Profile", url: "profile", icon: Users },
    { name: "Settings", url: "settings", icon: Settings },
  ],
};
