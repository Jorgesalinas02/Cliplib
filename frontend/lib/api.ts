const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export type Platform = 'tiktok' | 'instagram'
export type Status = 'pending' | 'processing' | 'done' | 'failed'

export const CATEGORIES = [
  'Deportes',
  'Marketing',
  'Tecnología',
  'Crecimiento personal',
  'Negocios',
  'Formato Rápido',
] as const

export type Category = typeof CATEGORIES[number]

export interface Video {
  id: string
  url: string
  platform: Platform
  title: string | null
  tags: string[]
  transcript: string | null
  status: Status
  language: string | null
  duration_seconds: number | null
  error_message: string | null
  category: string | null
  saved: boolean
  scripted: boolean
  view_count: number | null
  like_count: number | null
  description: string | null
  created_at: string
  transcribed_at: string | null
}

export interface PaginatedVideos {
  items: Video[]
  total: number
  page: number
  pages: number
}

export interface TagCount {
  tag: string
  count: number
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    let message = `Error ${res.status}`
    try {
      const data = await res.json()
      message = data.detail || data.message || message
    } catch {
      // ignore
    }
    throw new Error(message)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export function createVideo(url: string, title?: string, tags?: string[]): Promise<Video> {
  return request<Video>('/videos', {
    method: 'POST',
    body: JSON.stringify({ url, title, tags }),
  })
}

export function getVideos(params: {
  page?: number
  limit?: number
  tags?: string[]
  status?: string
  q?: string
  category?: string
  saved?: boolean
  scripted?: boolean
}): Promise<PaginatedVideos> {
  const qs = new URLSearchParams()
  if (params.page) qs.set('page', String(params.page))
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.tags?.length) qs.set('tags', params.tags.join(','))
  if (params.status) qs.set('status', params.status)
  if (params.q) qs.set('q', params.q)
  if (params.category) qs.set('category', params.category)
  if (params.saved !== undefined) qs.set('saved', String(params.saved))
  if (params.scripted !== undefined) qs.set('scripted', String(params.scripted))
  const query = qs.toString()
  return request<PaginatedVideos>(`/videos${query ? `?${query}` : ''}`)
}

export function getVideo(id: string): Promise<Video> {
  return request<Video>(`/videos/${id}`)
}

export function updateVideo(id: string, data: { title?: string; tags?: string[]; category?: string | null; saved?: boolean; scripted?: boolean }): Promise<Video> {
  return request<Video>(`/videos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function retryVideo(id: string): Promise<Video> {
  return request<Video>(`/videos/${id}/retry`, { method: 'POST' })
}

export function deleteVideo(id: string): Promise<void> {
  return request<void>(`/videos/${id}`, { method: 'DELETE' })
}

export function getTags(): Promise<TagCount[]> {
  return request<TagCount[]>('/videos/tags')
}
