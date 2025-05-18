import { redirect } from "next/navigation";
import { type Metadata } from "next"; // Import Metadata type

interface PageProps {
  params: Promise<{ projectId: string }>; // params is also a Promise
  searchParams: Promise<Record<string, string | string[] | undefined>>; // searchParams is a Promise
}

/**
 * This page component (if located at /dashboard/[projectId]/page.tsx)
 * immediately redirects the user to the analytics section of the specified project.
 */
export default async function ProjectRedirectPage({
  // Renamed for clarity if this is its sole purpose
  params: paramsPromise, // Receive the promise
}: PageProps) {
  const params = await paramsPromise; // Await the promise to get the actual params object
  const { projectId } = params;

  if (!projectId) {
    console.error(
      "Project ID missing in ProjectRedirectPage params after await.",
    );
    redirect("/dashboard");
    return; // Explicit return after redirect, though redirect throws
  }

  const targetAnalyticsUrl = `/dashboard/${projectId}/analytics`;
  redirect(targetAnalyticsUrl);

  // This part of the component will not be reached due to redirect() throwing an error.
}

export async function generateMetadata({
  params: paramsPromise,
}: PageProps): Promise<Metadata> {
  // Added Promise<Metadata>
  const params = await paramsPromise; // Await here as well
  return {
    title: `Redirecting to Analytics for Project ${params.projectId}`,
  };
}
