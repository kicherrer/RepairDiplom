'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/hooks/use-user';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profile: {
    username: string;
    avatar_url: string | null;
  };
}

interface CommentUser {
  username: string;
  avatar_url: string | null;
}

interface RawCommentResponse {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user: CommentUser;
}

interface CommentSectionProps {
  mediaId: string;
}

export function CommentSection({ mediaId }: CommentSectionProps) {
  const { t } = useTranslation('common');
  const [content, setContent] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const { user } = useUser();

  const fetchComments = useCallback(async () => {
    try {
      // First get comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('id, content, created_at, user_id')
        .eq('media_id', mediaId)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;

      // Then get user profiles for these comments
      if (commentsData && commentsData.length > 0) {
        const userIds = commentsData.map(comment => comment.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds);

        const profileMap = (profilesData || []).reduce((acc: any, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {});

        const transformedComments: Comment[] = commentsData.map(comment => ({
          id: comment.id,
          content: comment.content,
          created_at: comment.created_at,
          user_id: comment.user_id,
          profile: profileMap[comment.user_id] || {
            username: 'Unknown User',
            avatar_url: null
          }
        }));

        setComments(transformedComments);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    }
  }, [mediaId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async () => {
    if (!user) {
      toast.error(t('comments.loginRequired'));
      return;
    }

    if (!content.trim()) {
      toast.error(t('comments.emptyContent'));
      return;
    }

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          content: content.trim(),
          user_id: user.id,
          media_id: mediaId
        });

      if (error) throw error;

      setContent('');
      await fetchComments();
      toast.success(t('comments.success'));
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error(t('comments.error'));
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{t('comments.title')}</h2>
      
      <div className="space-y-4">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t('comments.placeholder')}
          rows={4}
        />
        <Button onClick={handleSubmit}>{t('comments.submit')}</Button>
      </div>

      <div className="space-y-4 mt-6">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-4 p-4 rounded-lg bg-muted/50">
            <Avatar>
              <AvatarImage src={comment.profile?.avatar_url || undefined} />
              <AvatarFallback>
                {comment.profile?.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{comment.profile?.username}</span>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(comment.created_at), 'PP')}
                </span>
              </div>
              <p className="mt-1">{comment.content}</p>
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            {t('comments.noComments')}
          </p>
        )}
      </div>
    </div>
  );
}
