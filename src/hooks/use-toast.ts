"use client";

import { useToastManager } from "@/components/ui/toast";

function useToast() {
  const toastManager = useToastManager();

  return {
    toasts: toastManager.toasts,

    toast: toastManager.add,

    dismiss: toastManager.close,

    update: toastManager.update,
  };
}

export { useToast };
