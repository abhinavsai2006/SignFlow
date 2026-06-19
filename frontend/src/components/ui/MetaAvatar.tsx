

interface MetaAvatarProps {
  name: string;
  imageUrl?: string;
  size?: number;
  className?: string;
}

export default function MetaAvatar({ name, imageUrl, size = 40, className = '' }: MetaAvatarProps) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div 
      className={`rounded-circle bg-surface-soft border border-hairline-soft flex items-center justify-center text-body-sm-bold text-ink-deep overflow-hidden shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}
