
import { toast as sonnerToast, type ToastT } from "sonner";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
  action?: React.ReactNode;
};

export function useToast() {
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
    
    if (variant === "destructive") {
      sonnerToast.error(title, {
        description,
        ...options,
      });
    } else {
      sonnerToast(title, {
        description,
        ...options,
      });
    }
  };

  return { toast };
}

// Export a singleton version of the toast function for direct use
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
  
  if (variant === "destructive") {
    sonnerToast.error(title, {
      description,
      ...options,
    });
  } else {
    sonnerToast(title, {
      description,
      ...options,
    });
  }
};
