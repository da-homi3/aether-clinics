import "react";

declare module "react" {
  interface FormHTMLAttributes<T> {
    action?: string | ((formData: FormData) => unknown) | (() => unknown);
  }
}
