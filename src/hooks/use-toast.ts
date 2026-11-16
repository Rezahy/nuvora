"use client";

import { toast, useToastManager } from "@/components/ui/toast";

function useToast() {
  const { toasts } = useToastManager();

  return {
    toasts,
    toast: (props: {
      title?: React.ReactNode;
      description?: React.ReactNode;
      type?: "success" | "info" | "warning" | "error" | "loading";
    }) => toast.add(props),
    dismiss: (toastId?: string) => {
      if (toastId) {
        toast.close(toastId);
      } else {
        toast.close();
      }
    },
  };
}

export { useToast, toast };
