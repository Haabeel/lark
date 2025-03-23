import React from "react";
import { FcGoogle } from "react-icons/fc";
import FcMicrosoft from "@/components/icons/FcMicrosoft.svg";
import { FaGithub } from "react-icons/fa";
import { Button } from "../ui/button";

interface Props {
  socialSignIn: (OAuthProvider: "google" | "microsoft" | "github") => void;
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

const SocialProviders = ({ socialSignIn }: Props) => {
  return (
    <>
      {socialProviders.map(({ provider, Icon }) => (
        <Button
          key={provider}
          type="button"
          className={`flex w-full items-center justify-center gap-3 bg-white text-brand-blue-900 hover:bg-slate-50`}
          onClick={() => socialSignIn(provider)}
        >
          <Icon />
          <p>{`Sign In with ${provider.at(0)?.toUpperCase() + provider.substring(1)}`}</p>
        </Button>
      ))}
    </>
  );
};

export default SocialProviders;
