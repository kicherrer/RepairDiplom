import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Play, Book, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useUser } from '@/hooks/use-user'

interface WatchStatusProps {
  mediaId: string
  className?: string
}

export function WatchStatus({ mediaId, className }: WatchStatusProps) {
  const { t } = useTranslation('common')
  const { user } = useUser()
  const [watchStatus, setWatchStatus] = useState<string | null>(null)

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
        .eq('media_id', mediaId)
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
            media_id: mediaId,
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
          media_id: mediaId,
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
        .eq('media_id', mediaId)
        .maybeSingle()

      if (error) throw error
      setWatchStatus(data?.status || null)
    } catch (error) {
      console.error('Error fetching watch status:', error)
    }
  }, [user, mediaId])

  useEffect(() => {
    fetchWatchStatus()
  }, [fetchWatchStatus])

  return (
    <div className={`p-2 rounded-md bg-background/30 backdrop-blur-sm border border-border/50 ${className}`}>
      <Button
        variant={watchStatus === 'watching' ? 'default' : 'outline'}
        className="w-full justify-start"
        onClick={() => updateWatchStatus('watching')}
      >
        <Play className="h-4 w-4 mr-2" />
        {t('watch.watchStatus.watching')}
      </Button>
      <Button
        variant={watchStatus === 'plan_to_watch' ? 'default' : 'outline'}
        className="w-full justify-start"
        onClick={() => updateWatchStatus('plan_to_watch')}
      >
        <Book className="h-4 w-4 mr-2" />
        {t('watch.watchStatus.plan_to_watch')}
      </Button>
      <Button
        variant={watchStatus === 'completed' ? 'default' : 'outline'}
        className="w-full justify-start"
        onClick={() => updateWatchStatus('completed')}
      >
        <CheckCircle className="h-4 w-4 mr-2" />
        {t('watch.watchStatus.completed')}
      </Button>
    </div>
  )
}