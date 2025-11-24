import { createSupabaseClient } from './client'
import { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Subscribe to realtime notifications for a user
 */
export function subscribeToNotifications(
  userId: string,
  callback: (payload: any) => void
): RealtimeChannel {
  const supabase = createSupabaseClient()
  
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `userId=eq.${userId}`,
      },
      callback
    )
    .subscribe()

  return channel
}

/**
 * Subscribe to realtime post updates (likes, comments)
 */
export function subscribeToPostUpdates(
  postId: string,
  callback: (payload: any) => void
): RealtimeChannel {
  const supabase = createSupabaseClient()
  
  const channel = supabase
    .channel(`post:${postId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'likes',
        filter: `postId=eq.${postId}`,
      },
      callback
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
        filter: `postId=eq.${postId}`,
      },
      callback
    )
    .subscribe()

  return channel
}

