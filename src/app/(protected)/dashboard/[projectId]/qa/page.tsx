"use client";

import AskQuestionCard from "@/components/dashboard/AskQuestionCard";
import CodeReferences from "@/components/dashboard/CodeReferences";
import { FilteredList } from "@/components/shared/FilteredList";
import NotFoundImage from "@/components/shared/NotFoundImage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useRefetch from "@/hooks/useRefetch";
import { initials, createBackgroundHue } from "@/lib/utils";
import { useDashboard } from "@/providers/DashboardProvider";
import { type AppRouter } from "@/server/api/root";
import { api } from "@/trpc/react";
import { type inferRouterOutputs } from "@trpc/server";
import MDEditor from "@uiw/react-md-editor";
import { Delete } from "lucide-react";
import React from "react";
import { toast } from "sonner";

type Question =
  inferRouterOutputs<AppRouter>["project"]["getQuestions"][number];
const QAPage = () => {
  const bgHue = createBackgroundHue();
  const dashboard = useDashboard();
  const [questionIndex, setQuestionIndex] = React.useState(0);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const refetch = useRefetch();
  if (!dashboard) return null;
  const { user, selectedProject } = dashboard;
  const { data: questions } = api.project.getQuestions.useQuery({
    projectId: selectedProject,
  });
  const deleteMutation = api.project.deleteQuestion.useMutation({
    onMutate: () => setIsDeleting(true),
    onSettled: () => setIsDeleting(false),
    onSuccess: async () => {
      toast.success("Question deleted successfully");
      await refetch();
      setOpenDialog(false);
    },
    onError: (error) => {
      toast.error("Failed to delete question");
      console.error("Error deleting question:", error);
    },
  });
  const question = questions?.[questionIndex];
  const getTitle = (q: Question) => q.question;
  const getAuthor = (q: Question) => q.user.name ?? "Unknown";
  const getDate = (q: Question) => new Date(q.createdAt);

  return (
    <Sheet>
      <AskQuestionCard />
      <div className="h-4" />
      <h1 className="text-xl font-semibold">Saved Questions</h1>
      <div className="h-2" />
      <div className="flex flex-col gap-2">
        {!questions ? (
          // Skeletons while loading
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-lg bg-muted p-4 shadow"
            >
              <Skeleton className="h-[30px] w-[30px] rounded-full border-white bg-sidebar shadow ring-1 ring-white dark:border-black dark:bg-foundation-blue-800 dark:ring-transparent" />
              <div className="flex w-full flex-col gap-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))
        ) : questions.length === 0 ? (
          <NotFoundImage text="No saved questions yet. Ask something to get started!" />
        ) : (
          <FilteredList
            items={questions}
            getTitle={getTitle}
            getAuthor={getAuthor}
            getDate={getDate}
            emptyState={
              <NotFoundImage text="No questions matched your search or filters." />
            }
            renderItem={(question, index) => (
              <ContextMenu>
                <ContextMenuTrigger asChild>
                  <SheetTrigger onClick={() => setQuestionIndex(index)}>
                    <div className="flex items-center gap-4 rounded-lg border-white bg-sidebar p-4 shadow ring-1 ring-inset ring-white dark:border-black dark:bg-foundation-blue-800 dark:ring-transparent">
                      <Avatar className="h-[30px] w-[30px]">
                        <AvatarImage
                          src={question.user.image ?? undefined}
                          alt={question.user.name}
                        />
                        <AvatarFallback
                          style={{ backgroundColor: bgHue, color: "white" }}
                        >
                          {initials(question.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex w-full flex-col text-left">
                        <div className="flex items-center justify-between gap-2">
                          <p className="line-clamp-1 text-base font-medium text-black dark:text-gray-300">
                            {question.question}
                          </p>
                          <span className="whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                            {new Date(question.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="line-clamp-1 text-xs text-gray-600">
                          {question.answer}
                        </p>
                      </div>
                    </div>
                  </SheetTrigger>
                </ContextMenuTrigger>

                <ContextMenuContent>
                  <ContextMenuItem
                    disabled
                    className="pointer-events-none text-muted-foreground opacity-100"
                  >
                    Asked by: {question.user.name}
                  </ContextMenuItem>
                  {question.user.id === user?.id ||
                  user?.memberships.find(
                    (member) => member.projectId === selectedProject,
                  )?.role === "MAINTAINER" ? (
                    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                      <DialogTrigger asChild>
                        <ContextMenuItem
                          onSelect={(e) => {
                            e.preventDefault(); // prevent auto-close
                            setOpenDialog(true);
                          }}
                          className={`flex items-center justify-between gap-2 text-red-600`}
                        >
                          <span>Delete</span>
                          <Delete className="size-5" />
                        </ContextMenuItem>
                      </DialogTrigger>

                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirm Deletion</DialogTitle>
                        </DialogHeader>

                        <p>
                          Are you sure you want to delete this question? This
                          action cannot be undone.
                        </p>

                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setOpenDialog(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => {
                              deleteMutation.mutate({
                                questionId: question.id,
                              });
                            }}
                            disabled={isDeleting}
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <ContextMenuItem
                            disabled
                            className="text-red-600 opacity-70"
                          >
                            Delete
                          </ContextMenuItem>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>Only maintainers can delete</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </ContextMenuContent>
              </ContextMenu>
            )}
          />
        )}
      </div>

      {question && (
        <SheetContent className="overflow-y-auto border-white bg-neutral-300 dark:border-black dark:bg-foundation-blue-800 sm:max-w-[80vw]">
          <SheetHeader>
            <SheetTitle className="text-black dark:text-neutral-100">
              {question.question}
            </SheetTitle>
            <MDEditor.Markdown
              source={question.answer}
              className="rounded-md p-3"
            />
            <CodeReferences
              // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
              filesReferences={question.filesReference ?? ([] as any)}
            />
          </SheetHeader>
        </SheetContent>
      )}
    </Sheet>
  );
};

export default QAPage;
