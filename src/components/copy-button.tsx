"use client";

import { Check, Copy, Loader } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";

type CopyButtonProps = {
  variant?:
    | "default"
    | "destructive"
    | "ghost"
    | "link"
    | "outline"
    | "secondary"
    | null
    | undefined;
  size?: "default" | "lg" | "sm" | "xs";
  text?: boolean;
  value: string;
};

const CopyButton = ({
  variant = "outline",
  size = "xs",
  text = false,
  value,
}: CopyButtonProps) => {
  const [copyState, setCopyState] = useState<"idle" | "loading" | "success">(
    "idle",
  );

  const handleCopy = async (text: string) => {
    try {
      setCopyState("loading");
      await navigator.clipboard.writeText(text);
      setTimeout(() => {
        setCopyState("success");
      }, 500);
      setTimeout(() => {
        setCopyState("idle");
      }, 2000);
    } catch {
      setCopyState("idle");
      toast.error("Failed to copy");
    }
  };

  return (
    <Button
      variant={variant}
      size={text ? size : size === "default" ? "icon" : `icon-${size}`}
      onClick={() => handleCopy(value)}
    >
      {copyState === "idle" && <Copy />}
      {copyState === "loading" && <Loader className="animate-spin" />}
      {copyState === "success" && <Check />}
      {text && copyState === "idle" && "Copy"}
      {text && copyState === "loading" && null}
      {text && copyState === "success" && "Copied!"}
    </Button>
  );
};
export default CopyButton;
