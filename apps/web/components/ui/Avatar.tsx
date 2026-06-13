import { cn, getInitials, getAvatarColor } from '@/lib/utils';

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' };

export function Avatar({ name, imageUrl, size = 'md', className }: AvatarProps) {
  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imageUrl} alt={name} className={cn('rounded-[10px] object-cover flex-shrink-0', sizeMap[size], className)} />;
  }
  return (
    <div
      className={cn('rounded-[10px] flex items-center justify-center text-white font-bold flex-shrink-0', sizeMap[size], getAvatarColor(name), className)}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
}
