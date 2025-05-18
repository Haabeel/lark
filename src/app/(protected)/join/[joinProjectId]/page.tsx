import { db } from "@/server/db";
import { api } from "@/trpc/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import React from "react";

type Props = {
  params: Promise<{ joinProjectId: string }>;
};

const JoinHandler = async ({ params }: Props) => {
  const { joinProjectId } = await params;
  const session = await api.auth.getSession();

  if (!session?.user?.id) {
    redirect("/sign-in"); // This redirect is outside a try...catch, so it's fine
  }

  const userId = session.user.id;

  const project = await db.project.findUnique({
    where: {
      id: joinProjectId,
    },
  });

  if (!project) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Project Not Found</h2>
        <p>The project you are trying to join does not exist.</p>
        <p>Please make sure you have the correct link.</p>
        <Link
          href="/dashboard"
          style={{ marginTop: "20px", display: "inline-block" }}
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  let operationSuccessful = false;
  try {
    const existingMembership = await db.member.findUnique({
      where: {
        userId_projectId: {
          userId: userId,
          projectId: project.id,
        },
      },
    });

    if (existingMembership) {
      console.log(
        `User ${userId} is already a member of project ${project.id}.`,
      );
    } else {
      await db.member.create({
        data: {
          userId: userId,
          projectId: project.id,
        },
      });
      console.log(`User ${userId} successfully joined project ${project.id}.`);
    }
    operationSuccessful = true; // Mark operation as successful
  } catch (error) {
    console.error("Error during join project database operation:", error);
    return (
      // Return error UI if database operation fails
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Error Joining Project</h2>
        <p>An unexpected error occurred while trying to join the project.</p>
        <p>Please try again later or contact support.</p>
        <Link
          href="/dashboard"
          style={{ marginTop: "20px", display: "inline-block" }}
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  // If database operations were successful, then redirect
  if (operationSuccessful) {
    redirect(`/dashboard/${joinProjectId}/analytics`); // Called outside the try...catch
  }

  // Fallback return (though redirect should terminate rendering)
  // This might be needed if operationSuccessful is false but no error was caught (unlikely here)
  // Or if there's a desire for a non-redirecting success state component.
  // However, redirect() throws and terminates, so this is often not reached.
  return null;
};

export default JoinHandler;
