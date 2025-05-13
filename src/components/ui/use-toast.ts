
// This file simply reexports the toast functionality from the hooks directory
import { useToast as useToastHook, toast } from "@/hooks/use-toast";

export const useToast = useToastHook;
export { toast };
