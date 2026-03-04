// ongsys-dashboard/src/components/StatCard.tsx
import { Card, CardContent } from "./ui/card"
import { LucideIcon } from "lucide-react"
import { cn } from "../lib/utils"

interface StatCardProps {
    title: string
    value: string | number
    subtitle?: string
    icon: LucideIcon
    variant?: "default" | "warning" | "destructive" | "success"
}

export function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    variant = "default"
}: StatCardProps) {
    const variantStyles = {
        default: "text-primary",
        warning: "text-warning",
        destructive: "text-destructive",
        success: "text-success"
    }

    const variantBg = {
        default: "bg-primary/10",
        warning: "bg-warning/10",
        destructive: "bg-destructive/10",
        success: "bg-success/10"
    }

    return (
        <Card className="stat-card">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className={cn("text-2xl font-bold", variantStyles[variant])}>{value}</p>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                        )}
                    </div>
                    <div className={cn("p-3 rounded-full", variantBg[variant])}>
                        <Icon className={cn("h-5 w-5", variantStyles[variant])} />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}