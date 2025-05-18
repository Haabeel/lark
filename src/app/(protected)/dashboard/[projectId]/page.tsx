import { redirect } from "next/navigation";

interface PageProps {
  params: {
    projectId: string; // This will be populated by Next.js from the URL segment
  };
  // searchParams?: { [key: string]: string | string[] | undefined }; // If you needed query params
}

/**
 * This page component immediately redirects the user to the
 * analytics section of the specified project.
 * e.g., /project/abc-123/to-analytics -> /dashboard/abc-123/analytics
 */
export default async function ProjectAnalyticsRedirectPage({
  params,
}: PageProps) {
  const { projectId } = params;

  if (!projectId) {
    // Fallback redirect if projectId is somehow missing, though Next.js routing should ensure it's there.
    // You could redirect to a generic dashboard or an error page.
    console.error("Project ID missing in ProjectAnalyticsRedirectPage params.");
    redirect("/dashboard"); // Or an error page
  }

  // Construct the target URL for the analytics page
  const targetAnalyticsUrl = `/dashboard/${projectId}/analytics`;

  // Perform the redirect
  redirect(targetAnalyticsUrl);

  // Note: redirect() throws a NEXT_REDIRECT error, so nothing below this line
  // in this component will execute. You don't need to return null explicitly,
  // though it's not harmful if you do.
  // return null;
}

// Optional: Metadata for the page (though user won't see it due to redirect)
export async function generateMetadata({ params }: PageProps) {
  return {
    title: `Redirecting to Analytics for Project ${params.projectId}`,
  };
}
