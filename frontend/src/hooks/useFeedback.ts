import { useState, useEffect, useCallback } from 'react';
import { apiService, ChatFeedback, GetFeedbackResponse } from '../services/api.service';

interface UseFeedbackOptions {
  conversationId?: string;
  enabled?: boolean;
  refetchInterval?: number;
}

interface UseFeedbackReturn {
  feedback: ChatFeedback[];
  totalFeedback: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage feedback for a conversation
 * @param options - Configuration options
 * @returns Feedback data, loading state, error, and refetch function
 */
export function useFeedback({
  conversationId,
  enabled = true,
  refetchInterval,
}: UseFeedbackOptions = {}): UseFeedbackReturn {
  const [feedback, setFeedback] = useState<ChatFeedback[]>([]);
  const [totalFeedback, setTotalFeedback] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedback = useCallback(async () => {
    if (!enabled) {
      setFeedback([]);
      setTotalFeedback(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // If conversationId is provided, fetch feedback for that conversation
      // Otherwise, fetch all feedback
      const response: GetFeedbackResponse = await apiService.getFeedback(conversationId);
      setFeedback(response.feedback || []);
      setTotalFeedback(response.totalFeedback || 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch feedback';
      setError(errorMessage);
      console.error('Error fetching feedback:', err);
      setFeedback([]);
      setTotalFeedback(0);
    } finally {
      setLoading(false);
    }
  }, [conversationId, enabled]);

  // Initial fetch and refetch when conversationId changes
  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  // Set up interval refetch if specified
  useEffect(() => {
    if (!enabled || !refetchInterval) {
      return;
    }

    const interval = setInterval(() => {
      fetchFeedback();
    }, refetchInterval);

    return () => clearInterval(interval);
  }, [enabled, refetchInterval, fetchFeedback]);

  return {
    feedback,
    totalFeedback,
    loading,
    error,
    refetch: fetchFeedback,
  };
}

