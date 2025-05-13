"use client";

import useProject from "@/hooks/useProject";
import useRefetch from "@/hooks/useRefetch";
import { api } from "@/trpc/react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "../ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ArchiveXIcon } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
};

const ArchiveButton = ({ open, onOpenChange, className }: Props) => {
  const archiveProject = api.project.archiveProject.useMutation();
  const { selectedProject, projects, setSelectedProject } = useProject();
  const refetch = useRefetch();

  const handleArchiveProject = async () => {
    await archiveProject.mutateAsync({ projectId: selectedProject });
    await refetch();
    setSelectedProject(projects?.[0]?.id ?? "");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[80vw] border-black bg-neutral-400 text-black dark:bg-foundation-blue-800 dark:text-neutral-100 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-lg">Archive Project</DialogTitle>{" "}
          <DialogDescription className="text-xs text-black dark:text-neutral-200 sm:text-sm">
            This action will archive the selected project. You can restore it
            later from the archive section.
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
          <Button
            variant="destructive"
            onClick={handleArchiveProject}
            className=""
          >
            Confirm Archive
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ArchiveButton;
