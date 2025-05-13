import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  color?: string;
}

export function Spinner({ size = "md", className, color }: SpinnerProps) {
  const sizeClasses = {
    xs: "h-3 w-3",
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <Loader2 
      className={cn(
        "animate-spin [animation-duration:0.65s]", 
        sizeClasses[size], 
        color ? color : "text-primary",
        className
      )} 
    />
  );
} 