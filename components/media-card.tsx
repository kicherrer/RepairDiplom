"use client"

import Image from 'next/image'
import Link from 'next/link'
import { StarRating } from './star-rating'
import { Badge } from './ui/badge'
import { Eye } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Trash2 } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';

interface Genre {
  id: string;
  name: string;
  name_ru: string;
}

interface MediaGenre {
  genres: Genre;
}

interface MediaItem {
  id: string;
  title: string;
  poster_url: string | null;
  type: string;
  year: number;
  media_genres?: MediaGenre[];
  ratings?: Array<{ rating: number }>;
  categories?: {
    id: string;
    name: string;
    name_ru: string;
  };
}

interface Person {
  id: string;
  name: string;
  photo_url?: string | null;
}

export interface MediaCardProps {
  id: string;
  title: string;
  poster_url: string | null;
  type: string;
  year: number;
  media_genres?: any[];
  media_ratings?: Array<{ rating: number }>;
  views?: Array<{ view_count: number }>;
  compact?: boolean;
  status?: string;
}

export function MediaCard({
  id,
  title,
  poster_url,
  type,
  year,
  media_genres,
  media_ratings = [],
  views = [],
}: MediaCardProps) {
  const { t, i18n } = useTranslation('common');
  const [imageError, setImageError] = useState(false);
  const router = useRouter();

  const handleClick = () => {
    router.push(`/watch/${id}`);
  };

  const averageRating = media_ratings?.length > 0
    ? media_ratings.reduce((acc: number, curr: any) => acc + (curr.rating || 0), 0) / media_ratings.length
    : 0;

  const viewCount = views[0]?.view_count || 0;

  const imageUrl = useMemo(() => {
    if (!poster_url) return '/placeholder-image.jpg';
    if (imageError) return '/placeholder-image.jpg';
    
    // Проверяем, является ли URL полным
    if (poster_url.startsWith('http')) {
      return poster_url;
    }
    
    // Добавляем базовый URL Supabase если нужно
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${poster_url}`;
  }, [poster_url, imageError]);

  console.log('Poster URL:', imageUrl); // Для отладки

  return (
    <div 
      className="group relative cursor-pointer" 
      onClick={handleClick}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg">
        <Image
          src={imageUrl}
          alt={t('imageAlt.poster', { title })}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => {
            console.log('Image error occurred'); // Для отладки
            setImageError(true);
          }}
          unoptimized // Отключаем оптимизацию Next.js для тестирования
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
        />
        {media_genres && media_genres.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex flex-wrap gap-1">
              {media_genres.map((mg: any) => (
                <Badge 
                  key={mg.genres.id} 
                  variant="outline"
                  className="text-xs bg-black/50"
                >
                  {i18n.language === 'ru' ? mg.genres.name_ru : mg.genres.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-2">
        <h3 className="font-medium text-sm line-clamp-1">{title}</h3>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1 text-xs">
            <StarRating value={averageRating} readOnly size="sm" />
            <span>({media_ratings.length})</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Eye className="h-3 w-3" />
            <span className="text-xs">{viewCount}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mt-2">
          <Badge variant="secondary" className="text-xs">
            {year}
          </Badge>
          {type && (
            <Badge variant="outline" className="text-xs">
              {t(`media.types.${type}`)}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
