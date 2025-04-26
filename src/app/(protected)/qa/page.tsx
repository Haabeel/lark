"use client";

import AskQuestionCard from "@/components/dashboard/AskQuestionCard";
import CodeReferences from "@/components/dashboard/CodeReferences";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import useProject from "@/hooks/useProject";
import { api } from "@/trpc/react";
import MDEditor from "@uiw/react-md-editor";
import Image from "next/image";
import React from "react";

const QAPage = () => {
  const { selectedProject } = useProject();
  const { data: questions } = api.project.getQuestions.useQuery({
    projectId: selectedProject,
  });
  const [questionIndex, setQuestionIndex] = React.useState(0);
  const question = questions?.[questionIndex];
  return (
    <Sheet>
      <AskQuestionCard />
      <div className="h-4"></div>
      <h1 className="text-xl font-semibold">Saved Questions</h1>
      <div className="h-2"></div>
      <div className="flex flex-col gap-2">
        {questions?.map((question, index) => {
          return (
            <React.Fragment key={index}>
              <SheetTrigger onClick={() => setQuestionIndex(index)}>
                <div className="flex items-center gap-4 rounded-lg border-black bg-foundation-blue-800 p-4 shadow">
                  <Image
                    className="h-[30px] w-[30px] rounded-full"
                    src={question.user.image ?? ""}
                    height={30}
                    width={30}
                    alt="image"
                  />
                  <div className="flex flex-col text-left">
                    <div className="flex items-center justify-between gap-2">
                      <p className="line-clamp-1 text-base font-medium text-gray-300">
                        {question.question}
                      </p>
                      <span className="whitespace-nowrap text-xs text-gray-400">
                        {question.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="line-clamp-1 text-xs text-gray-500">
                      {question.answer}
                    </p>
                  </div>
                </div>
              </SheetTrigger>
            </React.Fragment>
          );
        })}
      </div>
      {question && (
        <SheetContent className="overflow-y-auto border-black bg-foundation-blue-800 sm:max-w-[80vw]">
          <SheetHeader>
            <SheetTitle className="text-neutral-100">
              {question.question}
            </SheetTitle>
            <MDEditor.Markdown
              source={question.answer}
              className="rounded-md p-3"
            />
            {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */}
            <CodeReferences
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
              filesReferences={question.filesReference ?? ([] as any)}
            />
          </SheetHeader>
        </SheetContent>
      )}
    </Sheet>
  );
};

export default QAPage;
