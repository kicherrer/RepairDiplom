'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { MediaCard } from '@/components/media-card';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { StarRating } from '@/components/star-rating';
import { useRouter } from 'next/navigation';
import { RefreshCcw } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { Button } from '@/components/ui/button';

interface Genre {
  id: string;
  name: string;
  name_ru: string;
}

interface Person {
  id: string;
  name: string;
  photo_url: string | null;
}

interface MediaItem {
  id: string;
  title: string;
  year: number;
  type: string;
  poster_url: string | null;
  media_genres?: Array<{ genres: Genre }>;
  persons?: Array<{ 
    person: Person;
    role: 'actor' | 'director';
    character_name?: string;
  }>;
  media_ratings?: Array<{ rating: number; user_id: string }>;
  views?: Array<{ view_count: number }>;
}

interface MediaGenreWithGenre {
  genres: {
    id: string;
    name: string;
    name_ru: string;
  };
}

interface MediaItemWithGenres extends Omit<MediaItem, 'media_genres'> {
  media_genres: MediaGenreWithGenre[];
}

interface WatchedMediaItem {
  media_id: string;
  media: {
    media_genres: Array<{
      genres: {
        id: string;
      };
    }>;
  };
}

export default function OverviewPage() {
  const { t, i18n } = useTranslation('common');
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [minRating, setMinRating] = useState(0);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [featuredMedia, setFeaturedMedia] = useState<MediaItem[]>([]);
  const [recommendedMedia, setRecommendedMedia] = useState<MediaItem[]>([]);
  const [userGenres, setUserGenres] = useState<string[]>([]);
  const router = useRouter();
  const { user } = useUser();

  // Set year range
  const currentYear = new Date().getFullYear();
  const minYear = 1900;
  const maxYear = currentYear;

  const fetchMedia = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('media_items')
        .select(`
          *,
          media_genres (
            genres (
              id,
              name,
              name_ru
            )
          ),
          media_ratings!media_id (
            rating
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const processedData = data?.map(item => ({
        ...item,
        ratings: item.media_ratings || []
      }));
      setMediaItems(processedData || []);
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  useEffect(() => {
    const fetchGenres = async () => {
      const { data, error } = await supabase
        .from('genres')
        .select('*');

      if (error) throw error;

      setGenres(data || []);
    };

    fetchGenres().catch(setError);
  }, []);

  // Fetch user's most watched genres
  const fetchUserGenres = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { data: watchedMedia } = await supabase
        .from('user_media_statuses')
        .select(`
          media_id,
          media:media_items(
            media_genres(
              genres(id)
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'completed');

      // Count genres
      const genreCounts: { [key: string]: number } = {};
      (watchedMedia as unknown as WatchedMediaItem[])?.forEach(item => {
        item.media?.media_genres?.forEach(mg => {
          const genreId = mg.genres?.id;
          if (genreId) {
            genreCounts[genreId] = (genreCounts[genreId] || 0) + 1;
          }
        });
      });

      // Get top genres
      const topGenres = Object.entries(genreCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([genreId]) => genreId);

      setUserGenres(topGenres);
    } catch (error) {
      console.error('Error fetching user genres:', error);
    }
  }, [user?.id]); // Add user.id to dependencies

  // Fetch featured media (most viewed and highly rated)
  const fetchFeaturedMedia = useCallback(async () => {
    try {
      // Получаем статистику просмотров
      const { data: viewStats, error: viewsError } = await supabase
        .from('user_media_statuses')
        .select('media_id, status')
        .eq('status', 'completed');

      if (viewsError) throw viewsError;

      // Подсчитываем количество просмотров для каждого медиа
      const viewCounts = viewStats.reduce((acc: {[key: string]: number}, curr) => {
        acc[curr.media_id] = (acc[curr.media_id] || 0) + 1;
        return acc;
      }, {});

      // Получаем медиа с рейтингами
      const { data: mediaData, error: mediaError } = await supabase
        .from('media_items')
        .select(`
          *,
          media_genres!inner (
            genres (
              id,
              name,
              name_ru
            )
          ),
          media_ratings (
            rating
          )
        `)
        .limit(6);

      if (mediaError) throw mediaError;

      if (mediaData) {
        const processedData = mediaData
          .map(item => ({
            ...item,
            viewCount: viewCounts[item.id] || 0,
            avgRating: item.media_ratings?.length
              ? item.media_ratings.reduce((acc: number, curr: any) => acc + (curr.rating || 0), 0) / item.media_ratings.length
              : 0
          }))
          .sort((a, b) => {
            // Сортировка по просмотрам и рейтингу
            if (b.viewCount !== a.viewCount) return b.viewCount - a.viewCount;
            return b.avgRating - a.avgRating;
          });

        setFeaturedMedia(processedData);
      }
    } catch (error) {
      console.error('Error fetching featured media:', error);
    }
  }, []);

  // Fetch recommended media based on user's genres
  const fetchRecommendedMedia = useCallback(async () => {
    if (userGenres.length === 0) return;

    try {
      const { data } = await supabase
        .from('media_items')
        .select(`
          *,
          media_genres!inner(genres(*))
        `)
        .in('media_genres.genre_id', userGenres)
        .limit(4);

      if (data) {
        setRecommendedMedia(data);
      }
    } catch (error) {
      console.error('Error fetching recommended media:', error);
    }
  }, [userGenres]);

  useEffect(() => {
    fetchUserGenres();
    fetchFeaturedMedia();
  }, [fetchUserGenres, fetchFeaturedMedia]);

  useEffect(() => {
    fetchRecommendedMedia();
  }, [fetchRecommendedMedia, userGenres]);

  const filteredItems = mediaItems.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
    const matchesGenre = selectedGenre === 'all' || 
      item.media_genres?.some(g => g.genres.id === selectedGenre);
    const averageRating = item.media_ratings?.length 
      ? item.media_ratings.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0) / item.media_ratings.length 
      : 0;
    const matchesRating = averageRating >= minRating;
    return matchesSearch && matchesGenre && matchesRating;
  }) as MediaItemWithGenres[];

  const handleItemClick = (itemId: string) => {
    router.push(`/watch/${itemId}`);
  };

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  function HeroSection() {
    return (
      <div className="relative h-[80vh] w-full overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="https://your-video-url.mp4" type="video/mp4" />
          </video>
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />
        </div>
  
        {/* Content */}
        <div className="relative container h-full flex items-center">
          <div className="max-w-2xl space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
              {t('hero.title')}
            </h1>
            <p className="text-lg md:text-xl text-white/80">
              {t('hero.description')}
            </p>
            <div className="flex gap-4">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white">
                {t('hero.primaryButton')}
              </Button>
              <Button size="lg" variant="outline" className="bg-background/20 backdrop-blur-sm">
                {t('hero.secondaryButton')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getBunnyVideoUrl = (videoId: string) => {
    const libraryId = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID;
    return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`;
  };

  return (
    <div>
      {/* Hero Section */}
      <div className="relative h-[70vh] overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 animate-gradient bg-gradient-to-br from-orange-500 via-purple-500 to-blue-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative container h-full">
          <div className="flex h-full items-center">
            <div className="max-w-3xl space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold text-white">
                {t('overview.hero.title')}
              </h1>
              <p className="text-lg md:text-xl text-white/80">
                {t('overview.hero.description')}
              </p>
              
              {/* Search Bar integrated into hero */}
              <div className="flex gap-4 max-w-2xl">
                <div className="flex-1 flex gap-4 bg-white/10 backdrop-blur-lg p-2 rounded-lg">
                  <Input
                    placeholder={t('overview.searchPlaceholder')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-transparent border-none text-white placeholder:text-white/60"
                  />
                  <Select
                    value={selectedGenre}
                    onValueChange={setSelectedGenre}
                  >
                    <SelectTrigger className="w-[180px] bg-transparent border-none text-white">
                      <SelectValue placeholder={t('overview.selectGenre')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('overview.allGenres')}</SelectItem>
                      {genres.map((genre) => (
                        <SelectItem key={genre.id} value={genre.id}>
                          {i18n.language === 'ru' ? genre.name_ru : genre.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-screen bg-background">
        <div className="container py-6 space-y-8"> {/* Изменили py-12 на py-6 и space-y-12 на space-y-8 */}
          {/* Featured Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">{t('overview.featured')}</h2>
              <Select
                value={selectedGenre}
                onValueChange={setSelectedGenre}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={t('overview.filter')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('overview.allTypes')}</SelectItem>
                  <SelectItem value="movie">{t('media.types.movie')}</SelectItem>
                  <SelectItem value="tv">{t('media.types.tv')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {filteredItems.map((item: MediaItem) => (
                <div
                  key={item.id}
                  className="group relative cursor-pointer"
                  onClick={() => handleItemClick(item.id)}
                >
                  <div className="aspect-[2/3] rounded-lg overflow-hidden">
                    <Image
                      src={item.poster_url || '/placeholder-image.jpg'}
                      alt={item.title}
                      fill
                      className="object-cover transform transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 p-4 space-y-2">
                        <h3 className="text-white font-medium line-clamp-2">{item.title}</h3>
                        <div className="flex items-center gap-2">
                          <StarRating 
                            value={item.media_ratings?.length 
                              ? item.media_ratings.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0) / item.media_ratings.length 
                              : 0
                            } 
                            readOnly 
                            size="sm" 
                          />
                          <span className="text-xs text-white/80">
                            ({item.media_ratings?.length || 0})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <span>{item.year}</span>
                          <span>•</span>
                          <span>{t(`media.types.${item.type}`)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Continue Watching */}
          <section className="pt-4"> {/* Изменили pt-8 на pt-4 */}
            <h2 className="text-2xl font-semibold mb-6">{t('overview.continueWatching')}</h2>
            {/* Add your continue watching content */}
          </section>

          {/* Recommendations */}
          <section className="pt-4"> {/* Изменили pt-8 на pt-4 */}
            <h2 className="text-2xl font-semibold mb-6">{t('overview.recommended')}</h2>
            {/* Add your recommendations content */}
          </section>
        </div>
      </div>
    </div>
  );
}