"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { FileInput } from '@/components/ui/file-input'
import { saveVideoLocally, getVideoUrl } from '@/lib/video'
import { normalizeFileName } from '@/utils/file-helpers'

// ...existing code...

const mediaSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  original_title: z.string().optional(),
  type: z.enum(['movie', 'tv']),
  description: z.string().min(1, 'Description is required'),
  year: z.string().transform(val => parseInt(val)),
  duration: z.string().transform(val => parseInt(val)),
  genres: z.array(z.string()).min(1, 'Select at least one genre'),
  poster: z.any().optional().nullable(),
  video: z.any().optional().nullable(),
  actors: z.array(z.object({
    name: z.string(),
    character: z.string(),
    photo: z.any().optional().nullable()
  })),
  directors: z.array(z.object({
    name: z.string(),
    photo: z.any().optional().nullable()
  }))
})

// Определяем типы для формы
type MediaFormValues = z.infer<typeof mediaSchema>

interface Actor {
  name: string;
  character: string;
  photo: FileList | null;
}

interface Director {
  name: string;
  photo: FileList | null;
}

interface MediaFormProps {
  isEditing?: boolean;
  id?: string;
}

export function MediaForm({ isEditing = false, id }: MediaFormProps) {
  const { t, i18n } = useTranslation('common')  // Add this line
  const [loading, setLoading] = useState(false)
  const [genres, setGenres] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    fetchGenres()
  }, [])

  const fetchGenres = async () => {
    const { data, error } = await supabase
      .from('genres')  // Изменено с media_genres на genres
      .select('id, name, name_ru, name_en')
    
    if (error) {
      console.error('Error fetching genres:', error)
      return
    }
    
    if (data) {
      console.log('Fetched genres:', data)
      setGenres(data)
    }
  }

  const form = useForm<MediaFormValues>({
    resolver: zodResolver(mediaSchema),
    defaultValues: {
      title: '',
      original_title: '',
      type: 'movie' as const, // Явно указываем тип
      description: '',
      year: new Date().getFullYear(),
      duration: 0,
      genres: [], // Убедимся, что массив жанров инициализирован
      actors: [{ name: '', character: '', photo: undefined }],
      directors: [{ name: '', photo: undefined }],
      poster: undefined,
      video: undefined
    }
  })

  const onSubmit = async (data: MediaFormValues) => {
    try {
      setLoading(true);
      let posterUrl = null;

      if (data.poster?.[0]) {
        const file = data.poster[0];
        const fileName = `${Date.now()}-${normalizeFileName(file.name)}`;
        const filePath = `posters/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Получаем публичный URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('media').getPublicUrl(filePath);

        posterUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${filePath}`;
      }

      // Создание записи медиа
      const { data: mediaItem, error: mediaError } = await supabase
        .from('media_items')
        .insert({
          title: data.title,
          original_title: data.original_title || null,
          type: data.type,
          description: data.description,
          year: data.year.toString(), // Преобразуем в строку
          duration: data.duration.toString(), // Преобразуем в строку
          poster_url: posterUrl
        })
        .select()
        .single();

      if (mediaError) {
        console.error('Media item creation error:', mediaError);
        throw mediaError;
      }

      console.log('Media item created:', mediaItem);

      // Обработка актеров и режиссеров
      const processPersons = async (persons: any[], role: 'actor' | 'director') => {
        for (const person of persons) {
          if (!person.name) continue;

          let photoUrl = null;
          if (person.photo?.[0]) {
            const file = person.photo[0];
            const fileName = `${Date.now()}-${person.name.replace(/[^a-zA-Z0-9.-]/g, '')}.${file.name.split('.').pop()}`;
            const filePath = `${role}s/${fileName}`;

            console.log(`Uploading ${role} photo:`, filePath);

            const { error: uploadError } = await supabase.storage
              .from('media')
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true
              });

            if (uploadError) {
              console.error(`${role} photo upload error:`, uploadError);
              throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
              .from('media')
              .getPublicUrl(filePath);

            photoUrl = publicUrl;
          }

          const { data: personData, error: personError } = await supabase
            .from('persons')
            .insert({
              name: person.name,
              photo_url: photoUrl
            })
            .select()
            .single();

          if (personError) throw personError;

          await supabase.from('media_persons').insert({
            media_id: mediaItem.id,
            person_id: personData.id,
            role: role,
            character_name: role === 'actor' ? person.character : null
          });
        }
      };

      await processPersons(data.actors, 'actor');
      await processPersons(data.directors, 'director');

      // Создаем запись для просмотров
      await supabase.from('media_views').insert({
        media_id: mediaItem.id,
        view_count: 0
      });

      toast.success('Media added successfully');
      router.push('/admin');
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Failed to add media');
    } finally {
      setLoading(false);
    }
  }

  // Добавляем состояния для актёров и режиссёров
  const [actors, setActors] = useState<Actor[]>([{ name: '', character: '', photo: null }])
  const [directors, setDirectors] = useState<Director[]>([{ name: '', photo: null }])

  // Добавляем функции для управления актёрами и режиссёрами
  const addActor = () => {
    setActors([...actors, { name: '', character: '', photo: null }])
  }

  const removeActor = (index: number) => {
    setActors(actors.filter((_, i) => i !== index))
  }

  const addDirector = () => {
    setDirectors([...directors, { name: '', photo: null }])
  }

  const removeDirector = (index: number) => {
    setDirectors(directors.filter((_, i) => i !== index))
  }

  const fileInputClass = "relative block w-full text-sm text-foreground"

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Title field */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.media.form.title')}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={t('admin.media.form.titlePlaceholder')} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="original_title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.media.form.originalTitle')}</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  placeholder={t('admin.media.form.originalTitlePlaceholder')} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.media.form.type')}</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('admin.media.form.type')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="movie">{t('admin.media.form.movie')}</SelectItem>
                  <SelectItem value="tv">{t('admin.media.form.tv')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.media.form.description')}</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder={t('admin.media.form.descriptionPlaceholder')} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('admin.media.form.year')}</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    value={field.value || ''} 
                    onChange={e => field.onChange(e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('admin.media.form.duration')}</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field}
                    value={field.value || ''}
                    onChange={e => field.onChange(e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="genres"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.media.form.genres')}</FormLabel>
              <Select
                onValueChange={(value) => {
                  console.log('Genre selected:', value)
                  const currentGenres = field.value || [];
                  if (!currentGenres.includes(value)) {
                    const newGenres = [...currentGenres, value];
                    console.log('Updated genres:', newGenres)
                    field.onChange(newGenres);
                  }
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('admin.media.form.selectGenres')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {genres.map((genre) => (
                    <SelectItem key={genre.id} value={genre.id}>
                      {i18n.language === 'ru' ? genre.name_ru : genre.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-2 mt-2">
                {field.value?.map((genreId) => {
                  const genre = genres.find((g) => g.id === genreId);
                  return (
                    <div
                      key={genreId}
                      className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded"
                    >
                      <span>{i18n.language === 'ru' ? genre?.name_ru : genre?.name_en}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newGenres = field.value.filter((id) => id !== genreId);
                          console.log('Removing genre, new genres:', newGenres)
                          field.onChange(newGenres);
                        }}
                        className="text-sm hover:text-destructive"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="poster"
            render={({ field: { value, onChange, ...field } }) => (
              <FormItem>
                <FormLabel>{t('admin.media.form.poster')}</FormLabel>
                <FormControl>
                  <div className="relative group cursor-pointer">
                    <div className="flex items-center gap-2 p-2 rounded-lg border border-input bg-background">
                      <button
                        type="button"
                        className="px-4 py-2 rounded-full text-sm font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        onClick={() => document.getElementById('poster-input')?.click()}
                      >
                        {t('admin.media.form.fileInputLabels.browse')}
                      </button>
                      <span className="text-sm text-muted-foreground">
                        {value?.[0]?.name || t('admin.media.form.fileInputLabels.chooseFile')}
                      </span>
                    </div>
                    <input
                      id="poster-input"
                      type="file"
                      accept="image/*"
                      onChange={(e) => onChange(e.target.files)}
                      className="sr-only"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="video"
            render={({ field: { value, onChange, ...field } }) => (
              <FormItem>
                <FormLabel>{t('admin.media.form.video')}</FormLabel>
                <FormControl>
                  <div className="relative group cursor-pointer">
                    <div className="flex items-center gap-2 p-2 rounded-lg border border-input bg-background">
                      <button
                        type="button"
                        className="px-4 py-2 rounded-full text-sm font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        onClick={() => document.getElementById('video-input')?.click()}
                      >
                        {t('admin.media.form.fileInputLabels.browse')}
                      </button>
                      <span className="text-sm text-muted-foreground">
                        {value?.[0]?.name || t('admin.media.form.fileInputLabels.chooseFile')}
                      </span>
                    </div>
                    <input
                      id="video-input"
                      type="file"
                      accept="video/*"
                      onChange={(e) => onChange(e.target.files)}
                      className="sr-only"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Добавляем секции для актёров и режиссёров */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{t('admin.media.form.actors')}</h3>
          {actors.map((_, index) => (
            <div key={index} className="grid grid-cols-2 gap-4 border p-4 rounded">
              <FormField
                control={form.control}
                name={`actors.${index}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.media.form.actorName')}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder={t('admin.media.form.actorNamePlaceholder')} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name={`actors.${index}.character`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.media.form.character')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('admin.media.form.characterPlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name={`actors.${index}.photo`}
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>{t('admin.media.form.photo')}</FormLabel>
                    <FormControl>
                      <div className="relative group cursor-pointer">
                        <div className="flex items-center gap-2 p-2 rounded-lg border border-input bg-background">
                          <button
                            type="button"
                            className="px-4 py-2 rounded-full text-sm font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            onClick={() => document.getElementById(`actor-photo-${index}`)?.click()}
                          >
                            {t('admin.media.form.fileInputLabels.browse')}
                          </button>
                          <span className="text-sm text-muted-foreground">
                            {value?.[0]?.name || t('admin.media.form.fileInputLabels.noFileChosen')}
                          </span>
                        </div>
                        <input
                          id={`actor-photo-${index}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => onChange(e.target.files)}
                          className="sr-only"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button
                type="button"
                variant="destructive"
                onClick={() => removeActor(index)}
                className="col-span-2"
              >
                {t('admin.media.form.removeActor')}
              </Button>
            </div>
          ))}
          
          <Button type="button" variant="outline" onClick={addActor}>
            {t('admin.media.form.addActor')}
          </Button>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">{t('admin.media.form.directors')}</h3>
          {directors.map((_, index) => (
            <div key={index} className="grid grid-cols-2 gap-4 border p-4 rounded">
              <FormField
                control={form.control}
                name={`directors.${index}.name`}
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>{t('admin.media.form.name')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('admin.media.form.namePlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name={`directors.${index}.photo`}
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>{t('admin.media.form.photo')}</FormLabel>
                    <FormControl>
                      <div className="relative group cursor-pointer">
                        <div className="flex items-center gap-2 p-2 rounded-lg border border-input bg-background">
                          <button
                            type="button"
                            className="px-4 py-2 rounded-full text-sm font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            onClick={() => document.getElementById(`director-photo-${index}`)?.click()}
                          >
                            {t('admin.media.form.fileInputLabels.browse')}
                          </button>
                          <span className="text-sm text-muted-foreground">
                            {value?.[0]?.name || t('admin.media.form.fileInputLabels.noFileChosen')}
                          </span>
                        </div>
                        <input
                          id={`director-photo-${index}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => onChange(e.target.files)}
                          className="sr-only"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button
                type="button"
                variant="destructive"
                onClick={() => removeDirector(index)}
                className="col-span-2"
              >
                {t('admin.media.form.removeDirector')}
              </Button>
            </div>
          ))}
          
          <Button type="button" variant="outline" onClick={addDirector}>
            {t('admin.media.form.addDirector')}
          </Button>
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? t('admin.media.form.submitting') : t('admin.media.form.submit')}
        </Button>
      </form>
    </Form>
  )
}
