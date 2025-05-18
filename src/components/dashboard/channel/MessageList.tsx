"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, isToday, isYesterday, formatDate } from "date-fns";
import { useDashboard } from "@/providers/DashboardProvider";
import { initials } from "@/lib/utils";
import {
  type Attachment,
  AttachmentType,
  type Channel,
  type Message as PrismaMessage,
} from "@prisma/client"; // Use PrismaMessage
import {
  Hash,
  MoreHorizontal,
  Edit3,
  Trash2,
  Loader2,
  VideoIcon,
  FileText,
  Download,
} from "lucide-react"; // Added icons
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea"; // For editing message
import { Label } from "@/components/ui/label";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import Image from "next/image";

// Define your enriched message type if it's different from PrismaMessage
// This should match what's in your messages.messages array
type DisplayMessage = PrismaMessage & {
  sender: { id: string; name: string | null; image: string | null } | null;
  // Add attachments type if you have it
  attachments: Attachment[];
};

type Props = {
  messages: { messages: DisplayMessage[] }; // Use DisplayMessage[] here
  channel: Channel;
};

function formatWithOrdinal(date: Date): string {
  const day = formatDate(date, "d");
  const suffix =
    day.endsWith("1") && !day.endsWith("11")
      ? "st"
      : day.endsWith("2") && !day.endsWith("12")
        ? "nd"
        : day.endsWith("3") && !day.endsWith("13")
          ? "rd"
          : "th";
  return formatDate(date, `MMMM d'${suffix}', yyyy`);
}

const MessageList = ({ messages, channel }: Props) => {
  const endRef = useRef<HTMLDivElement>(null);
  const utils = api.useContext(); // For invalidating queries

  // State for dialogs
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<DisplayMessage | null>(
    null,
  );
  const [editedContent, setEditedContent] = useState("");

  useEffect(() => {
    // Scroll to bottom only if not editing/deleting to avoid jarring scroll
    if (!isEditDialogOpen && !isDeleteDialogOpen) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.messages, isEditDialogOpen, isDeleteDialogOpen]);

  const dashboard = useDashboard();
  if (!dashboard) return null;
  const { session } = dashboard;
  const currentUserId = session?.user.id;

  // --- tRPC Mutations ---
  const updateMessageMutation = api.chat.updateMessage.useMutation({
    onSuccess: () => {
      toast.success("Message updated!");
      setIsEditDialogOpen(false);
      setSelectedMessage(null);
      // Optimistic update or rely on Realtime event from RealtimeChannelProvider
      // For immediate feedback without waiting for Realtime, you might need to update local state:
      // utils.client.chat.getMessages.setData({ channelId: channel.id /* other params */ }, (oldData) => {
      //   if (!oldData) return oldData;
      //   return {
      //     ...oldData,
      //     messages: oldData.messages.map(m => m.id === updatedMsg.id ? updatedMsg : m)
      //   };
      // });
      // OR, if RealtimeChannelProvider handles updates:
      void utils.chat.getMessages.invalidate({ channelId: channel.id });
    },
    onError: (error) => toast.error(`Failed to update: ${error.message}`),
  });

  const deleteMessageMutation = api.chat.deleteMessage.useMutation({
    onSuccess: () => {
      toast.success("Message deleted!");
      setIsDeleteDialogOpen(false);
      setSelectedMessage(null);
      // Optimistic update or rely on Realtime event from RealtimeChannelProvider
      // utils.client.chat.getMessages.setData({ channelId: channel.id /* other params */ }, (oldData) => {
      //   if (!oldData) return oldData;
      //   return {
      //     ...oldData,
      //     messages: oldData.messages.filter(m => m.id !== deletedMsgData.id)
      //   };
      // });
      // OR, if RealtimeChannelProvider handles deletes:
      void utils.chat.getMessages.invalidate({ channelId: channel.id });
    },
    onError: (error) => toast.error(`Failed to delete: ${error.message}`),
  });

  // --- Dialog Handlers ---
  const handleOpenEditDialog = (message: DisplayMessage) => {
    setSelectedMessage(message);
    setEditedContent(message.content);
    setTimeout(() => setIsEditDialogOpen(true), 0);
  };

  const handleOpenDeleteDialog = (message: DisplayMessage) => {
    setSelectedMessage(message);
    setTimeout(() => setIsDeleteDialogOpen(true), 0);
  };

  const handleEditSubmit = () => {
    if (!selectedMessage || !editedContent.trim()) return;
    updateMessageMutation.mutate({
      messageId: selectedMessage.id,
      content: editedContent.trim(),
    });
  };

  const handleDeleteConfirm = () => {
    if (!selectedMessage) return;
    deleteMessageMutation.mutate({ messageId: selectedMessage.id });
  };

  const renderDateSeparator = (date: Date): React.ReactNode => {
    // Explicitly type the return value
    let label = format(date, "MMMM d, yyyy");
    if (isToday(date)) label = "Today";
    else if (isYesterday(date)) label = "Yesterday";

    return (
      // Add the return statement here
      <div className="relative my-4 flex items-center">
        <div className="flex-grow border-t border-gray-400" />{" "}
        {/* Adjusted border color for theme */}
        <span className="py-1/2 rounded-full px-2 text-xs text-muted-foreground ring-1 ring-gray-400">
          {" "}
          {/* Adjusted styling */}
          {label}
        </span>
        <div className="flex-grow border-t border-gray-400" />{" "}
        {/* Adjusted border color for theme */}
      </div>
    );
  };

  return (
    <>
      <ScrollArea className="h-full w-full bg-transparent p-0">
        {!channel.isDm && (
          <div className="flex flex-col gap-2 px-8 pb-8 pt-52">
            <div className="flex items-center gap-2">
              <Hash />
              <h1 className="text-2xl font-bold">{channel.name}</h1>
            </div>
            <p className="text-lg">
              {"This channel was created on " +
                formatWithOrdinal(channel.createdAt) +
                ". This is the very beginning of the "}
              <b>{channel.name}</b> channel.
            </p>
          </div>
        )}
        <div className="flex flex-col">
          {messages.messages.map((msg, idx) => {
            const prev = messages.messages[idx - 1];
            {
              /* const next = messages.messages[idx + 1]; */
            }

            const currentDate = new Date(msg.createdAt);
            const prevDate = prev ? new Date(prev.createdAt) : null;
            const showDateSeparator =
              !prevDate ||
              currentDate.toDateString() !== prevDate.toDateString();

            const isOwnMessage = msg.sender?.id === currentUserId;
            const isPrevSameSender =
              prev?.sender?.id === msg.sender?.id &&
              prevDate?.toDateString() === currentDate.toDateString();
            // const isNextSameSender = next?.sender?.id === msg.sender?.id && new Date(next.createdAt).toDateString() === currentDate.toDateString(); // Not directly used for styling here

            const showAvatarAndName = !isPrevSameSender;
            // Separate image attachments from other types
            const imageAttachments =
              msg.attachments?.filter(
                (att) => att.type === AttachmentType.IMAGE,
              ) || [];
            const otherAttachments =
              msg.attachments?.filter(
                (att) => att.type !== AttachmentType.IMAGE,
              ) || [];
            return (
              <div
                key={msg.id}
                className={`${isPrevSameSender ? "mt-0.5" : "mt-4"}`}
              >
                {showDateSeparator && renderDateSeparator(currentDate)}

                <div
                  className={`group relative flex items-start ${showAvatarAndName ? "px-4" : "px-0"} py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800/50`}
                >
                  {/* Avatar Column */}
                  <div
                    className={`mr-7 ${showAvatarAndName ? "w-8" : "self-center"} flex-shrink-0 pt-0.5`}
                  >
                    {!showAvatarAndName && (
                      <div className="ml-2 self-end text-[11px] text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        {format(currentDate, "p")}
                      </div>
                    )}
                    {showAvatarAndName && (
                      <Avatar className="size-11 rounded-sm">
                        <AvatarImage src={msg.sender?.image ?? ""} />
                        <AvatarFallback className="size-11 rounded-sm text-xs">
                          {initials(msg.sender?.name ?? "U")}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>

                  {/* Message Content Column */}
                  <div className="flex-grow">
                    {showAvatarAndName && (
                      <div className={`flex items-baseline space-x-2`}>
                        <span className="text-sm font-semibold text-foreground">
                          {msg.sender?.name ?? "Unknown User"}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {format(currentDate, "p")}
                        </span>
                      </div>
                    )}

                    {/* ===== IMAGE ATTACHMENTS (Displayed ABOVE text) ===== */}
                    {imageAttachments.length > 0 && (
                      <div
                        className={`mb-1 mt-1 flex flex-wrap gap-2 ${imageAttachments.length > 1 ? "max-w-md" : "max-w-xs"}`}
                      >
                        {imageAttachments.map((att) => (
                          <div
                            key={att.id}
                            className="relative overflow-hidden rounded-lg border dark:border-slate-700"
                          >
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <Image
                                src={att.url}
                                alt={att.fileName ?? "Attached image"}
                                width={imageAttachments.length > 1 ? 120 : 400} // Smaller if multiple images
                                height={imageAttachments.length > 1 ? 120 : 300}
                                className="object-contain transition-transform duration-200 ease-in-out group-hover:scale-105"
                                // For fixed size, or use layout="responsive" with a sized parent
                              />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ===== TEXT CONTENT (if any) ===== */}
                    {msg.content && msg.content.trim() !== "" && (
                      <div
                        className={`flex items-center justify-between ${imageAttachments.length > 0 ? "mt-1.5" : ""}`}
                      >
                        <p className="whitespace-pre-wrap break-words text-sm text-foreground">
                          {msg.content}
                        </p>
                      </div>
                    )}

                    {/* ===== OTHER ATTACHMENTS (VIDEO, FILE - Displayed BELOW text) ===== */}
                    {otherAttachments.length > 0 && (
                      <div
                        className={`mt-2 flex flex-col gap-1.5 ${(msg.content && msg.content.trim() !== "") || imageAttachments.length > 0 ? "border-t border-dashed pt-1 dark:border-slate-700/60" : ""}`}
                      >
                        {otherAttachments.map((att) => (
                          <div
                            key={att.id}
                            className="flex max-w-xs items-center gap-2 rounded-md bg-slate-100 p-2 dark:bg-slate-800"
                          >
                            {att.type === AttachmentType.VIDEO ? (
                              <VideoIcon className="h-5 w-5 flex-shrink-0 text-blue-500" />
                            ) : (
                              <FileText className="h-5 w-5 flex-shrink-0 text-gray-500" />
                            )}
                            <div className="flex-grow overflow-hidden">
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={att.fileName}
                                className="truncate text-xs font-medium text-primary hover:underline"
                                title={
                                  att.fileName ??
                                  (att.type === AttachmentType.VIDEO
                                    ? "Attached Video"
                                    : "Attached File")
                                }
                              >
                                {att.fileName ??
                                  (att.type === AttachmentType.VIDEO
                                    ? "Attached Video"
                                    : "Attached File")}
                              </a>
                              {att.fileSize && (
                                <p className="text-[10px] text-muted-foreground">
                                  {(att.fileSize / 1024).toFixed(1)} KB
                                </p>
                              )}
                            </div>
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={att.fileName}
                              aria-label="Download file"
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Message Options (Three Dots) - Only for own messages */}
                  {isOwnMessage && (
                    <div className="absolute right-2 top-0 opacity-0 transition-opacity group-hover:opacity-100">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-32 bg-background shadow-lg"
                        >
                          <DropdownMenuItem
                            onClick={() => handleOpenEditDialog(msg)}
                            className="cursor-pointer hover:bg-accent"
                          >
                            <Edit3 className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleOpenDeleteDialog(msg)}
                            className="cursor-pointer text-red-600 hover:!bg-red-500/10 hover:!text-red-700 dark:hover:!text-red-400"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={endRef} className="h-[1px]" /> {/* Scroll anchor */}
        </div>
      </ScrollArea>

      {/* Edit Message Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-background text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Message</DialogTitle>
            <DialogDescription>Make changes to your message.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="edit-message-content" className="sr-only">
              Message
            </Label>
            <Textarea
              id="edit-message-content"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-[80px] w-full rounded-md border bg-background p-2 text-sm text-foreground focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Edit your message..."
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleEditSubmit}
              disabled={
                updateMessageMutation.isPending ||
                editedContent.trim() === selectedMessage?.content.trim() ||
                !editedContent.trim()
              }
            >
              {updateMessageMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Message Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-background text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 text-destructive-foreground hover:bg-red-600/90"
              disabled={deleteMessageMutation.isPending}
            >
              {deleteMessageMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MessageList;
