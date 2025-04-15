'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { MediaCard } from '@/components/media-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Genre {
  id: string;
  name: string;
  name_ru: string;
}

interface MediaGenre {
  genres: Genre;
}

interface MediaRating {
  rating: number;
}

interface MediaCardProps {
  id: string;
  title: string;
  poster_url: string;
  type: string;
  year: number;
  media_genres: any[];
  ratings?: any[];
  status?: string;
  compact?: boolean;
}

interface WatchlistItem {
  id: string;
  status: string;
  media_id: string;
  media: MediaCardProps;
}

interface WatchlistData {
  status: string;
  media: {
    id: string;
    title: string;
    poster_url: string;
    type: string;
    year: number;
    media_genres?: Array<{
      genres: {
        id: string;
        name: string;
        name_ru: string;
      }
    }>;
    media_ratings?: Array<{
      rating: number;
    }>;
  };
}

export function Watchlist({ userId }: { userId: string }) {
  const { t } = useTranslation('common');
  const [items, setItems] = useState<MediaCardProps[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const { data, error } = await supabase
          .from('user_media_statuses')
          .select(`
            status,
            media:media_items (
              id,
              title,
              poster_url,
              type,
              year,
              media_genres (
                genres (
                  id,
                  name,
                  name_ru
                )
              ),
              media_ratings (
                rating
              )
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const processedItems: MediaCardProps[] = ((data as unknown) as WatchlistData[])?.map(item => ({
          id: item.media.id,
          title: item.media.title,
          poster_url: item.media.poster_url,
          type: item.media.type,
          year: item.media.year,
          media_genres: item.media.media_genres || [],
          ratings: item.media.media_ratings || [],
          status: item.status,
          compact: true
        })) || [];

        setItems(processedItems);
      } catch (error) {
        console.error('Error fetching watchlist:', error);
      }
    };

    if (userId) {
      fetchWatchlist();
    }
  }, [userId]);

  const getFilteredItems = (status: string) => {
    return items.filter(item => item.status === status);
  };

  const getCounts = (status: string) => {
    return items.filter(item => item.status === status).length;
  };

  const statusLabels = {
    watching: t('watch.status.watching'),
    completed: t('watch.status.completed'),
    plan_to_watch: t('watch.status.planToWatch')
  }

  return (
    <Tabs defaultValue="watching" className="space-y-4">
      <TabsList>
        <TabsTrigger value="watching">
          {t('watch.status.watching')} ({getCounts('watching')})
        </TabsTrigger>
        <TabsTrigger value="plan_to_watch">
          {t('watch.status.planToWatch')} ({getCounts('plan_to_watch')})
        </TabsTrigger>
        <TabsTrigger value="completed">
          {t('watch.status.completed')} ({getCounts('completed')})
        </TabsTrigger>
      </TabsList>

      {['watching', 'plan_to_watch', 'completed'].map((status) => (
        <TabsContent key={status} value={status}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {getFilteredItems(status).map((item) => (
              <div 
                key={item.id} 
                onClick={() => router.push(`/watch/${item.id}`)}
                className="cursor-pointer transition-transform hover:scale-105"
              >
                <MediaCard {...item} compact />
              </div>
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
