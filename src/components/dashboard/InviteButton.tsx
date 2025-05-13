"use client";

import useProject from "@/hooks/useProject";
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Clipboard } from "lucide-react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
};

const InviteButton = ({ open, onOpenChange, className }: Props) => {
  const { selectedProject } = useProject();
  const [inviteLink, setInviteLink] = useState("");
  const [internalOpen, setInternalOpen] = React.useState(open);

  useEffect(() => {
    // Only update internal state if the prop changes
    if (open !== internalOpen) {
      setInternalOpen(open);
    }
  }, [open]);

  const handleChange = (state: boolean) => {
    // Prevent unintended close immediately after mount
    if (!state && !open) return;
    onOpenChange(state);
  };
  useEffect(() => {
    // Runs only on client
    if (selectedProject) {
      setInviteLink(`${window.location.origin}/join/${selectedProject}`);
    }
  }, [selectedProject]);

  return (
    <Dialog open={internalOpen} onOpenChange={handleChange}>
      <DialogContent className="border-none bg-neutral-300 dark:bg-foundation-blue-800">
        <DialogHeader>
          <DialogTitle>Invite Team Members</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-black dark:text-neutral-200">
          Use this link to add team members
        </p>
        <div className="flex w-full items-center justify-between rounded-md border border-neutral-700 px-2 text-sm">
          <Input
            readOnly
            className="w-full border-none bg-transparent text-xs text-neutral-500 ring-0 focus-visible:ring-0 dark:text-neutral-200 sm:text-xs"
            value={inviteLink}
          />
          <Clipboard
            className="size-4 cursor-pointer"
            onClick={async () => {
              if (!inviteLink) return;
              await navigator.clipboard.writeText(inviteLink);
              toast.success("Invite link copied to clipboard");
              onOpenChange(false);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteButton;
