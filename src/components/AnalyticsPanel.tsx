import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';

export const AnalyticsPanel = () => {
  return (
    <div className="h-screen w-full overflow-y-auto overflow-x-hidden">
      <div className="max-w-6xl mx-auto p-3 md:p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track your chat activity and model usage over time</p>
        </div>

        <AnalyticsDashboard />
      </div>
    </div>
  );
};

export default AnalyticsPanel;
