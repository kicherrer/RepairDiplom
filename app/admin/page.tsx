"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { User, MediaItem } from '@/types/admin'
import { Plus, Trash2 } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loading } from '@/components/ui/loading';

export default function AdminPage() {
  const { t } = useTranslation('common')
  const router = useRouter() as AppRouterInstance
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const supabase = createClientComponentClient();

  const fetchData = async () => {
    try {
      const [usersResponse, mediaResponse] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('media_items').select('*').order('created_at', { ascending: false })
      ])

      if (usersResponse.data) {
        setUsers(usersResponse.data as User[])
      }
      if (mediaResponse.data) {
        setMediaItems(mediaResponse.data as MediaItem[])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to fetch data')
    }
  }

  const checkAdminAccess = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (!data?.is_admin) {
        router.push('/')
        return
      }

      setIsAdmin(true)
      await fetchData()
    } catch (error) {
      console.error('Error checking admin access:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }, [router, fetchData]);

  useEffect(() => {
    checkAdminAccess()
  }, [checkAdminAccess])

  const toggleUserAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: isAdmin })
        .eq('id', userId)

      if (error) throw error
      toast.success('User updated successfully')
      fetchData()
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Failed to update user')
    }
  }

  const handleEdit = (itemId: string) => {
    console.log('Editing item:', itemId); // Добавьте для отладки
    router.push(`/admin/edit-media/${itemId}`);
  };

  const handleDelete = useCallback(async (id: string) => {
    try {
      setMediaItems(current => current.filter(item => item.id !== id));

      const { error } = await supabase
        .from('media_items')
        .delete()
        .match({ id });

      if (error) {
        await fetchData();
        throw error;
      }

      toast.success(t('admin.delete.success'));
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(t('admin.delete.error'));
    }
  }, [fetchData, t]);

  if (loading) {
    return <Loading />;
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('admin.title')}</h1>
        <Button 
          onClick={() => router.push('/admin/add-media')} 
          className="gap-2"
          size="lg"
        >
          <Plus className="h-5 w-5" />
          {t('admin.media.add')}
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.users.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user: User) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded">
                  <div>
                    <p className="font-medium">{user.username}</p>
                    <p className="text-sm text-muted-foreground">ID: {user.id}</p>
                  </div>
                  <Button
                    variant={user.is_admin ? "destructive" : "default"}
                    onClick={() => toggleUserAdmin(user.id, !user.is_admin)}
                  >
                    {user.is_admin ? t('admin.users.removeAdmin') : t('admin.users.makeAdmin')}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              {t('admin.media.title')}
              <Button 
                onClick={() => router.push('/admin/add-media')} 
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                {t('admin.media.add')}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mediaItems.map((item: MediaItem) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.type}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => handleEdit(item.id)}
                    >
                      {t('admin.media.edit')}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('admin.delete.title')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('admin.delete.description', { title: item.title })}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('admin.delete.cancel')}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(item.id)}>
                            {t('admin.delete.confirm')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.stats.totalUsers')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{users.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.stats.totalMedia')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{mediaItems.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.stats.adminUsers')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {users.filter((user: User) => user.is_admin).length}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}