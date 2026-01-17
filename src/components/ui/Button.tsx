'use client'

import { forwardRef, ButtonHTMLAttributes } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'magic' | 'ghost' | 'outline' | 'danger' | 'success' | 'glass'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  children?: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'magic', 
    size = 'md', 
    isLoading = false,
    leftIcon,
    rightIcon,
    disabled,
    children,
    ...props 
  }, ref) => {
    const baseStyles = cn(
      'relative inline-flex items-center justify-center gap-2',
      'font-semibold rounded-xl transition-all duration-200',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora-500 focus-visible:ring-offset-2 focus-visible:ring-offset-midnight-900',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    )

    const variants = {
      magic: cn(
        'bg-gradient-to-r from-aurora-600 to-aurora-500',
        'text-white shadow-glow',
        'hover:from-aurora-500 hover:to-aurora-400 hover:shadow-glow-lg hover:-translate-y-0.5',
        'active:translate-y-0 active:shadow-glow',
        'btn-sparkle shine-effect'
      ),
      ghost: cn(
        'bg-transparent text-midnight-200',
        'hover:bg-white/10 hover:text-white',
        'active:bg-white/5'
      ),
      outline: cn(
        'bg-transparent border-2 border-aurora-500/50 text-aurora-300',
        'hover:bg-aurora-500/10 hover:border-aurora-400 hover:text-aurora-200',
        'active:bg-aurora-500/5'
      ),
      danger: cn(
        'bg-gradient-to-r from-rose-600 to-rose-500',
        'text-white shadow-lg shadow-rose-500/25',
        'hover:from-rose-500 hover:to-rose-400 hover:-translate-y-0.5',
        'active:translate-y-0'
      ),
      success: cn(
        'bg-gradient-to-r from-dream-600 to-dream-500',
        'text-white shadow-lg shadow-dream-500/25',
        'hover:from-dream-500 hover:to-dream-400 hover:-translate-y-0.5',
        'active:translate-y-0'
      ),
      glass: cn(
        'glass-premium text-white',
        'hover:bg-white/10 hover:-translate-y-0.5',
        'active:translate-y-0'
      ),
    }

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
      icon: 'h-10 w-10 p-0',
    }

    return (
      <motion.button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        {...props}
      >
        {/* Loading spinner */}
        {isLoading && (
          <Loader2 className="w-4 h-4 animate-spin" />
        )}
        
        {/* Left icon */}
        {!isLoading && leftIcon && (
          <span className="flex-shrink-0">{leftIcon}</span>
        )}
        
        {/* Children */}
        {children && (
          <span className={cn(isLoading && 'opacity-0')}>{children}</span>
        )}
        
        {/* Right icon */}
        {!isLoading && rightIcon && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

/**
 * Bouton avec icône seulement
 */
export interface IconButtonProps extends Omit<ButtonProps, 'size' | 'leftIcon' | 'rightIcon'> {
  icon: React.ReactNode
  'aria-label': string
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        size="icon"
        className={cn('p-2', className)}
        {...props}
      >
        {icon}
      </Button>
    )
  }
)

IconButton.displayName = 'IconButton'

/**
 * Groupe de boutons
 */
interface ButtonGroupProps {
  children: React.ReactNode
  className?: string
}

export function ButtonGroup({ children, className }: ButtonGroupProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {children}
    </div>
  )
}

export { Button }
export default Button
