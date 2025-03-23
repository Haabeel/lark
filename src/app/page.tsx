"use client";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";
import { api } from "@/trpc/react";
import Navbar from "../components/Navbar";
import { CreateProjectForm } from "@/components/CreateProject";

export default function Home() {
  const { data: session, isLoading, refetch } = api.auth.getSession.useQuery();
  const handleSignOut = async () => {
    try {
      await signOut();
      await refetch();
      console.log("session signed out successfully!");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <main>
      <Navbar />
      <section className="h-full w-screen overflow-x-hidden">
        {isLoading && <p>Loading...</p>}
        {session && (
          <div>
            <p>{session.user.id}</p>
            <Button onClick={handleSignOut}>Sign out</Button>
            <CreateProjectForm />
          </div>
        )}
      </section>
    </main>
  );
}
