// Sonner-backed toast utilities with stable references
import * as React from "react"
import { toast as sonnerToast } from "sonner"

// Hook returns stable function references to avoid infinite effects
export function useToast() {
  const toastFn = React.useCallback((props: {
    title?: string
    description?: string
    variant?: "default" | "destructive"
    duration?: number
  }) => {
    if (props.variant === "destructive") {
      sonnerToast.error(props.title || "", {
        description: props.description,
        duration: props.duration,
      })
    } else {
      sonnerToast(props.title || "", {
        description: props.description,
        duration: props.duration,
      })
    }
  }, [])

  const dismiss = React.useCallback((id?: string | number) => {
    // @ts-ignore - sonner accepts optional id
    sonnerToast.dismiss(id)
  }, [])

  return React.useMemo(() => ({ toast: toastFn, dismiss }), [toastFn, dismiss])
}

// Module-level helper for direct imports
export const toast = (props: {
  title?: string
  description?: string
  variant?: "default" | "destructive"
  duration?: number
}) => {
  if (props.variant === "destructive") {
    sonnerToast.error(props.title || "", {
      description: props.description,
      duration: props.duration,
    })
  } else {
    sonnerToast(props.title || "", {
      description: props.description,
      duration: props.duration,
    })
  }
}
