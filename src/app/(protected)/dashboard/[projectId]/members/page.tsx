"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { useDashboard } from "@/providers/DashboardProvider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox"; // reusable combobox
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, WaypointsIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DeleteMemberDialog } from "@/components/members/DeleteMembersDialogBox";
import { DeleteTaskDialog } from "@/components/tasks/DeleteTaskDialog";
import CreateTasksDialog from "@/components/tasks/create-tasks-dialog";
import { type Column } from "@/components/tasks/columns";
import DisplayTaskDialog from "@/components/tasks/ViewTaskDialog";
import InviteButton from "@/components/dashboard/InviteButton";
import MembersPageSkeleton from "@/components/members/MembersPageSkeleton";

type MemberOption = { value: string; label: string };

export default function MembersPage() {
  const dashboard = useDashboard();
  const projectId = dashboard?.selectedProject;
  const project = dashboard?.project;
  const user = dashboard?.user;
  const isMaintainer =
    project?.members.find((member) => member.userId === user?.id)?.role ===
    "MAINTAINER";
  const utils = api.useContext();
  const [pendingRoleUpdate, setPendingRoleUpdate] = useState<string | null>(
    null,
  );
  const [openRemoveMemberDialog, setOpenRemoveMemberDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [deleteTaskDialog, setDeleteTaskDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [openInviteMemberDialog, setOpenInviteMemberDialog] = useState(false);
  const [openViewTaskMemberDialog, setOpenViewTaskMemberDialog] =
    useState(false);
  const [viewTask, setViewTask] = useState<Column | null>(null);
  const { data: members } = api.project.getTeamMembers.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId },
  );
  const { data: tasks } = api.project.getTasks.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId },
  );

  const updateRole = api.project.updateMemberRole.useMutation({
    onMutate: (variables) => {
      setPendingRoleUpdate(variables.memberId);
    },
    onSuccess: () =>
      utils.project.getTeamMembers.invalidate().then(() => {
        setPendingRoleUpdate(null);
        toast.success("Role updated");
      }),
    onError() {
      setPendingRoleUpdate(null);
      toast.error("Failed to update role");
    },
  });

  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");

  if (!members) return <MembersPageSkeleton />;

  const filteredMembers = members.filter(
    (m) =>
      m.user.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.user.email.toLowerCase().includes(memberSearch.toLowerCase()),
  );

  const memberOptions: MemberOption[] = members.map((m) => ({
    value: m.id,
    label: m.user.name,
  }));

  const memberTasks =
    tasks?.filter((t) => t.assigneeId === selectedMemberId) ?? [];

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">Project Members</h1>
      <div className="flex w-full items-center justify-between">
        {/* Search input for members */}
        <Input
          placeholder="Search members..."
          value={memberSearch}
          onChange={(e) => setMemberSearch(e.target.value)}
          className="max-w-md"
        />
        <Button
          onClick={() => {
            setTimeout(() => {
              setOpenInviteMemberDialog(true);
            }, 0);
          }}
          className="flex cursor-pointer items-center gap-2 bg-foundation-purple-400 text-white hover:bg-foundation-purple-500"
        >
          <WaypointsIcon />
          <span> Invite Members</span>
        </Button>
      </div>

      {/* Members table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredMembers.map((m) => (
            <TableRow key={m.id}>
              <TableCell>{m.user.name}</TableCell>
              <TableCell>{m.user.email}</TableCell>
              <TableCell>
                <Select
                  key={m.id}
                  disabled={!isMaintainer || pendingRoleUpdate === m.id}
                  defaultValue={m.role}
                  onValueChange={(role: "MAINTAINER" | "CONTRIBUTOR") =>
                    updateRole.mutate({ memberId: m.id, role })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MAINTAINER">Maintainer</SelectItem>
                    <SelectItem value="CONTRIBUTOR">Contributor</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Button
                  disabled={!isMaintainer || pendingRoleUpdate === m.id}
                  className={`${(!isMaintainer || pendingRoleUpdate === m.id) && "cursor-not-allowed"}`}
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setTimeout(() => {
                      setOpenRemoveMemberDialog(true);
                      setSelectedMember(m.id);
                    }, 0);
                  }}
                >
                  Remove
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Task management for selected member */}
      <div className="space-y-4">
        <Combobox
          items={memberOptions}
          value={selectedMemberId}
          onChangeAction={setSelectedMemberId}
          expanded
          label="Select Member"
          className="max-w-sm shadow-md ring-1 ring-neutral-700 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:bg-gray-800 dark:text-neutral-100 dark:hover:bg-gray-700/50"
          icon={
            <Users
              className="text-neutral-900 dark:text-neutral-100"
              style={{ width: "22px", height: "22px" }}
            />
          }
        />

        {selectedMemberId && (
          <Card className="dark:bg-gray-800">
            <CardHeader className="flex items-center justify-between">
              <div className="flex w-full items-center justify-between">
                <CardTitle className="flex-1">
                  Tasks for
                  {members.find((m) => m.id === selectedMemberId)?.user.name}
                </CardTitle>
                <CreateTasksDialog
                  assigneeId={selectedMemberId}
                  view="table"
                  isMaintainer={isMaintainer}
                />
              </div>
            </CardHeader>
            <CardContent>
              {/* Tasks table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberTasks.map((t) => {
                    const status = t.status;
                    const color =
                      status === "TODO"
                        ? "bg-blue-400 text-blue-800 hover:bg-blue-600"
                        : status === "IN_PROGRESS"
                          ? "bg-yellow-400 text-yellow-800 hover:bg-yellow-600"
                          : status === "BACKLOG"
                            ? "bg-pink-400 text-pink-800 hover:bg-pink-600"
                            : "bg-green-400 text-green-800 hover:bg-green-600";
                    const priorityColor =
                      t.priority === "HIGH"
                        ? "hover:bg-red-600 bg-red-500 text-red-800"
                        : t.priority === "LOW"
                          ? "hover:bg-yellow-400 bg-yellow-200 text-yellow-800"
                          : "hover:bg-green-400 bg-foundation-green-200 text-foundation-green-800";

                    return (
                      <TableRow
                        key={t.id}
                        onClick={() => {
                          setTimeout(() => {
                            console.log("press");
                            setOpenViewTaskMemberDialog(true);
                            setViewTask(t);
                          }, 0);
                        }}
                        className="cursor-pointer hover:bg-neutral-100 dark:hover:bg-foundation-blue-800"
                      >
                        <TableCell>{t.title}</TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              color,
                              "flex w-full max-w-[130px] cursor-default items-center justify-center text-xs",
                            )}
                          >
                            {status.replaceAll("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              priorityColor,
                              "flex w-full cursor-default items-center justify-center text-xs",
                            )}
                          >
                            {t.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(t.endDate), "PPP")}
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            size="sm"
                            disabled={!isMaintainer}
                            onClick={(e) => {
                              e.stopPropagation();
                              setTimeout(() => {
                                setDeleteTaskDialog(true);
                                setSelectedTask(t.id);
                              }, 0);
                            }}
                            variant="destructive"
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
      {selectedMember && (
        <DeleteMemberDialog
          member={selectedMember}
          projectId={projectId!}
          open={openRemoveMemberDialog}
          onOpenAction={(open: boolean | ((prevState: boolean) => boolean)) => {
            setOpenRemoveMemberDialog(open);
            setSelectedMember(null);
          }}
        />
      )}
      {selectedTask && (
        <DeleteTaskDialog
          task={selectedTask}
          open={deleteTaskDialog}
          onOpenAction={(open: boolean | ((prevState: boolean) => boolean)) => {
            setDeleteTaskDialog(open);
            setSelectedTask(null);
          }}
        />
      )}
      {viewTask && (
        <DisplayTaskDialog
          task={viewTask}
          open={openViewTaskMemberDialog}
          onOpenAction={(open: boolean | ((prevState: boolean) => boolean)) => {
            setOpenViewTaskMemberDialog(open);
            setViewTask(null);
          }}
        />
      )}
      <InviteButton
        open={openInviteMemberDialog}
        onOpenChange={setOpenInviteMemberDialog}
      />
    </div>
  );
}
