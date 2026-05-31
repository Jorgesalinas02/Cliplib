import useSWR from 'swr'
import { getVideo, Status, Video } from '@/lib/api'

export function usePolling(videoId: string, currentStatus: Status) {
  const shouldPoll = currentStatus === 'pending' || currentStatus === 'processing'

  const { data } = useSWR<Video>(
    shouldPoll ? `video-poll-${videoId}` : null,
    () => getVideo(videoId),
    {
      refreshInterval: shouldPoll ? 5000 : 0,
      revalidateOnFocus: false,
    }
  )

  return data ?? null
}
