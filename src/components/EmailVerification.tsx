"use client";
import React, { useEffect, useState } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "./ui/input-otp";
import { Button } from "./ui/button";
import { emailOtp } from "@/lib/auth-client";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
const EmailVerification = ({
  email,
}: {
  isEmailVerified: boolean;
  email: string;
}) => {
  const [otp, SetOtp] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [hasMounted, setHasMounted] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [hasSent, setHasSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const onSendOTPSubmit = async () => {
    try {
      if (email == "" || secondsLeft > 0) return;
      setLoading(true);
      await emailOtp
        .sendVerificationOtp({
          email,
          type: "email-verification",
        })
        .then(() => {
          toast.success("OTP sent successfully");
          setHasSent(true);
          if (hasMounted) {
            const endTime = Date.now() + 60000;
            localStorage.setItem("otpCountdownEnd", endTime.toString());
            setSecondsLeft(60);
            setHasSent(true);
          }
        });
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast.error("Error sending OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) {
      return;
    }
    try {
      setLoading(true);
      toast.loading("Verifying OTP...", {
        id: "loader",
      });
      const res = await emailOtp.verifyEmail(
        {
          email,
          otp,
        },
        {
          onSuccess: () => {
            toast.success("Email verified successfully");
            router.push("/dashboard");
            setLoading(false);
          },
        },
      );
      if (res.error) {
        toast.error(res.error.message);
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast.error("Error verifying OTP");
      setLoading(false);
    } finally {
      toast.dismiss("loader");
    }
  };

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;
    const storedEndTime = localStorage.getItem("otpCountdownEnd");
    if (storedEndTime) {
      const remaining = Math.max(
        Math.floor((parseInt(storedEndTime) - Date.now()) / 1000),
        0,
      );
      setSecondsLeft(remaining);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return setHasSent(false);
    }
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          localStorage.removeItem("otpCountdownEnd");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "otpCountdownEnd") {
        if (!e.newValue) {
          setSecondsLeft(0);
        } else {
          const remaining = Math.max(
            Math.floor((parseInt(e.newValue) - Date.now()) / 1000),
            0,
          );
          setSecondsLeft(remaining);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <InputOTP
        maxLength={6}
        pattern={REGEXP_ONLY_DIGITS}
        onChange={(value) => SetOtp(value)}
        onComplete={verifyOTP}
        className="w-full"
      >
        <InputOTPGroup className="w-full">
          <InputOTPSlot index={0} className="h-9 w-9 sm:h-10 sm:w-10" />
          <InputOTPSlot index={1} className="h-9 w-9 sm:h-10 sm:w-10" />
          <InputOTPSlot index={2} className="h-9 w-9 sm:h-10 sm:w-10" />
          <InputOTPSeparator />
          <InputOTPSlot index={3} className="h-9 w-9 sm:h-10 sm:w-10" />
          <InputOTPSlot index={4} className="h-9 w-9 sm:h-10 sm:w-10" />
          <InputOTPSlot index={5} className="h-9 w-9 sm:h-10 sm:w-10" />
        </InputOTPGroup>
      </InputOTP>
      <Button
        type="button"
        onClick={onSendOTPSubmit}
        className="w-full bg-brand-blue-800 text-black dark:bg-brand-blue-500 dark:text-neutral-100"
        disabled={
          !email || email == "" || !hasMounted || secondsLeft > 0 || loading
        }
      >
        {secondsLeft > 0 ? `Resend OTP in ${secondsLeft}s` : "Send OTP"}
      </Button>
    </div>
  );
};

export default EmailVerification;
