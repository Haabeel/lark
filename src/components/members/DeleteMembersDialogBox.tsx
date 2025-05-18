"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { type Column } from "../tasks/columns";
import { api } from "@/trpc/react";
import useRefetch from "@/hooks/useRefetch";
import { toast } from "sonner";

export function DeleteMemberDialog({
  open,
  onOpenAction,
  member,
  projectId,
}: {
  open: boolean;
  projectId: string;
  onOpenAction: (val: boolean) => void;
  member: string;
}) {
  const removeMember = api.project.removeMember.useMutation();
  const refetch = useRefetch();
  const [internalOpen, setInternalOpen] = React.useState(open);
  const handleDeleteTask = async () => {
    try {
      removeMember.mutate({ memberId: member, projectId: projectId });
      await refetch();
      onOpenAction(false);
    } catch (error) {
      toast.error("Failed to remove member");
      console.error("Error deleting member:", error);
    }
  };
  React.useEffect(() => {
    // Only update internal state if the prop changes
    if (open !== internalOpen) {
      setInternalOpen(open);
    }
  }, [open]);

  return (
    <Dialog key={"DELETE"} open={open} onOpenChange={onOpenAction}>
      <DialogContent className="max-w-[80vw] border-black bg-neutral-300 text-black dark:bg-foundation-blue-800 dark:text-neutral-100 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-lg">Remove Member</DialogTitle>
          <DialogDescription className="text-xs text-black dark:text-neutral-200 sm:text-sm">
            This action will remove the selected member. You cannot restore it.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <DialogClose asChild>
            <Button
              variant="outline"
              className="text-foundation-blue-900 dark:text-neutral-100"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleDeleteTask} className="">
            Confirm Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
