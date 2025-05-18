// components/dashboard/channel/ChatInput.tsx
"use client";

import { useState, useRef, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input as ShadInput } from "@/components/ui/input"; // Renamed to avoid conflict
import { Paperclip, SendHorizonal, Loader2, X } from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { type AttachmentType } from "@prisma/client";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"; // For scrollable previews

interface ChatInputProps {
  channelId: string;
}

// Helper to map MIME type to your AttachmentType enum
const getAttachmentTypeFromFile = (file: File): AttachmentType => {
  const mimeType = file.type;
  if (mimeType.startsWith("image/")) return "IMAGE";
  if (mimeType.startsWith("video/")) return "VIDEO";
  return "FILE"; // Default
};

const ChatInput = ({ channelId }: ChatInputProps) => {
  const [messageContent, setMessageContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<
    { file: File; url: string | null }[] // Store file with its preview URL
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = api.useContext();

  const sendMessageMutation = api.chat.sendMessage.useMutation({
    onSuccess: () => {
      setMessageContent("");
      setSelectedFiles([]);
      filePreviews.forEach((preview) => {
        if (preview.url) URL.revokeObjectURL(preview.url);
      }); // Revoke object URLs
      setFilePreviews([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      void utils.chat.getMessages.invalidate({ channelId });
    },
    onError: (error) => {
      toast.error(`Failed to send: ${error.message}`);
      //setIsUploading(false); // Keep isUploading true if only message sending failed after upload
    },
    onSettled: () => {
      setIsUploading(false); // Always reset uploading state when mutation finishes
    },
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newFilesArray = Array.from(files);

      if (selectedFiles.length + newFilesArray.length > 5) {
        // Example: Limit to 5 files total
        toast.error("You can attach a maximum of 5 files.");
        // Clear the input value so the user can try again if they want
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      const newFileObjects = newFilesArray
        .map((file) => {
          if (file.size > 10 * 1024 * 1024) {
            // Example: 10MB per file limit
            toast.error(`File "${file.name}" is too large (max 10MB).`);
            return null; // Skip this file
          }
          return file;
        })
        .filter(Boolean) as File[]; // Filter out nulls

      setSelectedFiles((prevFiles) => [...prevFiles, ...newFileObjects]);

      const newPreviewsData = newFileObjects.map((file) => ({
        file: file,
        url: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      }));
      setFilePreviews((prevPreviews) => [...prevPreviews, ...newPreviewsData]);
    }
    // Clear the input value to allow selecting the same file(s) again if one was removed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setSelectedFiles((prevFiles) =>
      prevFiles.filter((_, index) => index !== indexToRemove),
    );
    setFilePreviews((prevPreviews) => {
      const previewToRemove = prevPreviews[indexToRemove];
      if (previewToRemove?.url) {
        URL.revokeObjectURL(previewToRemove.url); // Clean up object URL
      }
      return prevPreviews.filter((_, index) => index !== indexToRemove);
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      (messageContent.trim() === "" && selectedFiles.length === 0) ||
      sendMessageMutation.isPending ||
      isUploading
    ) {
      if (messageContent.trim() === "" && selectedFiles.length === 0) {
        toast.info("Please type a message or select at least one file.");
      }
      return;
    }

    setIsUploading(true); // Set uploading true before any async operation

    const attachmentsDataForMutation: {
      url: string;
      type: AttachmentType;
      fileName?: string;
      fileSize?: number;
    }[] = [];

    try {
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const fileExt = file.name.split(".").pop() ?? "bin";
          const uniqueFileName = `${crypto.randomUUID()}.${fileExt}`;
          const filePath = `${channelId}/${uniqueFileName}`; // Organize by channel

          const { error: uploadError } = await supabase.storage
            .from("message-attachments") // Your bucket name
            .upload(filePath, file, { cacheControl: "3600", upsert: false });

          if (uploadError) {
            // If one file fails, we stop and report error for that file
            toast.error(
              `Failed to upload "${file.name}": ${uploadError.message}`,
            );
            throw uploadError; // This will be caught by the outer try-catch
          }

          const { data: urlData } = supabase.storage
            .from("message-attachments")
            .getPublicUrl(filePath);

          attachmentsDataForMutation.push({
            url: urlData.publicUrl,
            type: getAttachmentTypeFromFile(file),
            fileName: file.name,
            fileSize: file.size,
          });
        }
      }

      // All files uploaded (if any), now send the message
      sendMessageMutation.mutate({
        channelId,
        content: messageContent.trim(), // Always send a string, even if empty
        attachments:
          attachmentsDataForMutation.length > 0
            ? attachmentsDataForMutation
            : undefined,
      });
      // Note: setIsUploading(false) is now in onSettled of the mutation
    } catch (error) {
      // Catches errors from the upload loop
      console.error("File upload process error:", error);
      // Toast for general upload failure if not already handled per file
      // toast.error("An error occurred during file upload. Please try again.");
      setIsUploading(false); // Reset uploading state if upload loop fails
    }
  };

  return (
    <div className="flex flex-col border-t bg-background dark:border-slate-700">
      {/* File Previews Area */}
      {selectedFiles.length > 0 && (
        <ScrollArea className="w-full whitespace-nowrap border-b dark:border-slate-700">
          <div className="flex space-x-3 p-2">
            {filePreviews.map((previewItem, idx) => (
              <div
                key={idx}
                className="relative h-[60px] w-[60px] flex-shrink-0 rounded-md border dark:border-slate-600"
              >
                {previewItem.url &&
                previewItem.file.type.startsWith("image/") ? (
                  <Image
                    src={previewItem.url}
                    alt={previewItem.file.name}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-md"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center p-1">
                    <Paperclip className="h-6 w-6 text-muted-foreground" />
                    <span className="mt-1 w-full truncate text-center text-[10px] text-muted-foreground">
                      {previewItem.file.name}
                    </span>
                  </div>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -right-2 -top-2 z-10 h-5 w-5 rounded-full p-0.5 shadow-md"
                  onClick={() => handleRemoveFile(idx)}
                  aria-label="Remove file"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2 p-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          id="file-upload-input"
          accept="image/*,application/pdf,video/*,audio/*,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,image/heic,image/heif,.ts" // Added HEIC/HEIF
          multiple // <<< --- ALLOW MULTIPLE FILE SELECTION --- >>>
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || sendMessageMutation.isPending}
          aria-label="Attach files"
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        <ShadInput
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
          placeholder="Type a message or add files..."
          className="flex-grow"
          disabled={isUploading || sendMessageMutation.isPending}
          autoComplete="off"
        />
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          disabled={
            (messageContent.trim() === "" && selectedFiles.length === 0) ||
            isUploading ||
            sendMessageMutation.isPending
          }
          aria-label="Send message"
        >
          {isUploading || sendMessageMutation.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <SendHorizonal className="h-5 w-5" />
          )}
        </Button>
      </form>
    </div>
  );
};

export default ChatInput;
