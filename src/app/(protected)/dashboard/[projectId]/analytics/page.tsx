"use client";

import { useTheme } from "next-themes";
import { api } from "@/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useDashboard } from "@/providers/DashboardProvider";
import { initials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AnalyticsSkeleton } from "@/components/analytics/Analytics";

const statusColors: Record<string, string> = {
  TODO: "#60A5FA",
  IN_PROGRESS: "#FBBF24",
  DONE: "#34D399",
  BACKLOG: "#F472B6",
};

const priorityColors: Record<string, string> = {
  LOW: "#34D399",
  MEDIUM: "#FBBF24",
  HIGH: "#F87171",
};
export default function AnalyticsPage() {
  const { theme } = useTheme();
  const dashboard = useDashboard();
  if (!dashboard) return null;
  const { selectedProject } = dashboard;
  const { data, isLoading, error } = api.project.getOverview.useQuery({
    projectId: selectedProject /* your selected project ID here */,
  });

  if (isLoading) return <AnalyticsSkeleton />;
  if (error || !data)
    return (
      <div className="p-8 text-center text-red-500">
        Failed to load analytics.
      </div>
    );

  return (
    <div className="space-y-8 p-4 sm:p-8">
      {/* Task Breakdowns */}
      <Tabs defaultValue="status" className="space-y-4">
        <TabsList>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="priority">Priority</TabsTrigger>
        </TabsList>
        <TabsContent value="status">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Badge className="bg-pink-400 p-4 text-lg text-pink-800 hover:bg-pink-400">
              BACKLOG{" "}
              {data.tasksByStatus.find(
                (s) =>
                  s.status !== "TODO" &&
                  s.status !== "IN_PROGRESS" &&
                  s.status !== "DONE",
              )?.count ?? 0}
            </Badge>
            <Badge className="bg-blue-400 p-4 text-lg text-blue-800 hover:bg-blue-400">
              TODO{" "}
              {data.tasksByStatus.find((s) => s.status === "TODO")?.count ?? 0}
            </Badge>
            <Badge className="bg-yellow-400 p-4 text-lg text-yellow-800 hover:bg-yellow-400">
              IN_PROGRESS{" "}
              {data.tasksByStatus.find((s) => s.status === "IN_PROGRESS")
                ?.count ?? 0}
            </Badge>
            <Badge className="bg-green-400 p-4 text-lg text-green-800 hover:bg-green-400">
              DONE{" "}
              {data.tasksByStatus.find((s) => s.status === "DONE")?.count ?? 0}
            </Badge>
          </div>
        </TabsContent>
        <TabsContent value="priority">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Badge className="bg-green-400 p-4 text-lg text-green-800 hover:bg-green-400">
              LOW{" "}
              {data.tasksByPriority.find((p) => p.priority === "LOW")?.count ??
                0}
            </Badge>
            <Badge className="bg-yellow-400 p-4 text-lg text-yellow-800 hover:bg-yellow-400">
              MEDIUM{" "}
              {data.tasksByPriority.find((p) => p.priority === "MEDIUM")
                ?.count ?? 0}
            </Badge>
            <Badge className="bg-red-400 p-4 text-lg text-red-800 hover:bg-red-400">
              HIGH{" "}
              {data.tasksByPriority.find((p) => p.priority === "HIGH")?.count ??
                0}
            </Badge>
          </div>
        </TabsContent>
      </Tabs>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="dark:bg-gray-800">
          <CardHeader>
            <CardTitle>Total Tasks</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {data.totalTasks}
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800">
          <CardHeader>
            <CardTitle>Completed Tasks</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {data.completedTasks}
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800">
          <CardHeader>
            <CardTitle>Overdue Tasks</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {data.overdueTasks}
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800">
          <CardHeader>
            <CardTitle>Total Commits</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {data.totalCommits}
          </CardContent>
        </Card>
      </div>

      {/* Task Distribution Pie Charts */}
      {data.totalTasks !== 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card className="dark:bg-gray-800">
            <CardHeader>
              <CardTitle>Tasks by Status</CardTitle>
            </CardHeader>
            <CardContent style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.tasksByStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ status, percent }) =>
                      `${status} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {data.tasksByStatus.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={statusColors[entry.status] ?? "#8884d8"}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800">
            <CardHeader>
              <CardTitle>Tasks by Priority</CardTitle>
            </CardHeader>
            <CardContent style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.tasksByPriority}
                    dataKey="count"
                    nameKey="priority"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ priority, percent }) =>
                      `${priority} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {data.tasksByPriority.map((entry) => (
                      <Cell
                        key={entry.priority}
                        fill={priorityColors[entry.priority] ?? "#8884d8"}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Month-over-Month */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="dark:bg-gray-800">
          <CardHeader>
            <CardTitle>Tasks: This Month vs Last Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between text-lg">
              <span>This Month:</span>
              <span className="font-semibold">{data.tasksThisMonth}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span>Last Month:</span>
              <span className="font-semibold">{data.tasksLastMonth}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800">
          <CardHeader>
            <CardTitle>Commits: This Month vs Last Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between text-lg">
              <span>This Month:</span>
              <span className="font-semibold">{data.commitsThisMonth}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span>Last Month:</span>
              <span className="font-semibold">{data.commitsLastMonth}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commit Frequency Chart */}
      <Card className="dark:bg-gray-800">
        <CardHeader>
          <CardTitle>Commits (All time)</CardTitle>
        </CardHeader>
        <CardContent style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.commitFrequency}>
              <XAxis
                dataKey="date"
                stroke={theme === "dark" ? "#DDD" : "#333"}
              />
              <YAxis stroke={theme === "dark" ? "#DDD" : "#333"} />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === "dark" ? "#222" : "#fff",
                  borderColor: theme === "dark" ? "#444" : "#ccc",
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#4F46E5"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="dark:bg-gray-800">
        <CardHeader>
          <CardTitle>Commit Contributions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {data.commitContributions.map(({ author, count, avatar }) => (
              <li key={author} className="flex justify-between">
                <span className="flex items-center gap-2">
                  <Avatar className="size-6">
                    {avatar ? (
                      <AvatarImage src={avatar} />
                    ) : (
                      <AvatarFallback>{initials(author)}</AvatarFallback>
                    )}
                  </Avatar>
                  {author}
                </span>
                <span className="font-semibold">{count} commits</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      {/* Member Stats Table */}
      <Card className="dark:bg-gray-800">
        <CardHeader>
          <CardTitle>Member Contributions</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead className="text-right">Assigned</TableHead>
                <TableHead className="text-right">Completed</TableHead>
                <TableHead className="text-right">Overdue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.memberStats.map((m) => (
                <TableRow key={m.memberId}>
                  <TableCell className="flex items-center gap-2">
                    <Avatar className="size-6">
                      {m.user.avatar ? (
                        <AvatarImage src={m.user.avatar} />
                      ) : (
                        <AvatarFallback className="bg-foundation-purple-400 p-2 text-xs text-white">
                          {initials(m.user.name)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    {m.user.name}
                  </TableCell>
                  <TableCell className="text-right">
                    {m.assignedCount}
                  </TableCell>
                  <TableCell className="text-right">
                    {m.completedCount}
                  </TableCell>
                  <TableCell className="text-right">{m.overdueCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
