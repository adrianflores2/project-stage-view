import { useState } from "react";
import { toast as sonnerToast, type ToastT } from "sonner";

// Define a unique ID for our toast
let id = 0;

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
  action?: React.ReactNode;
};

// Keep track of toasts for compatibility with the Toaster component
type Toast = ToastProps & {
  id: string;
};

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = ({
    title,
    description,
    variant = "default",
    duration = 3000,
    action,
  }: ToastProps) => {
    const options = {
      duration,
      action,
    };
    
    // Create a unique ID for this toast
    const newId = String(id++);
    
    // Add to our internal toasts array (for compatibility)
    const newToast = { id: newId, title, description, variant, duration, action };
    setToasts((currentToasts) => [...currentToasts, newToast]);
    
    // We'll use the actual sonner toast for display
    if (variant === "destructive") {
      sonnerToast.error(title, {
        description,
        ...options,
        id: newId,
        onDismiss: () => {
          // Remove from our internal toasts array when dismissed
          setToasts((currentToasts) => 
            currentToasts.filter((toast) => toast.id !== newId)
          );
        }
      });
    } else {
      sonnerToast(title, {
        description,
        ...options,
        id: newId,
        onDismiss: () => {
          // Remove from our internal toasts array when dismissed
          setToasts((currentToasts) => 
            currentToasts.filter((toast) => toast.id !== newId)
          );
        }
      });
    }
  };

  return { toast, toasts };
}

// Export a singleton version of the toast function for direct use
let singletonToasts: Toast[] = [];

export const toast = ({
  title,
  description,
  variant = "default",
  duration = 3000,
  action,
}: ToastProps) => {
  const options = {
    duration,
    action,
  };

  // Create a unique ID for this toast
  const newId = String(id++);
  
  // Add to our internal toasts array (for compatibility)
  const newToast = { id: newId, title, description, variant, duration, action };
  singletonToasts = [...singletonToasts, newToast];
  
  if (variant === "destructive") {
    sonnerToast.error(title, {
      description,
      ...options,
      id: newId,
      onDismiss: () => {
        // Remove from our internal toasts array when dismissed
        singletonToasts = singletonToasts.filter((toast) => toast.id !== newId);
      }
    });
  } else {
    sonnerToast(title, {
      description,
      ...options,
      id: newId,
      onDismiss: () => {
        // Remove from our internal toasts array when dismissed
        singletonToasts = singletonToasts.filter((toast) => toast.id !== newId);
      }
    });
  }
};

// Add a getter for toasts to the singleton
toast.getToasts = () => singletonToasts;
