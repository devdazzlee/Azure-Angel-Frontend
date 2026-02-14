"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        // Base: visible rounded square with clear border
        "peer size-5 shrink-0 rounded-md border-2 shadow-sm transition-all duration-200 outline-none cursor-pointer",
        // Unchecked: teal-tinted border so it's ALWAYS visible
        "border-teal-300 bg-white hover:border-teal-500 hover:bg-teal-50 hover:shadow-md",
        // Focus ring
        "focus-visible:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-400/40 focus-visible:ring-offset-1",
        // Checked: vibrant teal fill with glow
        "data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-teal-500 data-[state=checked]:to-cyan-500 data-[state=checked]:border-teal-500 data-[state=checked]:text-white data-[state=checked]:shadow-[0_0_8px_rgba(20,184,166,0.35)]",
        // Indeterminate: slightly lighter teal
        "data-[state=indeterminate]:bg-gradient-to-br data-[state=indeterminate]:from-teal-400 data-[state=indeterminate]:to-cyan-400 data-[state=indeterminate]:border-teal-400 data-[state=indeterminate]:text-white",
        // Disabled
        "disabled:cursor-not-allowed disabled:opacity-40",
        // Invalid
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current animate-in zoom-in-75 duration-150"
      >
        <CheckIcon className="size-3.5 stroke-[3]" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
