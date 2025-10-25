"use client";

import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name?: string;
  email?: string;
  imageUrl?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function UserAvatar({
  name,
  email,
  imageUrl,
  size = "md",
  className,
}: UserAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  };

  const getInitials = () => {
    if (name) {
      const names = name.split(" ");
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return "??";
  };

  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-full bg-primary text-primary-foreground font-medium",
        sizeClasses[size],
        className,
      )}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name || email || "User"}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <span className={size === "sm" ? "text-xs" : "text-sm"}>
          {getInitials()}
        </span>
      )}
    </div>
  );
}
