import useRefetch from "@/hooks/useRefetch";
import { db } from "@/server/db";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";
import React from "react";
import { toast } from "sonner";
type Props = {
  params: Promise<{ projectId: string }>;
};
const JoinHandler = async ({ params }: Props) => {
  const { projectId } = await params;
  const session = await api.auth.getSession();
  if (!session) return redirect("/sign-in");
  const project = await db.project.findUnique({
    where: {
      id: projectId,
    },
  });
  if (!project)
    return (
      <div>
        <p>Project not found.</p>
        <p>Make sure you have the right link.</p>
      </div>
    );
  try {
    await db.member.create({
      data: {
        userId: session.user.id,
        projectId: project.id,
      },
    });
    return redirect("/dashboard");
  } catch {
    toast.error("You are already a member of this project.");
  }
};

export default JoinHandler;
