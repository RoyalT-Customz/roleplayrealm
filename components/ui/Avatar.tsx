import Image from 'next/image'
import { cn } from '@/lib/utils'

interface AvatarProps {
  src?: string | null
  alt?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function Avatar({ src, alt = 'Avatar', size = 'md', className }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }

  return (
    <div
      className={cn(
        'rounded-full bg-dark-700 overflow-hidden flex items-center justify-center',
        sizeClasses[size],
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={64}
          height={64}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-primary-600 text-white font-medium">
          {alt.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  )
}

