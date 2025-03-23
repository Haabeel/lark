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
  isEmailVerified,
  email,
}: {
  isEmailVerified: boolean;
  email: string;
}) => {
  const [otp, SetOtp] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [hasMounted, setHasMounted] = useState(false);
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
            // setSecondsLeft(60);
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
    <div>
      <InputOTP
        maxLength={6}
        pattern={REGEXP_ONLY_DIGITS}
        onChange={(value) => SetOtp(value)}
        onComplete={verifyOTP}
      >
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSeparator />
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
      <Button
        type="button"
        onClick={onSendOTPSubmit}
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
