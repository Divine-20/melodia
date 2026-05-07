import { useState } from 'react';
import { Star } from 'lucide-react';

interface Props {
  value: number;
  onChange?: (score: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StarRating({ value, onChange, readonly = false, size = 'md' }: Props) {
  const [hovered, setHovered] = useState(0);
  const sz = size === 'sm' ? 14 : size === 'lg' ? 22 : 18;
  const active = hovered || value;

  if (readonly) {
    return (
      <div className="flex items-center gap-0.5" role="img" aria-label={`Average rating ${value} of 5`}>
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            size={sz}
            className={`transition-colors ${star <= active ? 'fill-amber-400 text-amber-400' : 'text-gray-300 fill-transparent'}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform cursor-pointer hover:scale-110"
        >
          <Star
            size={sz}
            className={`transition-colors ${star <= active ? 'fill-amber-400 text-amber-400' : 'text-gray-300 fill-transparent'}`}
          />
        </button>
      ))}
    </div>
  );
}
