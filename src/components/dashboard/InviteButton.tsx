"use client";

import useProject from "@/hooks/useProject";
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Clipboard } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";

const InviteButton = () => {
  const { selectedProject } = useProject();
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-none bg-foundation-blue-800">
          <DialogHeader>
            <DialogTitle>Invite Team Members</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-neutral-200">
            Ask them to copy and paste this line
          </p>
          <div className="flex w-full items-center justify-between rounded-md border border-neutral-700 px-2 text-sm text-neutral-200">
            <Input
              readOnly
              className="w-full border-none bg-transparent text-xs text-neutral-200 ring-0 focus-visible:ring-0 sm:text-xs"
              value={`${window.location.origin}/join/${selectedProject}`}
            />
            <Clipboard
              className="size-4 cursor-pointer"
              onClick={async () => {
                await navigator.clipboard.writeText(
                  `${window.location.origin}/join/${selectedProject}`,
                );
                toast.success("Invite link copied to clipboard");
                setOpen(false);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
      <Button
        onClick={() => setOpen(true)}
        className="border-none bg-brand-blue-600 text-neutral-200 hover:bg-brand-blue-700 hover:text-neutral-200"
        variant="outline"
        size={"sm"}
      >
        Invite Members
      </Button>
    </>
  );
};

export default InviteButton;
