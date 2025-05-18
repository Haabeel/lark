"use client";

import { useEffect, useState, useRef, type ChangeEvent } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import { Loader2, Save, UploadCloud } from "lucide-react";
import { initials } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";

// Define the form schema using Zod, matching the tRPC input
const profileFormSchema = z.object({
  name: z.string().min(2, "Display name must be at least 2 characters."),
  firstName: z.string().min(2, "First name must be at least 2 characters."),
  lastName: z.string().optional(),
  email: z.string().email().optional(), // Email is usually not editable here
  image: z.string().url("Invalid image URL format.").optional().nullable(), // Image URL from form
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const AVATAR_BUCKET_NAME = "profile-pictures"; // Define your bucket name

export default function ProfilePage() {
  const utils = api.useContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null); // For client-side preview
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const {
    data: userProfile,
    isLoading: isLoadingProfile,
    isError,
    error,
  } = api.user.getCurrentUserProfile.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const updateProfileMutation = api.user.updateCurrentUserProfile.useMutation({
    onSuccess: (updatedData) => {
      toast.success("Profile updated successfully!");
      void utils.user.getCurrentUserProfile.invalidate(); // Refetch profile to show all updated data
      setSelectedImageFile(null); // Clear selection
      if (imagePreviewUrl?.startsWith("blob:")) {
        // Only revoke blob URLs
        URL.revokeObjectURL(imagePreviewUrl);
      }
      // The useEffect will repopulate imagePreviewUrl from the new userProfile.image
      // No need to explicitly set imagePreviewUrl here from updatedData.image
      // Reset form with new data to clear isDirty state for text fields as well
      reset({
        name: updatedData.name ?? "",
        firstName: updatedData.firstName ?? "",
        lastName: updatedData.lastName ?? "",
        email: updatedData.email ?? "",
        image: updatedData.image ?? null,
      });
    },
    onError: (error) => {
      toast.error(`Failed to update profile: ${error.message}`);
    },
    onSettled: () => {
      setIsUploadingImage(false); // Reset uploading state regardless of text/image update
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues, // To get current form values
    formState: {
      errors,
      isSubmitting: isSubmittingTextForm,
      isDirty: isTextFormDirty,
    },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      firstName: "",
      lastName: "",
      email: "",
      image: null,
    },
  });

  useEffect(() => {
    if (userProfile) {
      reset({
        name: userProfile.name ?? "",
        firstName: userProfile.firstName ?? "",
        lastName: userProfile.lastName ?? "",
        email: userProfile.email ?? "",
        image: userProfile.image ?? null, // Initialize form's image field
      });
      setImagePreviewUrl(userProfile.image ?? null); // Set visual preview
    }
  }, [userProfile, reset]);

  // Handler for submitting text changes (name, firstName, lastName)
  const onProfileTextSubmit: SubmitHandler<ProfileFormValues> = (data) => {
    // We only want to submit text fields here. Image is handled separately or together.
    const { email, image, ...textDataToSubmit } = data;
    updateProfileMutation.mutate(textDataToSubmit);
  };

  const handleImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image too large (max 2MB).");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file.");
        return;
      }

      setSelectedImageFile(file);
      if (imagePreviewUrl?.startsWith("blob:"))
        URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(URL.createObjectURL(file));
      // No need to setValue('image', ...) here if we handle submit with the new URL
    }
  };

  const handleSaveProfile = async () => {
    if (!userProfile?.id && !selectedImageFile) {
      // If only text fields are dirty, submit them
      if (isTextFormDirty) {
        await handleSubmit(onProfileTextSubmit)(); // Trigger RHF submission for text fields
      }
      return;
    }

    setIsUploadingImage(true); // Indicate general saving process

    let newImageUrl: string | undefined | null = getValues("image"); // Start with current image URL from form

    if (selectedImageFile && userProfile?.id) {
      try {
        const fileExt = selectedImageFile.name.split(".").pop() ?? "png";
        const fileName = `${userProfile.id}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from(AVATAR_BUCKET_NAME)
          .upload(fileName, selectedImageFile, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from(AVATAR_BUCKET_NAME)
          .getPublicUrl(fileName);
        if (!urlData?.publicUrl)
          throw new Error("Could not get public URL for uploaded image.");
        newImageUrl = urlData.publicUrl;
      } catch (error) {
        console.error("Image upload error:", error);
        toast.error("Failed to upload image.");
        setIsUploadingImage(false);
        return; // Stop if image upload fails
      }
    }

    // Now, gather all form data, including the potentially new image URL
    const currentFormValues = getValues();
    const dataToSubmit: Partial<ProfileFormValues> = {
      name: currentFormValues.name,
      firstName: currentFormValues.firstName,
      lastName: currentFormValues.lastName,
      image: newImageUrl, // Use the new URL if upload happened, else existing from form
    };

    // Filter out unchanged fields if you only want to send dirty fields
    // For simplicity, we send all, and the backend handles what's undefined.
    // Or, ensure that your tRPC input schema has all these as optional if sending selectively.

    updateProfileMutation.mutate(dataToSubmit); // Cast if dataToSubmit doesn't perfectly match input due to optionality
  };

  if (isLoadingProfile) {
    /* ... loading UI ... */
  }
  if (isError || !userProfile) {
    /* ... error UI ... */
  }

  // Determine if any change (text or new image) has been made
  const hasUnsavedChanges = isTextFormDirty || !!selectedImageFile;

  return (
    <div className="container mx-auto max-w-3xl space-y-8 px-4 py-8 md:px-6 md:py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Profile Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account information and preferences.
        </p>
      </header>
      <Separator />

      {/* Profile Picture Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>
            Update your avatar. Click the image or button to choose a new one.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6 sm:flex-row">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageFileChange}
            className="hidden"
            accept="image/png, image/jpeg, image/gif, image/webp"
            id="profile-image-upload"
          />
          <Label htmlFor="profile-image-upload" className="cursor-pointer">
            <Avatar className="h-24 w-24 border text-3xl transition-opacity hover:opacity-80 sm:h-32 sm:w-32">
              <AvatarImage
                src={imagePreviewUrl ?? undefined}
                alt={userProfile?.name ?? "User"}
              />
              <AvatarFallback>
                {initials(userProfile?.name ?? userProfile?.firstName ?? "U")}
              </AvatarFallback>
            </Avatar>
          </Label>
          <div className="grid flex-1 gap-2 text-center sm:text-left">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage || updateProfileMutation.isPending}
            >
              <UploadCloud className="mr-2 h-4 w-4" /> Choose Picture
            </Button>
            <p className="text-xs text-muted-foreground">
              Max 2MB. JPG, PNG, GIF, WebP. Recommended 200x200px.
            </p>
            {selectedImageFile && (
              <p className="mt-1 text-xs text-muted-foreground">
                Selected:{" "}
                <span className="font-medium">{selectedImageFile.name}</span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Personal Information Form (Main form for text, but image is part of its values) */}
      <form onSubmit={handleSubmit(onProfileTextSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your personal details. Click &quot;Save All Changes&quot;
              below after making modifications to text fields or selecting a new
              picture.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            {/* ... First Name, Last Name, Display Name, Email Inputs ... */}
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="John"
                {...register("firstName")}
                className={errors.firstName ? "border-destructive" : ""}
              />
              {errors.firstName && (
                <p className="text-xs text-destructive">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">
                Last Name{" "}
                <span className="text-xs text-muted-foreground">
                  (Optional)
                </span>
              </Label>
              <Input
                id="lastName"
                placeholder="Doe"
                {...register("lastName")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                placeholder="JohnD"
                {...register("name")}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={userProfile?.email ?? ""}
                readOnly
                className="cursor-not-allowed bg-muted/50"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed here.
              </p>
            </div>
          </CardContent>
          {/* Footer for the entire profile form including text and image */}
        </Card>

        <div className="flex justify-end pt-2">
          <Button
            type="button" // Changed from submit to button, handled by handleSaveProfile
            onClick={handleSaveProfile}
            disabled={
              !hasUnsavedChanges ||
              isUploadingImage ||
              updateProfileMutation.isPending
            }
          >
            {(isUploadingImage || updateProfileMutation.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save All Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
