import useSWR from 'swr'
import { getVideos, PaginatedVideos } from '@/lib/api'

export function useVideos(filters: { tags?: string[]; q?: string; category?: string; saved?: boolean }) {
  const key = ['videos', filters.tags?.join(',') ?? '', filters.q ?? '', filters.category ?? '', String(filters.saved ?? '')]

  const { data, error, isLoading, mutate } = useSWR<PaginatedVideos>(
    key,
    () => getVideos({ tags: filters.tags, q: filters.q, category: filters.category, saved: filters.saved, limit: 100 }),
    {
      revalidateOnFocus: true,
      refreshInterval: 8000, // refresca la lista cada 8s mientras la pestaña está abierta
    }
  )

  return {
    videos: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    mutate,
  }
}
