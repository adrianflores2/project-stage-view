
import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster 
      closeButton
      position="bottom-right"
      toastOptions={{
        className: "group",
        duration: 3000,
      }}
    />
  );
}
