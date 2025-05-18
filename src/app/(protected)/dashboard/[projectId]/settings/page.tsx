// app/dashboard/settings/page.tsx
"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Loader2,
  Mail,
  KeyRound,
  ExternalLink,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import {
  useSession,
  authClient, // Using the core client directly for methods
  // Or import specific methods if you prefer:
  // updatePassword, linkSocial, unlinkAccount, deleteUser, getOAuthSignInURL, emailOtp
} from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { OAuthProvider } from "better-auth";

type Provider =
  | "github"
  | "apple"
  | "discord"
  | "facebook"
  | "microsoft"
  | "google"
  | "spotify"
  | "twitch"
  | "twitter"
  | "dropbox"
  | "kick"
  | "linkedin"
  | "gitlab"
  | "tiktok"
  | "reddit"
  | "roblox"
  | "vk"
  | "zoom";

// --- Zod Schemas for Forms ---
const changeEmailSchemaStep1 = z.object({
  newEmail: z.string().email("Invalid email address."),
  // Depending on your Better Auth server config, password confirmation might be needed here
  // currentPasswordForEmailChange: z.string().min(1, "Password is required to change email."),
});
type ChangeEmailStep1FormValues = z.infer<typeof changeEmailSchemaStep1>;

// If OTP is used for new email verification:
// const changeEmailSchemaStep2 = z.object({
//   otp: z.string().min(6, "OTP must be 6 characters.").max(6),
// });
// type ChangeEmailStep2FormValues = z.infer<typeof changeEmailSchemaStep2>;

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters long."),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New passwords do not match.",
    path: ["confirmNewPassword"],
  });
type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export default function SettingsPage() {
  const {
    data: sessionData,
    isPending: isSessionPending,
    error: sessionError,
    refetch: refetchSession,
  } = useSession();
  const router = useRouter();

  const [pageLevelLoading, setPageLevelLoading] = useState(false); // For actions like link/unlink OAuth

  // Change Email States
  const [isChangeEmailDialogOpen, setIsChangeEmailDialogOpen] = useState(false);
  // const [emailChangeOtpSentTo, setEmailChangeOtpSentTo] = useState<string | null>(null); // For 2-step email change
  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors, isSubmitting: isSubmittingEmail },
    reset: resetEmailForm,
  } = useForm<ChangeEmailStep1FormValues>({
    resolver: zodResolver(changeEmailSchemaStep1),
  });

  // Change Password States
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] =
    useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors, isSubmitting: isSubmittingPassword },
    reset: resetPasswordForm,
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  // Delete Account State
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] =
    useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // --- Handlers ---
  const handleChangeEmailStep1: SubmitHandler<
    ChangeEmailStep1FormValues
  > = async (values) => {
    try {
      // CRITICAL: This flow depends entirely on your Better Auth server config for email change.
      // This is a common pattern: send OTP to NEW email, then verify.
      if (!authClient.emailOtp?.verifyEmail) {
        // Check if the method exists
        toast.error("Email change feature is not available.");
        return;
      }
      // The 'type' for emailOtp.send needs to be one your server recognizes for email change.
      await authClient.changeEmail({
        newEmail: values.newEmail,
        // currentPassword: values.currentPasswordForEmailChange, // If required by server
      });
      toast.success(
        `Verification code sent to ${values.newEmail}. Please check your email to complete the change.`,
      );
      // setEmailChangeOtpSentTo(values.newEmail); // For a potential step 2
      resetEmailForm();
      setIsChangeEmailDialogOpen(false);
      // Session won't update until the new email is verified and change is finalized.
    } catch (error) {
      toast.error(
        "Failed to initiate email change. Does the email already exist?",
      );
    }
  };

  const handleChangePassword: SubmitHandler<ChangePasswordFormValues> = async (
    values,
  ) => {
    try {
      if (!authClient.changePassword) {
        toast.error("Password update feature not available.");
        return;
      }
      await authClient.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success("Password changed successfully!");
      resetPasswordForm();
      setIsChangePasswordDialogOpen(false);
    } catch (error) {
      toast.error("Failed to change password. Check current password.");
    }
  };

  const handleLinkOAuth = async (provider: string) => {
    setPageLevelLoading(true);
    try {
      if (!authClient.linkSocial) {
        toast.error("OAuth linking feature not available.");
        setPageLevelLoading(false);
        return;
      }
      const { data, error } = await authClient.linkSocial({
        provider,
        options: { type: "link" },
      });
      if (error) throw new Error(`Could not get ${provider} link URL.`);
      // No need to setPageLevelLoading(false) here as page will redirect
    } catch (error) {
      toast.error(`Failed to link ${provider}.`);
      setPageLevelLoading(false);
    }
  };

  const handleUnlinkOAuth = async (provider: string) => {
    if (
      !confirm(
        `Are you sure you want to unlink your ${provider} account? This might affect how you sign in.`,
      )
    )
      return;
    setPageLevelLoading(true);
    try {
      if (!authClient.unlinkAccount) {
        toast.error("OAuth unlinking feature not available.");
        setPageLevelLoading(false);
        return;
      }
      await authClient.unlinkAccount({ providerId: provider });
      toast.success(`${provider} account unlinked successfully!`);
      await refetchSession();
    } catch (error) {
      toast.error(`Failed to unlink ${provider}.`);
    } finally {
      setPageLevelLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm.");
      return;
    }
    setPageLevelLoading(true);
    try {
      if (!authClient.deleteUser) {
        toast.error("Account deletion feature not available.");
        setPageLevelLoading(false);
        return;
      }
      await authClient.deleteUser({ callbackURL: "/sign-up" }); // This likely signs out and redirects via AuthUIProvider's onSessionChange
      toast.info("Account deletion process initiated. You will be signed out.");
      setIsDeleteAccountDialogOpen(false);
      // Better Auth should handle session invalidation and redirect.
      // Manually calling router.push('/') or similar might be needed if BA doesn't redirect.
    } catch (error) {
      toast.error("Failed to delete account.");
      setPageLevelLoading(false);
    }
  };

  if (isSessionPending) {
    /* ... loading UI ... */
  }
  if (sessionError || !sessionData?.user) {
    /* ... error/no session UI ... */
  }

  const { data: user } = api.user.getUser.useQuery();
  const userLinkedProviders = user?.accounts.map((u) => u.providerId) ?? [];
  // Define these based on what you configured in Better Auth server-side
  const configuredOAuthProviders = ["google", "github", "microsoft"]; // Example

  const isPasswordAuthEnabled = userLinkedProviders.includes("credential");

  return (
    <div className="container mx-auto max-w-2xl space-y-10 px-4 py-8 md:px-0 md:py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Account Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account preferences and security settings.
        </p>
      </header>
      <Separator />

      {/* Change Email Section */}
      <Card>
        <CardHeader>
          <CardTitle>Email Address</CardTitle>
          <CardDescription>
            Current:{" "}
            <span className="font-medium text-foreground">{user?.email}</span>
            {user?.emailVerified ? (
              <span className="ml-2 text-xs text-green-500">(Verified)</span>
            ) : (
              <span className="ml-2 text-xs text-yellow-500">
                (Not Verified)
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog
            open={isChangeEmailDialogOpen}
            onOpenChange={setIsChangeEmailDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                disabled={pageLevelLoading || isSubmittingEmail}
              >
                Change Email
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-background sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Change Email Address</DialogTitle>
                <DialogDescription>
                  A verification code will be sent to your new email address.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={handleSubmitEmail(handleChangeEmailStep1)}
                className="space-y-4 pt-2"
              >
                <div>
                  <Label htmlFor="newEmailChange">New Email</Label>
                  <Input
                    id="newEmailChange"
                    type="email"
                    {...registerEmail("newEmail")}
                  />
                  {emailErrors.newEmail && (
                    <p className="mt-1 text-xs text-destructive">
                      {emailErrors.newEmail.message}
                    </p>
                  )}
                </div>
                {/* Add current password input if server requires it for email change */}
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="ghost">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    disabled={isSubmittingEmail || pageLevelLoading}
                  >
                    {(isSubmittingEmail || pageLevelLoading) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}{" "}
                    Send Verification
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Change Password Section */}
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Update your account password.</CardDescription>
        </CardHeader>
        <CardContent>
          {!isPasswordAuthEnabled &&
          !userLinkedProviders.includes("credential") &&
          userLinkedProviders.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              You signed up using {userLinkedProviders[0]}. Password management
              is not available for OAuth accounts unless a password was
              explicitly set.
            </p>
          ) : (
            <Dialog
              open={isChangePasswordDialogOpen}
              onOpenChange={setIsChangePasswordDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  disabled={pageLevelLoading || isSubmittingPassword}
                >
                  Change Password
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-background sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={handleSubmitPassword(handleChangePassword)}
                  className="space-y-4 pt-2"
                >
                  {/* Current Password Input */}
                  <div>
                    <Label htmlFor="currentPasswordSettings">
                      Current Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="currentPasswordSettings"
                        type={showCurrentPassword ? "text" : "password"}
                        {...registerPassword("currentPassword")}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {passwordErrors.currentPassword && (
                      <p className="mt-1 text-xs text-destructive">
                        {passwordErrors.currentPassword.message}
                      </p>
                    )}
                  </div>
                  {/* New Password Input */}
                  <div>
                    <Label htmlFor="newPasswordSettings">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPasswordSettings"
                        type={showNewPassword ? "text" : "password"}
                        {...registerPassword("newPassword")}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {passwordErrors.newPassword && (
                      <p className="mt-1 text-xs text-destructive">
                        {passwordErrors.newPassword.message}
                      </p>
                    )}
                  </div>
                  {/* Confirm New Password Input */}
                  <div>
                    <Label htmlFor="confirmNewPasswordSettings">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmNewPasswordSettings"
                      type={showNewPassword ? "text" : "password"}
                      {...registerPassword("confirmNewPassword")}
                    />
                    {passwordErrors.confirmNewPassword && (
                      <p className="mt-1 text-xs text-destructive">
                        {passwordErrors.confirmNewPassword.message}
                      </p>
                    )}
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="ghost">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button
                      type="submit"
                      disabled={isSubmittingPassword || pageLevelLoading}
                    >
                      {(isSubmittingPassword || pageLevelLoading) && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}{" "}
                      Update Password
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </CardContent>
      </Card>

      {/* Linked Accounts (OAuth) Section */}
      <Card>
        <CardHeader>
          <CardTitle>Linked Accounts</CardTitle>
          <CardDescription>
            Connect or disconnect third-party services.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {configuredOAuthProviders.map((provider) => {
            const isLinked = userLinkedProviders.includes(provider);
            // Placeholder for provider icons - replace with actual icons
            // const ProviderIcon = provider === "google" ? GoogleIcon : provider === "github" ? GithubIcon : ExternalLink;
            return (
              <div
                key={provider}
                className="flex items-center justify-between rounded-md border p-3 dark:border-slate-700"
              >
                <div className="flex items-center gap-3">
                  {/* <ProviderIcon className="h-5 w-5" /> */}
                  <span className="text-sm font-medium capitalize text-foreground">
                    {provider}
                  </span>
                </div>
                {isLinked ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnlinkOAuth(provider)}
                    disabled={
                      pageLevelLoading ||
                      (userLinkedProviders.length <= 1 &&
                        isPasswordAuthEnabled === false)
                    }
                  >
                    {pageLevelLoading && (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    )}{" "}
                    Unlink
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLinkOAuth(provider)}
                    disabled={pageLevelLoading}
                  >
                    {pageLevelLoading && (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    )}{" "}
                    Link Account
                  </Button>
                )}
              </div>
            );
          })}
          {configuredOAuthProviders.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No social login providers configured by the administrator.
            </p>
          )}
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            {userLinkedProviders.length <= 1 &&
              !isPasswordAuthEnabled &&
              "You must have at least one linked account or a password set to ensure account access."}
          </p>
        </CardFooter>
      </Card>

      {/* Danger Zone - Delete Account Section */}
      <Separator />
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="mb-4 text-sm">
            Permanently delete your account and all associated data. This action
            cannot be undone.
          </CardDescription>
          <AlertDialog
            open={isDeleteAccountDialogOpen}
            onOpenChange={setIsDeleteAccountDialogOpen}
          >
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={pageLevelLoading}>
                Delete My Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-background">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your account. To confirm, please
                  type &quot;DELETE&quot; in the box below.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder='Type "DELETE" to confirm'
                className="my-2 border-destructive focus-visible:ring-destructive"
              />
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={pageLevelLoading || deleteConfirmText !== "DELETE"}
                >
                  {pageLevelLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Yes, delete my account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
