"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import useProject from "@/hooks/useProject";
import { Dialog, DialogClose, DialogContent, DialogHeader } from "../ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import Logo from "../shared/Logo";
import { askQuestion } from "@/app/(protected)/dashboard/actions";
import { readStreamableValue } from "ai/rsc";
import MDEditor from "@uiw/react-md-editor";
import CodeReferences from "./CodeReferences";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import useRefetch from "@/hooks/useRefetch";

const AskQuestionCard = () => {
  const { project } = useProject();
  const [question, setQuestion] = React.useState<string>("");
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [filesReferences, setFilesReferences] = React.useState<
    { fileName: string; sourceCode: string; summary: string }[]
  >([]);
  const [answer, setAnswer] = React.useState("");
  const saveAnswer = api.project.saveAnswer.useMutation();
  const refetch = useRefetch();

  const onSubmit = async (e: React.FormEvent) => {
    setAnswer("");
    setFilesReferences([]);
    if (!project?.id || question === "") return;
    e.preventDefault();
    setIsLoading(true);
    const { output, filesReferences } = await askQuestion(question, project.id);
    setFilesReferences(filesReferences);
    setOpen(true);
    for await (const delta of readStreamableValue(output)) {
      if (delta) {
        setAnswer((ans) => ans + delta);
      }
    }
    setIsLoading(false);
  };

  const handleSaveAnswer = async () => {
    if (!project?.id || question === "") return;
    setIsLoading(true);
    saveAnswer.mutate(
      {
        projectId: project.id,
        answer: answer,
        question: question,
        filesReferences: filesReferences,
      },
      {
        onSuccess: () => {
          toast.success("Answer saved successfully!");
          setIsLoading(false);
        },
        onError: () => {
          toast.error("Failed to save answer!");
          setIsLoading(false);
        },
      },
    );
    await refetch();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-auto max-h-[90vh] overflow-y-auto overflow-x-hidden border-none bg-foundation-blue-800 sm:max-w-[80vw]">
          <DialogHeader>
            <div className="flex max-w-[75vw] items-center justify-between pr-2">
              <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                <Logo height={40} width={40} />
                <span>{question}</span>
              </DialogTitle>
              <Button
                className="bg-foundation-blue-900 text-neutral-100 hover:bg-foundation-blue-600"
                disabled={saveAnswer.isPending}
                onClick={async () => {
                  await handleSaveAnswer();
                }}
              >
                Save Answer
              </Button>
            </div>
          </DialogHeader>
          <MDEditor.Markdown
            source={answer}
            className="!h-full max-w-[75vw] overflow-auto rounded-md p-3"
          />
          <CodeReferences filesReferences={filesReferences} />
          <div className="h-4"></div>
          <Button type="button" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogContent>
      </Dialog>
      <Card className="relative col-span-3 border-none bg-foundation-blue-900 text-neutral-100">
        <CardHeader>
          <CardTitle>Ask a question</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <Textarea
              placeholder="Type your question here..."
              className="resize-x-none max-h-44 border-brand-blue-700 placeholder:text-neutral-300"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <div className="h-4"></div>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-brand-blue-500 hover:bg-brand-blue-600 dark:text-neutral-100"
            >
              Ask Lark!
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default AskQuestionCard;
