'use client'

import { forwardRef, HTMLAttributes } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  variant?: 'default' | 'glass' | 'glass-premium' | 'elevated' | 'bordered' | 'glow'
  hover?: 'none' | 'lift' | 'glow' | 'shine' | '3d'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  children?: React.ReactNode
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className, 
    variant = 'default',
    hover = 'none',
    padding = 'md',
    children,
    ...props 
  }, ref) => {
    const baseStyles = 'rounded-2xl transition-all duration-300'

    const variants = {
      default: 'bg-midnight-800/50 border border-white/5',
      glass: 'glass',
      'glass-premium': 'glass-premium',
      elevated: 'bg-midnight-800/80 shadow-dreamy',
      bordered: 'bg-transparent border-2 border-aurora-500/30',
      glow: 'bg-midnight-800/50 border border-aurora-500/30 shadow-glow',
    }

    const hovers = {
      none: '',
      lift: 'hover:-translate-y-1 hover:shadow-lg',
      glow: 'hover:shadow-glow-lg hover:border-aurora-400/50',
      shine: 'shine-effect',
      '3d': 'card-3d',
    }

    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-4 lg:p-6',
      lg: 'p-6 lg:p-8',
    }

    return (
      <motion.div
        ref={ref}
        className={cn(
          baseStyles, 
          variants[variant], 
          hovers[hover], 
          paddings[padding], 
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

Card.displayName = 'Card'

/**
 * Header de la carte
 */
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export function CardHeader({ 
  title, 
  subtitle, 
  icon, 
  action, 
  className, 
  children,
  ...props 
}: CardHeaderProps) {
  if (children) {
    return (
      <div className={cn('mb-4', className)} {...props}>
        {children}
      </div>
    )
  }

  return (
    <div className={cn('flex items-start justify-between mb-4', className)} {...props}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex-shrink-0 p-2 rounded-xl bg-aurora-500/10 text-aurora-400">
            {icon}
          </div>
        )}
        <div>
          {title && (
            <h3 className="font-display text-lg font-semibold text-white">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-midnight-300 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

/**
 * Contenu de la carte
 */
export function CardContent({ 
  className, 
  children,
  ...props 
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('text-midnight-200', className)} {...props}>
      {children}
    </div>
  )
}

/**
 * Footer de la carte
 */
export function CardFooter({ 
  className, 
  children,
  ...props 
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn(
        'mt-4 pt-4 border-t border-white/5 flex items-center justify-end gap-2', 
        className
      )} 
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Carte avec image de fond
 */
interface ImageCardProps extends CardProps {
  imageUrl: string
  imageAlt?: string
  overlay?: boolean
}

export function ImageCard({ 
  imageUrl, 
  imageAlt = '', 
  overlay = true,
  children,
  className,
  ...props 
}: ImageCardProps) {
  return (
    <Card
      className={cn('relative overflow-hidden', className)}
      padding="none"
      {...props}
    >
      {/* Image de fond */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${imageUrl})` }}
        aria-label={imageAlt}
      />
      
      {/* Overlay gradient */}
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-midnight-950 via-midnight-950/60 to-transparent" />
      )}
      
      {/* Contenu */}
      <div className="relative z-10 p-4 lg:p-6">
        {children}
      </div>
    </Card>
  )
}

/**
 * Carte statistique
 */
interface StatCardProps extends Omit<CardProps, 'children'> {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: { value: number; isPositive: boolean }
  color?: 'aurora' | 'dream' | 'stardust' | 'rose'
}

export function StatCard({ 
  label, 
  value, 
  icon, 
  trend,
  color = 'aurora',
  className,
  ...props 
}: StatCardProps) {
  const colors = {
    aurora: 'from-aurora-500/20 to-aurora-600/10 text-aurora-400 border-aurora-500/30',
    dream: 'from-dream-500/20 to-dream-600/10 text-dream-400 border-dream-500/30',
    stardust: 'from-stardust-500/20 to-stardust-600/10 text-stardust-400 border-stardust-500/30',
    rose: 'from-rose-500/20 to-rose-600/10 text-rose-400 border-rose-500/30',
  }

  return (
    <Card
      className={cn(
        'bg-gradient-to-br border',
        colors[color],
        className
      )}
      hover="lift"
      {...props}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-midnight-400 mb-1">
            {label}
          </p>
          <p className="text-2xl font-display font-bold text-white">
            {value}
          </p>
          {trend && (
            <p className={cn(
              'text-xs mt-1',
              trend.isPositive ? 'text-dream-400' : 'text-rose-400'
            )}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        {icon && (
          <div className={cn('p-2 rounded-xl bg-white/5', `text-${color}-400`)}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}

export { Card }
export default Card
