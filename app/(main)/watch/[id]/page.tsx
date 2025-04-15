"use client"

interface MediaGenre {
  genres: {
    id: string;
    name: string;
    name_ru: string;
  };
}

interface Genre {
  id: string;
  name: string;
}

interface Profile {
  id: string;
  username: string;
  avatar_url: string;
}

interface DatabaseComment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  media_id: string;
  profiles: Profile[];
}

interface ProcessedComment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profile: Profile;
}

interface MediaItem {
  title: string;
  poster_url: string;
  original_title?: string;
  description: string;
  type: string;
  duration: number;
  year: number;
  media_genres: Array<{
    genres: {
      id: string;
      name: string;
      name_ru: string;
    };
  }>;
}

interface CommentUser {
  username: string;
  avatar_url: string | null;
}

interface CommentResponse {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user: CommentUser;
}

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { StarRating } from '@/components/star-rating'
import { CommentSection } from '@/components/comment-section'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Clock, Calendar, Users, Book, CheckCircle, Play, Bookmark } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useUser } from '@/hooks/use-user'
import { toast } from 'sonner'

export default function WatchPage() {
  const { t, i18n } = useTranslation('common')
  const params = useParams()
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id
  const [media, setMedia] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useUser()
  const [userRating, setUserRating] = useState<number | null>(null)
  const [watchStatus, setWatchStatus] = useState<string | null>(null)

  const fetchMediaData = useCallback(async () => {
    try {
      // First fetch media data without comments
      const { data: mediaData, error: mediaError } = await supabase
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
          media_ratings (
            id,
            rating,
            user_id
          ),
          media_persons (
            id,
            role,
            character_name,
            persons (
              id,
              name,
              photo_url
            )
          )
        `)
        .eq('id', id)
        .single();

      if (mediaError) {
        console.error('Media fetch error:', mediaError);
        throw mediaError;
      }

      // Set media data first
      setMedia({
        ...mediaData,
        comments: [],
        ratings: mediaData?.media_ratings || [],
        media_persons: mediaData?.media_persons || [],
        media_genres: mediaData?.media_genres || []
      });

    } catch (error) {
      console.error('Error in fetchMediaData:', error);
      setMedia(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleRate = async (rating: number) => {
    try {
      if (!user) {
        toast.error(t('watch.login.required'))
        return
      }

      const { data: existingRating } = await supabase
        .from('media_ratings')
        .select('rating')
        .eq('media_id', id)
        .eq('user_id', user.id)
        .single()

      if (existingRating) {
        toast.error(t('watch.error.alreadyRated'))
        return
      }

      const { error: ratingError } = await supabase
        .from('media_ratings')
        .insert({
          media_id: id,
          user_id: user.id,
          rating,
          created_at: new Date().toISOString()
        })

      if (ratingError) throw ratingError
      
      setUserRating(rating)
      await fetchMediaData()
      toast.success(t('watch.success.rating'))
    } catch (error) {
      console.error('Error rating:', error)
      toast.error(t('watch.error.rating'))
    }
  }

  // Получение рейтинга пользователя при загрузке
  useEffect(() => {
    const fetchUserRating = async () => {
      if (!user) return
      
      try {
        const { data, error } = await supabase
          .from('media_ratings')
          .select('rating')
          .eq('media_id', id)
          .eq('user_id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') throw error
        setUserRating(data?.rating || null)
      } catch (error) {
        console.error('Error fetching user rating:', error)
      }
    }

    fetchUserRating()
  }, [id, user])

  // Добавляем функцию для отслеживания просмотра
  const logWatchActivity = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_activities')
        .insert({
          user_id: user.id,
          media_id: id,
          activity_type: 'watch'
        })

      if (error) throw error
    } catch (error) {
      console.error('Error logging watch activity:', error)
    }
  }, [user, id]) // Добавляем зависимости

  const updateWatchStatus = async (newStatus: string) => {
    if (!user) {
      toast.error(t('watch.login.required'))
      return
    }

    try {
      // Сначала проверим существующий статус
      const { data: existingStatus } = await supabase
        .from('user_media_statuses')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('media_id', id)
        .single()

      if (existingStatus) {
        // Если существующий статус такой же, ничего не делаем
        if (existingStatus.status === newStatus) {
          return
        }

        // Обновляем существующий статус
        const { error: updateError } = await supabase
          .from('user_media_statuses')
          .update({
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingStatus.id)

        if (updateError) throw updateError
      } else {
        // Создаем новый статус
        const { error: insertError } = await supabase
          .from('user_media_statuses')
          .insert({
            user_id: user.id,
            media_id: id,
            status: newStatus
          })

        if (insertError) throw insertError
      }

      setWatchStatus(newStatus)
      toast.success(t('watch.status.updated'))

      // Добавляем запись об активности
      await supabase
        .from('user_activities')
        .insert({
          user_id: user.id,
          media_id: id,
          activity_type: 'status_update',
          status: newStatus
        })

    } catch (error: any) {
      console.error('Error updating watch status:', error)
      toast.error(t('watch.error.status'))
    }
  }

  // Получаем текущий статус при загрузке
  const fetchWatchStatus = useCallback(async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('user_media_statuses')
        .select('status')
        .eq('user_id', user.id)
        .eq('media_id', id)
        .maybeSingle()

      if (error) throw error
      setWatchStatus(data?.status || null)
    } catch (error) {
      console.error('Error fetching watch status:', error)
    }
  }, [user, id])

  useEffect(() => {
    fetchWatchStatus()
  }, [fetchWatchStatus])

  useEffect(() => {
    fetchMediaData();
  }, [id, fetchMediaData]);

  if (loading) {
    return <div>Loading...</div>
  }

  if (!media) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Media not found</h2>
          <p className="text-muted-foreground">The requested media content could not be found.</p>
        </div>
      </div>
    );
  }

  // Преобразуем комментарии в нужный формат
  const comments = media.comments?.map((comment: any) => ({
    ...comment,
    profile: comment.user // переименовываем поле user в profile для совместимости
  })) || []

  // Обработка жанров
  const processedGenres = media.media_genres?.map((mg: MediaGenre) => ({
    id: mg.genres.id,
    name: i18n.language === 'ru' ? mg.genres.name_ru : mg.genres.name
  })) || []

  const actors = media.media_persons?.filter((mp: any) => mp?.role === 'actor') || []
  const directors = media.media_persons?.filter((mp: any) => mp?.role === 'director') || []
  const genres = media.media_genres || []
  const ratings = media.ratings || []

  const averageRating = ratings.length > 0
    ? ratings.reduce((acc: number, curr: any) => acc + (curr.rating || 0), 0) / ratings.length
    : 0

  return (
    <div className="min-h-screen">
      {/* Animated gradient background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 animate-gradient bg-gradient-to-br from-orange-500 via-purple-500 to-blue-500 opacity-20" />
      </div>

      {/* Content */}
      <div className="relative">
        {/* Hero Section with Video Background */}
        <div className="relative h-[75vh] w-full">
          {/* Video/Image Background */}
          <div className="absolute inset-0">
            {media.video_url ? (
              <div className="w-full h-full relative">
                <video
                  src={media.video_url}
                  className="w-full h-full object-cover"
                  controls
                  autoPlay
                  muted
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
              </div>
            ) : (
              <>
                <Image
                  src={media.poster_url || '/placeholder-image.jpg'}
                  alt={media.title}
                  fill
                  priority
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40" />
              </>
            )}
          </div>

          {/* Content */}
          <div className="relative container h-full pt-24">
            <div className="flex h-full items-end pb-20">
              <div className="flex gap-8 items-end max-w-6xl">
                {/* Poster */}
                <div className="hidden md:block w-72 flex-shrink-0">
                  <div className="aspect-[2/3] relative rounded-lg overflow-hidden shadow-2xl">
                    <Image
                      src={media.poster_url || '/placeholder-image.jpg'}
                      alt={media.title}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 text-white space-y-6">
                  <div>
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-3">
                      {media.title}
                    </h1>
                    {media.original_title && (
                      <h2 className="text-2xl text-white/70">{media.original_title}</h2>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-lg">
                    <div className="flex items-center gap-2">
                      <StarRating value={averageRating} readOnly size="lg" />
                      <span className="font-semibold">{averageRating.toFixed(1)}</span>
                      <span className="text-white/60">({ratings.length})</span>
                    </div>
                    <div className="text-white/80">{media.year}</div>
                    <div className="text-white/80">{media.duration} {t('media.minutes')}</div>
                    <div className="text-white/80">{t(`media.types.${media.type}`)}</div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {media.media_genres?.map((mg: MediaGenre) => (
                      <Badge 
                        key={mg.genres.id} 
                        variant="outline"
                        className="px-3 py-1 text-sm bg-white/10 hover:bg-white/20"
                      >
                        {i18n.language === 'ru' ? mg.genres.name_ru : mg.genres.name}
                      </Badge>
                    ))}
                  </div>

                  <div className="max-w-2xl text-lg/relaxed text-white/80">
                    {media.description}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      size="lg"
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                      onClick={logWatchActivity}
                    >
                      <Play className="h-5 w-5 mr-2" />
                      {t('watch.watchNow')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-background">
          <div className="container py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-12">
                {/* About */}
                <section>
                  <h2 className="text-2xl font-semibold mb-6">{t('watch.about')}</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div>
                      <h3 className="text-sm text-muted-foreground mb-2">{t('watch.year')}</h3>
                      <p className="text-lg">{media.year}</p>
                    </div>
                    <div>
                      <h3 className="text-sm text-muted-foreground mb-2">{t('watch.duration')}</h3>
                      <p className="text-lg">{media.duration} {t('media.minutes')}</p>
                    </div>
                    <div>
                      <h3 className="text-sm text-muted-foreground mb-2">{t('watch.rating')}</h3>
                      <p className="text-lg">{averageRating.toFixed(1)} / 5.0</p>
                    </div>
                  </div>
                </section>

                {/* Cast & Crew */}
                {(actors.length > 0 || directors.length > 0) && (
                  <section>
                    <h2 className="text-2xl font-semibold mb-6">{t('watch.castAndCrew')}</h2>
                    
                    {directors.length > 0 && (
                      <div className="mb-8">
                        <h3 className="text-lg font-medium mb-4">{t('watch.directors')}</h3>
                        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                          {directors.map((director: any) => (
                            <div key={director.persons?.id} className="flex-shrink-0 w-32 text-center">
                              <Avatar className="w-24 h-24 mx-auto mb-2">
                                <AvatarImage src={director.persons?.photo_url} />
                                <AvatarFallback>{director.persons?.name?.[0]}</AvatarFallback>
                              </Avatar>
                              <div className="text-sm font-medium">{director.persons?.name}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {actors.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium mb-4">{t('watch.cast')}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {actors.map((actor: any) => (
                            <div key={actor.persons?.id} className="flex-shrink-0 w-32 text-center">
                              <Avatar className="w-24 h-24 mx-auto mb-2">
                                <AvatarImage src={actor.persons?.photo_url} />
                                <AvatarFallback>{actor.persons?.name?.[0]}</AvatarFallback>
                              </Avatar>
                              <div className="text-sm font-medium">{actor.persons?.name}</div>
                              <div className="text-xs text-muted-foreground">{actor.character_name}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {/* Comments */}
                <section>
                  <CommentSection mediaId={id || ''} />
                </section>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <Card className="bg-card/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle>{t('watch.yourRating')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center gap-4">
                      <StarRating
                        value={userRating || 0}
                        onChange={handleRate}
                        size="lg"
                      />
                      {userRating ? (
                        <div className="text-center">
                          <div className="text-2xl font-bold">{userRating.toFixed(1)}</div>
                          <div className="text-sm text-muted-foreground">{t('watch.yourScore')}</div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground text-center">
                          {t('watch.rateThis')}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Watch Status Card */}
                <Card className="bg-card/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle>{t('watch.watchStatus.title')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {['watching', 'plan_to_watch', 'completed'].map((status) => (
                      <Button
                        key={status}
                        variant={watchStatus === status ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => updateWatchStatus(status)}
                      >
                        {status === 'watching' && <Play className="h-4 w-4 mr-2" />}
                        {status === 'plan_to_watch' && <Book className="h-4 w-4 mr-2" />}
                        {status === 'completed' && <CheckCircle className="h-4 w-4 mr-2" />}
                        {t(`watch.watchStatus.${status}`)}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
