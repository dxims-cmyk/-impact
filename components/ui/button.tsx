import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'ghost' | 'destructive' | 'outline'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
          variant === 'default' && 'bg-impact text-white hover:bg-impact/90 focus:ring-impact',
          variant === 'secondary' && 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-400',
          variant === 'ghost' && 'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-400',
          variant === 'destructive' && 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
          variant === 'outline' && 'border border-gray-300 bg-transparent hover:bg-gray-50 text-gray-700 focus:ring-gray-400',
          size === 'default' && 'px-4 py-2 text-sm',
          size === 'sm' && 'px-3 py-1.5 text-xs',
          size === 'lg' && 'px-6 py-3 text-base',
          size === 'icon' && 'w-9 h-9',
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }
