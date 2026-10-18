import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-[background-color,color,box-shadow,transform,border-color] duration-200 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric disabled:pointer-events-none disabled:opacity-60 active:scale-[0.98] motion-reduce:active:scale-100 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-brand bg-electric text-white shadow-glow hover:shadow-[0_14px_34px_-12px_rgb(10_72_152/0.65)]",
        secondary: "border border-hairline bg-white text-night shadow-soft hover:border-[#b8dceb] hover:bg-mist",
        outline: "border border-electric/25 bg-transparent text-electric hover:bg-haze",
        ghost: "text-slate-text hover:bg-mist hover:text-night",
        glass: "border border-white/40 bg-white/15 text-white backdrop-blur-md hover:bg-white/25",
        white: "bg-white text-night shadow-soft hover:bg-mist",
      },
      size: {
        default: "h-11 px-5 text-sm",
        sm: "h-9 rounded-lg px-3.5 text-[13px]",
        lg: "h-13 px-7 text-[15px]",
        icon: "size-11 rounded-full",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
