import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold leading-none [&_svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-electric text-white",
        soft: "bg-haze text-electric-deep",
        verified: "bg-white/95 text-verified shadow-sm",
        hot: "bg-[#c2410c] text-white",
        glass: "border border-white/60 bg-white/75 text-night backdrop-blur-md",
        outline: "border border-hairline bg-white text-slate-text",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
