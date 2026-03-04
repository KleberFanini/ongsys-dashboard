import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils";

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            variant: {
                default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
                secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
                destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
                outline: "text-foreground",
                success: "border-transparent bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-100",
                warning: "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-100",
                info: "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100",
            },
            size: {
                default: "px-2.5 py-0.5 text-xs",
                sm: "px-2 py-0.25 text-xs",
                lg: "px-3 py-1 text-sm",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
    /**
     * O conteúdo do badge
     */
    children?: React.ReactNode;
    /**
     * Se true, remove o hover effect
     */
    noHover?: boolean;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
    ({ className, variant, size, noHover, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    badgeVariants({ variant, size }),
                    noHover && "hover:bg-none pointer-events-none",
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Badge.displayName = "Badge";

export { Badge, badgeVariants };