import React from "react";
import { FcGoogle } from "react-icons/fc";
import FcMicrosoft from "@/components/icons/FcMicrosoft.svg";
import { FaGithub } from "react-icons/fa";
import { Button } from "../ui/button";
import { signIn } from "@/lib/auth-client";
import { toast } from "sonner";

interface Props {
  type: "sign in" | "sign up";
}

interface SocialProvider {
  provider: "google" | "microsoft" | "github";
  Icon: React.ComponentType;
}

const socialProviders: SocialProvider[] = [
  {
    provider: "google",
    Icon: FcGoogle,
  },
  {
    provider: "microsoft",
    Icon: FcMicrosoft as React.ComponentType,
  },
  {
    provider: "github",
    Icon: FaGithub,
  },
];

const SocialProviders = ({ type }: Props) => {
  const handleSocialSignIn = async (
    provider: "google" | "microsoft" | "github",
  ) => {
    try {
      const response = await signIn.social({ provider });

      if (response?.error) {
        toast.error(response.error.message);
      } else {
        console.log("WORKED", response.data);
      }
    } catch {
      toast.error("Authentication failed");
    }
  };
  return (
    <>
      {socialProviders.map(({ provider, Icon }) => (
        <Button
          key={provider}
          type="button"
          className={`flex w-full items-center justify-center gap-3 bg-white text-brand-blue-900 hover:bg-slate-50`}
          onClick={() => handleSocialSignIn(provider)}
        >
          <Icon />
          <p
            className={`hidden sm:block`}
          >{`${provider.at(0)?.toUpperCase() + provider.substring(1)}`}</p>
        </Button>
      ))}
    </>
  );
};

export default SocialProviders;
