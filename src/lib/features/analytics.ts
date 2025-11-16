import { supabase } from '../../integrations/supabase/client';
import { UserAnalytics, AnalyticsData } from '../../types/features';

// ============================================================
// ANALYTICS RECORDING
// ============================================================

export const recordChatMetadata = async (
  chatId: string,
  model: string,
  tokenCount: number,
  messageCount: number
): Promise<void> => {
  const now = new Date().toISOString();

  const { error } = await supabase.from('chat_metadata').insert({
    chat_id: chatId,
    model,
    total_tokens: tokenCount,
    total_messages: messageCount,
    first_message_at: now,
    last_message_at: now,
  });

  if (error && error.code !== '23505') {
    // Ignore duplicate key errors
    throw new Error(`Failed to record chat metadata: ${error.message}`);
  }
};

export const updateChatMetadata = async (
  chatId: string,
  updates: { tokenCount?: number; messageCount?: number }
): Promise<void> => {
  const { error } = await supabase
    .from('chat_metadata')
    .update({
      total_tokens: updates.tokenCount,
      total_messages: updates.messageCount,
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('chat_id', chatId);

  if (error) throw new Error(`Failed to update chat metadata: ${error.message}`);
};

// ============================================================
// ANALYTICS RETRIEVAL
// ============================================================

export const getUserAnalytics = async (
  userId: string,
  daysBack: number = 30
): Promise<UserAnalytics[]> => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  const { data, error } = await supabase
    .from('user_analytics')
    .select('*')
    .eq('user_id', userId)
    .gte('analytics_date', startDate.toISOString().split('T')[0])
    .order('analytics_date', { ascending: true });

  if (error) throw new Error(`Failed to fetch user analytics: ${error.message}`);
  return data || [];
};

export const getAggregatedAnalytics = async (userId: string): Promise<AnalyticsData> => {
  // Fetch last 90 days
  const analytics = await getUserAnalytics(userId, 90);

  if (analytics.length === 0) {
    return {
      dailyMessages: [],
      dailyTokens: [],
      modelBreakdown: [],
      totalMessages: 0,
      totalTokens: 0,
      averageResponseTime: 0,
      daysActive: 0,
    };
  }

  // Calculate metrics
  const totalMessages = analytics.reduce((sum, a) => sum + a.message_count, 0);
  const totalTokens = analytics.reduce((sum, a) => sum + a.token_count, 0);
  const avgResponseTime =
    analytics.reduce((sum, a) => sum + (a.avg_response_time_ms || 0), 0) / analytics.length;
  const daysActive = new Set(analytics.map((a) => a.analytics_date)).size;

  // Build daily arrays
  const dailyMessages = analytics.map((a) => ({
    date: a.analytics_date,
    count: a.message_count,
  }));

  const dailyTokens = analytics.map((a) => ({
    date: a.analytics_date,
    count: a.token_count,
  }));

  // Aggregate model usage
  const modelMap: Record<string, number> = {};
  for (const analytic of analytics) {
    for (const [model, count] of Object.entries(analytic.models_used || {})) {
      modelMap[model] = (modelMap[model] || 0) + (count as number);
    }
  }

  const totalModelUses = Object.values(modelMap).reduce((a, b) => a + b, 0);
  const modelBreakdown = Object.entries(modelMap)
    .map(([model, count]) => ({
      model,
      count,
      percentage: (count / totalModelUses) * 100,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    dailyMessages,
    dailyTokens,
    modelBreakdown,
    totalMessages,
    totalTokens,
    averageResponseTime: Math.round(avgResponseTime),
    daysActive,
  };
};

// ============================================================
// ANALYTICS EXPORT
// ============================================================

export const exportAnalyticsAsJSON = async (
  userId: string,
  daysBack: number = 90
): Promise<string> => {
  const analytics = await getUserAnalytics(userId, daysBack);
  const aggregated = await getAggregatedAnalytics(userId);

  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      period: `${daysBack} days`,
      aggregated,
      daily: analytics,
    },
    null,
    2
  );
};

export const exportAnalyticsAsCSV = async (
  userId: string,
  daysBack: number = 90
): Promise<string> => {
  const analytics = await getUserAnalytics(userId, daysBack);

  const headers = ['Date', 'Messages', 'Tokens', 'Avg Response Time (ms)', 'Models Used'];
  const rows = analytics.map((a) => [
    a.analytics_date,
    a.message_count,
    a.token_count,
    a.avg_response_time_ms || '-',
    Object.keys(a.models_used || {}).join('; '),
  ]);

  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  return csv;
};

// ============================================================
// REAL-TIME ANALYTICS UPDATES
// ============================================================

export const incrementDailyStats = async (
  userId: string,
  model: string,
  tokens: number,
  responseTime?: number
): Promise<void> => {
  const today = new Date().toISOString().split('T')[0];

  // Try to update existing record
  const { data: existing, error: fetchError } = await supabase
    .from('user_analytics')
    .select('*')
    .eq('user_id', userId)
    .eq('analytics_date', today)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    // PGRST116 = no rows found
    throw new Error(`Failed to fetch analytics: ${fetchError.message}`);
  }

  if (existing) {
    // Update existing record
    const updatedModels = {
      ...(existing.models_used || {}),
      [model]: ((existing.models_used || {})[model] || 0) + 1,
    };

    const newAvgTime =
      existing.avg_response_time_ms && responseTime
        ? (existing.avg_response_time_ms + responseTime) / 2
        : responseTime || existing.avg_response_time_ms;

    const { error } = await supabase
      .from('user_analytics')
      .update({
        message_count: existing.message_count + 1,
        token_count: existing.token_count + tokens,
        models_used: updatedModels,
        avg_response_time_ms: newAvgTime,
      })
      .eq('id', existing.id);

    if (error) throw new Error(`Failed to update analytics: ${error.message}`);
  } else {
    // Create new record
    const { error } = await supabase.from('user_analytics').insert({
      user_id: userId,
      analytics_date: today,
      message_count: 1,
      token_count: tokens,
      models_used: { [model]: 1 },
      avg_response_time_ms: responseTime,
    });

    if (error) throw new Error(`Failed to record analytics: ${error.message}`);
  }
};

// ============================================================
// CHART DATA GENERATION
// ============================================================

export const generateChartData = async (userId: string, daysBack: number = 30) => {
  const analytics = await getUserAnalytics(userId, daysBack);

  // Messages trend
  const messagesTrend = analytics.map((a) => ({
    date: new Date(a.analytics_date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    messages: a.message_count,
  }));

  // Tokens trend
  const tokensTrend = analytics.map((a) => ({
    date: new Date(a.analytics_date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    tokens: a.token_count,
  }));

  return {
    messagesTrend,
    tokensTrend,
  };
};
