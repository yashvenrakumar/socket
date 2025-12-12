import { useCallback, useEffect, useState } from 'react';
import { apiService, ChatAnalytics } from '../services/api.service';

interface UseChatAnalyticsOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

interface UseChatAnalyticsReturn {
  analytics: ChatAnalytics | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Fetch and manage chat analytics data.
 * Provides null-safe defaults and periodic refetch capability.
 */
export function useChatAnalytics(
  { enabled = true, refetchInterval }: UseChatAnalyticsOptions = {}
): UseChatAnalyticsReturn {
  const [analytics, setAnalytics] = useState<ChatAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!enabled) {
      setAnalytics(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getChatAnalytics();
      setAnalytics(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(message);
      console.error('[useChatAnalytics] Error fetching analytics', err);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    if (!enabled || !refetchInterval) return;
    const interval = setInterval(fetchAnalytics, refetchInterval);
    return () => clearInterval(interval);
  }, [enabled, refetchInterval, fetchAnalytics]);

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics,
  };
}

