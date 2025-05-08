
import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const CustomAlertDialog = AlertDialogPrimitive.Root

const CustomAlertDialogTrigger = AlertDialogPrimitive.Trigger

const CustomAlertDialogPortal = AlertDialogPrimitive.Portal

const CustomAlertDialogClose = AlertDialogPrimitive.Cancel

const CustomAlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
CustomAlertDialogOverlay.displayName = "CustomAlertDialogOverlay"

const CustomAlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content> & { hideCloseButton?: boolean }
>(({ className, children, hideCloseButton = false, ...props }, ref) => (
  <CustomAlertDialogPortal>
    <CustomAlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      aria-describedby={props['aria-describedby'] || "custom-alert-dialog-description"}
      {...props}
    >
      {children}
      {!hideCloseButton && (
        <CustomAlertDialogClose 
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Close</span>
        </CustomAlertDialogClose>
      )}
    </AlertDialogPrimitive.Content>
  </CustomAlertDialogPortal>
))
CustomAlertDialogContent.displayName = "CustomAlertDialogContent"

const CustomAlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
CustomAlertDialogHeader.displayName = "CustomAlertDialogHeader"

const CustomAlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
CustomAlertDialogFooter.displayName = "CustomAlertDialogFooter"

const CustomAlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
))
CustomAlertDialogTitle.displayName = "CustomAlertDialogTitle"

const CustomAlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    id="custom-alert-dialog-description"
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CustomAlertDialogDescription.displayName = "CustomAlertDialogDescription"

// This component now properly handles asynchronous onClick events
const CustomAlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, onClick, ...props }, ref) => {
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Handle the click event with async support
  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Stop propagation to prevent parent dialogs from being affected
    e.stopPropagation();

    if (onClick) {
      setIsProcessing(true);
      try {
        // Convert the onClick handler result to a Promise to handle both sync and async cases
        await Promise.resolve(onClick(e));
      } catch (error) {
        console.error("Error in dialog action:", error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <AlertDialogPrimitive.Action
      ref={ref}
      className={cn(buttonVariants(), className)}
      onClick={handleClick}
      disabled={isProcessing || props.disabled}
      {...props}
    />
  );
})
CustomAlertDialogAction.displayName = "CustomAlertDialogAction"

const CustomAlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, onClick, ...props }, ref) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Stop propagation to prevent parent dialogs from being affected
    e.stopPropagation();
    
    // If there's an onClick handler in the props, call it
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <AlertDialogPrimitive.Cancel
      ref={ref}
      className={cn(
        buttonVariants({ variant: "outline" }),
        "mt-2 sm:mt-0",
        className
      )}
      onClick={handleClick}
      {...props}
    />
  );
})
CustomAlertDialogCancel.displayName = "CustomAlertDialogCancel"

export {
  CustomAlertDialog,
  CustomAlertDialogPortal,
  CustomAlertDialogOverlay,
  CustomAlertDialogClose,
  CustomAlertDialogTrigger,
  CustomAlertDialogContent,
  CustomAlertDialogHeader,
  CustomAlertDialogFooter,
  CustomAlertDialogTitle,
  CustomAlertDialogDescription,
  CustomAlertDialogAction,
  CustomAlertDialogCancel,
}
