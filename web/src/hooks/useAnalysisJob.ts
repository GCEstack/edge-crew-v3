import { useEffect, useRef, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { getAnalysisJob } from '@/services/api'

export type AnalysisStatus = 'pending' | 'running' | 'completed' | 'failed' | null

interface UseAnalysisJobOptions {
  jobId: string | null
  sport: string
  gameIds?: string[]
  queryKey?: any[]
}

export function useAnalysisJob(options: UseAnalysisJobOptions) {
  const { jobId, sport, gameIds = [], queryKey } = options
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<AnalysisStatus>(null)
  const [progress, setProgress] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const finish = useCallback(
    (finalStatus: 'completed' | 'failed', errMsg?: string | null) => {
      setStatus(finalStatus)
      setError(errMsg || null)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (queryKey && finalStatus === 'completed') {
        queryClient.invalidateQueries({ queryKey })
      }
    },
    [queryClient, queryKey]
  )

  useEffect(() => {
    if (!jobId) {
      setStatus(null)
      setProgress([])
      setError(null)
      return
    }

    let cancelled = false
    setStatus('pending')

    const poll = async () => {
      try {
        const job = await getAnalysisJob(jobId)
        if (cancelled) return
        setStatus((prev) => (job.status !== prev ? (job.status as AnalysisStatus) : prev))
        if (job.status === 'completed') {
          finish('completed', null)
        } else if (job.status === 'failed') {
          finish('failed', job.error_message || 'Analysis failed')
        }
      } catch (e) {
        console.error('[useAnalysisJob] poll failed:', e)
      }
    }

    poll()
    intervalRef.current = setInterval(poll, 2500)

    return () => {
      cancelled = true
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [jobId, finish])

  const gameIdsKey = gameIds.join(',')

  useEffect(() => {
    if (!jobId) return

    const filter =
      gameIds.length > 0
        ? `game_id=in.(${gameIdsKey})`
        : `sport=eq.${sport}`

    const channel = supabase
      .channel(`analysis-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'model_responses',
          filter,
        },
        (payload) => {
          const modelName = (payload.new as any)?.model_name
          if (modelName) {
            setProgress((prev) => Array.from(new Set([...prev, modelName])))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [jobId, sport, gameIdsKey, gameIds])

  return { status, progress, error }
}
