"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Corrected path
import { Textarea } from "@/components/ui/textarea"; // Corrected path
import { Button } from "@/components/ui/button"; // Corrected path
import useProject from "@/hooks/useProject";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog"; // Corrected path for DialogTrigger
import { DialogTitle } from "@radix-ui/react-dialog"; // This is fine
import Logo from "../shared/Logo";
import { readStreamableValue } from "ai/rsc";
import MDEditor from "@uiw/react-md-editor";
import CodeReferences from "./CodeReferences";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import useRefetch from "@/hooks/useRefetch";
import { askQuestion } from "@/app/(protected)/dashboard/[projectId]/commits/actions"; // Assuming this path is correct
import { Loader2, Send, Save, X } from "lucide-react"; // Added icons

const AskQuestionCard = () => {
  const { project } = useProject();
  const [question, setQuestion] = React.useState<string>("");
  const [hasSaved, setHasSaved] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [isAsking, setIsAsking] = React.useState(false); // Renamed from isLoading for clarity
  const [isSaving, setIsSaving] = React.useState(false); // Specific loading for save
  const [filesReferences, setFilesReferences] = React.useState<
    { fileName: string; sourceCode: string; summary: string }[]
  >([]);
  const [answer, setAnswer] = React.useState("");
  const saveAnswerMutation = api.project.saveAnswer.useMutation(); // Renamed for clarity
  const refetch = useRefetch();

  const onSubmit = async (e: React.FormEvent) => {
    setAnswer("");
    setFilesReferences([]);
    setHasSaved(false); // Reset save state for new question
    if (!project?.id || question.trim() === "") {
      toast.error("Please enter a question.");
      return;
    }
    e.preventDefault();
    setIsAsking(true);
    try {
      const { output, filesReferences: refs } = await askQuestion(
        question,
        project.id,
      );
      setFilesReferences(refs);
      setOpen(true); // Open dialog after getting references
      let currentAnswer = "";
      for await (const delta of readStreamableValue(output)) {
        if (delta) {
          currentAnswer += delta;
          setAnswer(currentAnswer);
        }
      }
    } catch (error) {
      console.error("Error asking question:", error);
      toast.error("Failed to get an answer. Please try again.");
    } finally {
      setIsAsking(false);
    }
  };

  const handleSaveAnswer = async () => {
    if (!project?.id || question.trim() === "" || answer.trim() === "") {
      toast.error("Cannot save an empty question or answer.");
      return;
    }
    setIsSaving(true);
    saveAnswerMutation.mutate(
      {
        projectId: project.id,
        answer: answer,
        question: question,
        filesReferences: filesReferences,
      },
      {
        onSuccess: () => {
          toast.success("Answer saved successfully!");
          setHasSaved(true);
        },
        onError: (err) => {
          toast.error(err.message || "Failed to save answer!");
        },
        onSettled: () => {
          setIsSaving(false);
          void refetch(); // Refetch relevant data if needed
        },
      },
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[90vh] w-[95vw] flex-col rounded-md border-white bg-neutral-300 p-0 dark:border-none dark:bg-foundation-blue-800 sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[70vw] xl:max-w-[60vw]">
          <DialogHeader className="sticky top-0 z-10 rounded-md border-b border-border bg-inherit p-4">
            {" "}
            {/* Make header sticky */}
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="flex items-center gap-2 truncate text-base font-semibold sm:text-lg">
                <Logo height={30} width={30} className="hidden sm:block" />{" "}
                {/* Hide logo on xs */}
                <span className="truncate" title={question}>
                  {question || "AI Answer"}
                </span>
              </DialogTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default" // Or your primary style
                  disabled={isSaving || hasSaved || answer.trim() === ""}
                  onClick={handleSaveAnswer}
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {hasSaved ? "Saved" : "Save"}
                </Button>
                <DialogClose asChild>
                  <Button size="icon" variant="ghost" aria-label="Close dialog">
                    <X className="h-4 w-4" />
                  </Button>
                </DialogClose>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-grow space-y-4 overflow-y-auto rounded-md p-4">
            {" "}
            {/* Scrollable content area */}
            <div
              data-color-mode={
                typeof window !== "undefined" &&
                document.documentElement.classList.contains("dark")
                  ? "dark"
                  : "light"
              }
            >
              <MDEditor.Markdown
                source={answer}
                className="!bg-transparent p-1 text-sm sm:text-base" // Adjusted padding and text size
                // Ensure MDEditor styles adapt to dark/light mode, sometimes needs explicit props or wrapper
              />
            </div>
            {filesReferences && filesReferences.length > 0 && (
              <CodeReferences filesReferences={filesReferences} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Card className="relative border-sidebar bg-sidebar text-neutral-100 dark:border-none dark:bg-foundation-blue-900">
        <CardHeader>
          <CardTitle className="text-lg text-neutral-800 dark:text-neutral-100 sm:text-xl">
            Ask a question about your codebase
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <Textarea
              placeholder="Type your question here... e.g., 'Explain the authentication flow' or 'Where is the user profile updated?'"
              className="placeholder-text-foundation-blue-900 max-h-40 min-h-[80px] resize-none border-sidebar text-neutral-800 focus:border-transparent dark:border-brand-blue-700 dark:text-neutral-100 dark:placeholder:text-neutral-300 sm:max-h-44"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3} // Start with a decent number of rows
            />
            <Button
              type="submit"
              disabled={isAsking || question.trim() === ""}
              className="w-full bg-brand-blue-500 hover:bg-brand-blue-600 dark:text-neutral-100 sm:w-auto" // Full width on mobile
            >
              {isAsking ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Ask Lark!
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default AskQuestionCard;
