import * as React from "react";
import { cn } from "@/lib/utils";

/** `glass` is the frosted surface used over gradients and photos. */
function Card({ className, glass, ...props }: React.ComponentProps<"div"> & { glass?: boolean }) {
  return (
    <div
      data-slot="card"
      className={cn(
        "rounded-3xl border",
        glass
          ? "border-white/70 bg-white/75 shadow-float backdrop-blur-xl"
          : "border-hairline bg-white shadow-soft",
        className
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("p-6", className)} {...props} />;
}

export { Card, CardContent };
