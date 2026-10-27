// src/utils/notify.ts
import { toast } from "sonner";

export const notify = {
  success: (msg: string, description?: string) =>
    toast.success(msg, { description }),

  error: (msg: string, description?: string) =>
    toast.error(msg, { description }),

  info: (msg: string, description?: string) =>
    toast.info(msg, { description }),

  warning: (msg: string, description?: string) =>
    toast.warning(msg, { description }),

  promise: <T,>(
    promise: Promise<T>,
    msgs: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: any) => string);
    }
  ) => toast.promise(promise, msgs),
};