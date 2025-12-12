import { useMemo } from 'react';
import { useChatAnalytics } from '../hooks/useChatAnalytics';
import { ConversationSummary, UserAnalytics } from '../services/api.service';

const formatDate = (value: string | null): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatNumber = (value: number | undefined | null): string =>
  typeof value === 'number' ? value.toLocaleString() : '0';

const StatCard = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent: string;
}) => (
  <div className="rounded-xl border border-gray-200 bg-white/80 p-5 shadow-sm backdrop-blur">
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-500">{label}</p>
      <span className={`h-2 w-2 rounded-full ${accent}`} />
    </div>
    <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
  </div>
);

const SectionCard = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white/90 p-6 shadow-sm backdrop-blur">
    <div className="mb-4 flex items-center justify-between gap-2">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
    {children}
  </div>
);

const Analytics = () => {
  const { analytics, loading, error, refetch } = useChatAnalytics({ refetchInterval: 30000 });

  const sortedConversations = useMemo<ConversationSummary[]>(() => {
    return (analytics?.conversationSummaries || []).slice().sort((a, b) => b.messageCount - a.messageCount);
  }, [analytics]);

  const sortedUsers = useMemo<UserAnalytics[]>(() => {
    return (analytics?.users || []).slice().sort((a, b) => b.messageCount - a.messageCount);
  }, [analytics]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4">
        <header className="rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Insights</p>
              <h1 className="text-3xl font-semibold text-slate-900">Chat Analytics</h1>
              <p className="mt-1 text-sm text-slate-600">
                Overview of conversations, participants, and activity pulled from the backend analytics endpoint.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={refetch}
                disabled={loading}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
              {analytics?.lastMessageAt && (
                <div className="rounded-full bg-slate-100 px-4 py-2 text-xs text-slate-600">
                  Last message: {formatDate(analytics.lastMessageAt)}
                </div>
              )}
            </div>
          </div>
        </header>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Failed to load analytics: {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Conversations" value={formatNumber(analytics?.totalConversations)} accent="bg-indigo-500" />
          <StatCard label="Messages" value={formatNumber(analytics?.totalMessages)} accent="bg-emerald-500" />
          <StatCard
            label="Avg / Conversation"
            value={analytics ? analytics.averageMessagesPerConversation.toFixed(1) : '0.0'}
            accent="bg-amber-500"
          />
          <StatCard label="Participants" value={formatNumber(analytics?.totalParticipants)} accent="bg-blue-500" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <SectionCard
            title="Top Conversations"
            description="Most active conversations by message count"
          >
            {loading && !analytics && (
              <div className="flex flex-col gap-3">
                {[...Array(4)].map((_, idx) => (
                  <div key={idx} className="h-14 rounded-lg bg-slate-100/80 animate-pulse" />
                ))}
              </div>
            )}
            {!loading && sortedConversations.length === 0 && <p className="text-sm text-slate-500">No data yet.</p>}
            {!loading && sortedConversations.length > 0 && (
              <div className="divide-y divide-slate-100">
                {sortedConversations.map((item) => (
                  <div key={item.conversationId} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">#{item.conversationId}</p>
                      <p className="text-xs text-slate-500">
                        {formatDate(item.firstMessageAt)} — {formatDate(item.lastMessageAt)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Participants: {item.participants.length > 0 ? item.participants.join(', ') : '—'}
                      </p>
                    </div>
                    <div className="rounded-lg bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
                      {item.messageCount} msgs
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Participants"
            description="Message volume by user"
          >
            {loading && !analytics && (
              <div className="flex flex-col gap-3">
                {[...Array(4)].map((_, idx) => (
                  <div key={idx} className="h-14 rounded-lg bg-slate-100/80 animate-pulse" />
                ))}
              </div>
            )}
            {!loading && sortedUsers.length === 0 && <p className="text-sm text-slate-500">No participant data.</p>}
            {!loading && sortedUsers.length > 0 && (
              <div className="divide-y divide-slate-100">
                {sortedUsers.map((user) => (
                  <div key={user.username} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{user.username || 'Unknown'}</p>
                      <p className="text-xs text-slate-500">
                        Conversations: {user.conversations.length > 0 ? user.conversations.join(', ') : '—'}
                      </p>
                    </div>
                    <div className="rounded-lg bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                      {user.messageCount} msgs
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Messages by Conversation"
            description="Quick view of message totals"
          >
            {loading && !analytics && (
              <div className="flex flex-col gap-3">
                {[...Array(5)].map((_, idx) => (
                  <div key={idx} className="h-12 rounded-lg bg-slate-100/80 animate-pulse" />
                ))}
              </div>
            )}
            {!loading && (!analytics || Object.keys(analytics.messagesPerConversation || {}).length === 0) && (
              <p className="text-sm text-slate-500">No conversation data.</p>
            )}
            {!loading && analytics && Object.keys(analytics.messagesPerConversation || {}).length > 0 && (
              <div className="flex flex-col gap-3">
                {Object.entries(analytics.messagesPerConversation).map(([id, count]) => (
                  <div key={id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <div className="text-sm font-semibold text-slate-800">#{id}</div>
                    <div className="text-sm text-slate-600">{count} msgs</div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default Analytics;

