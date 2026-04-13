'use client'

import * as React from 'react'

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, onCheckedChange, checked, ...props }, ref) => {
        return (
            <input
                type="checkbox"
                ref={ref}
                checked={checked}
                onChange={(e) => onCheckedChange?.(e.target.checked)}
                className={`h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary ${className}`}
                {...props}
            />
        )
    }
)

Checkbox.displayName = 'Checkbox'

export { Checkbox }