"use client";

import { useEffect, useState } from "react";
import { AIChatWidget } from "@/components/help/AIChatWidget";

export function AdminAIChatTrigger() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleOpen() {
      setOpen(true);
    }
    window.addEventListener("admin:ai-chat", handleOpen);
    return () => window.removeEventListener("admin:ai-chat", handleOpen);
  }, []);

  return <AIChatWidget open={open} onClose={() => setOpen(false)} />;
}
