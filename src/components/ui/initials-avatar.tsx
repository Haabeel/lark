import { cn } from "@/lib/utils";
import React, { useMemo } from "react";

type AvatarProps = {
  name?: string;
  size?: string; // accepts any valid CSS size (e.g., "40px", "3rem")
  className?: string;
  backgroundColor?: string;
};

const Avatar: React.FC<AvatarProps> = ({
  name,
  size = "3rem",
  className = "",
  backgroundColor,
}) => {
  const initials = useMemo(() => {
    if (!name) return "";
    const words = name.split(" ").filter(Boolean);
    if (words.length >= 2) {
      const firstLetter = words[0]?.[0] ?? "";
      const secondLetter = words[1]?.[0] ?? "";
      return (firstLetter + secondLetter).toUpperCase();
    } else if (words.length === 1) {
      return words[0]?.[0]?.toUpperCase() ?? "";
    }
    return "";
  }, [name]);

  // Generate a random background color with HSL ensuring it's not too bright.
  const createBackgroundColor = useMemo(() => {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 40%)`;
  }, []);

  return (
    <div
      className={cn(
        "flex size-8 items-center justify-center rounded-md",
        className,
      )}
      style={{
        backgroundColor: backgroundColor ?? createBackgroundColor,
        color: "#fff",
        userSelect: "none",
      }}
    >
      {initials}
    </div>
  );
};

export default Avatar;
