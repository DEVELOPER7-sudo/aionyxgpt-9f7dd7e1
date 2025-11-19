import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAnalytics } from '@/hooks/useFeatures';
import ReactMarkdown from 'react-markdown';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface DashboardConfig {
    fullWidth: boolean;
    compactView: boolean;
    showGridLines: boolean;
    hideAnimations: boolean;
    cardLayout: 'grid' | 'single';
    chartHeight: number;
}

interface PuterUsageData {
    total: number;
    remaining: number;
    monthUsageAllowance: number;
    models: Record<string, { count: number; cost: number; units: number }>;
    appTotals: any;
    lastUpdated: Date;
}

export const AnalyticsDashboard = () => {
    const [daysBack, setDaysBack] = useState(30);
    const [config, setConfig] = useState<DashboardConfig>({
        fullWidth: true,
        compactView: false,
        showGridLines: true,
        hideAnimations: false,
        cardLayout: 'grid',
        chartHeight: 300,
    });
    const [showSettings, setShowSettings] = useState(false);
    const [puterUsage, setPuterUsage] = useState<PuterUsageData | null>(null);
    const [puterLoading, setPuterLoading] = useState(false);
    const { analytics, loadAnalytics, loading, error } = useAnalytics(daysBack);

    // Fetch Puter API usage every 10 seconds
    useEffect(() => {
        const fetchPuterUsage = async () => {
            try {
                setPuterLoading(true);
                // @ts-ignore - puter is a global object
                const puter = window.puter;

                if (puter && puter.auth && typeof puter.auth.getMonthlyUsage === 'function') {
                    // @ts-ignore
                    const usage = await puter.auth.getMonthlyUsage();

                    if (usage) {
                        setPuterUsage({
                            total: usage.total || 0,
                            remaining: usage.allowanceInfo?.remaining || 0,
                            monthUsageAllowance: usage.allowanceInfo?.monthUsageAllowance || 0,
                            models: usage.models || {},
                            appTotals: usage.appTotals || {},
                            lastUpdated: new Date(),
                        });
                    }
                } else {
                    console.warn('Puter API not available');
                }
            } catch (err) {
                console.error('Error fetching Puter usage:', err);
            } finally {
                setPuterLoading(false);
            }
        };

        // Wait for puter to be loaded
        const checkAndFetch = () => {
            // @ts-ignore
            if (window.puter) {
                fetchPuterUsage();
                const interval = setInterval(fetchPuterUsage, 10000); // Update every 10 seconds
                return () => clearInterval(interval);
            } else {
                setTimeout(checkAndFetch, 500);
            }
        };

        checkAndFetch();
    }, []);

    const handleDaysChange = (days: number) => {
        setDaysBack(days);
    };

    const updateConfig = (key: keyof DashboardConfig, value: any) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <p className="text-muted-foreground">Loading analytics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <p className="text-red-500 mb-4">Error loading analytics: {error}</p>
                    <Button onClick={() => loadAnalytics()}>Retry</Button>
                </div>
            </div>
        );
    }

    if (!analytics || !analytics.dailyMessages) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <p className="text-muted-foreground mb-4">No analytics data available yet</p>
                    <Button onClick={() => loadAnalytics()}>Reload Analytics</Button>
                </div>
            </div>
        );
    }

    return (
        <div className={`${config.fullWidth ? 'w-full' : 'max-w-7xl'} space-y-6`}>
            {/* Settings Button */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSettings(!showSettings)}
                >
                    {showSettings ? 'Hide' : 'Show'} Settings
                </Button>
            </div>

            {/* Customization Settings */}
            {showSettings && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Dashboard Customization</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Layout: {config.cardLayout}</label>
                                <div className="flex gap-2">
                                    <Button
                                        variant={config.cardLayout === 'grid' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => updateConfig('cardLayout', 'grid')}
                                    >
                                        Grid
                                    </Button>
                                    <Button
                                        variant={config.cardLayout === 'single' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => updateConfig('cardLayout', 'single')}
                                    >
                                        Single Column
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Chart Height: {config.chartHeight}px</label>
                                <input
                                    type="range"
                                    min="200"
                                    max="600"
                                    step="50"
                                    value={config.chartHeight}
                                    onChange={(e) => updateConfig('chartHeight', parseInt(e.target.value))}
                                    className="w-full"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium">
                                    <input
                                        type="checkbox"
                                        checked={config.fullWidth}
                                        onChange={(e) => updateConfig('fullWidth', e.target.checked)}
                                    />
                                    Full Width
                                </label>
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium">
                                    <input
                                        type="checkbox"
                                        checked={config.compactView}
                                        onChange={(e) => updateConfig('compactView', e.target.checked)}
                                    />
                                    Compact View
                                </label>
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium">
                                    <input
                                        type="checkbox"
                                        checked={config.showGridLines}
                                        onChange={(e) => updateConfig('showGridLines', e.target.checked)}
                                    />
                                    Show Grid Lines
                                </label>
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium">
                                    <input
                                        type="checkbox"
                                        checked={config.hideAnimations}
                                        onChange={(e) => updateConfig('hideAnimations', e.target.checked)}
                                    />
                                    Reduce Animations
                                </label>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Summary Cards */}
            <div className={`${config.cardLayout === 'grid' ? 'grid grid-cols-1 md:grid-cols-4' : 'flex flex-col'} gap-4`}>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Messages
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.totalMessages}</div>
                        <p className="text-xs text-muted-foreground mt-1">Last {daysBack} days</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Tokens
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {(analytics.totalTokens / 1000).toFixed(1)}k
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Tokens used</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Active Days
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.daysActive}</div>
                        <p className="text-xs text-muted-foreground mt-1">Days active</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Avg Response
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {analytics.averageResponseTime}ms
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Response time</p>
                    </CardContent>
                </Card>
            </div>

            {/* Time Range Filter */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Time Range</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-2 flex-wrap">
                    {[7, 14, 30, 60, 90].map((days) => (
                        <Button
                            key={days}
                            variant={daysBack === days ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleDaysChange(days)}
                        >
                            {days}d
                        </Button>
                    ))}
                    <Button
                        variant={daysBack === 365 ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleDaysChange(365)}
                    >
                        1y
                    </Button>
                </CardContent>
            </Card>

            <Tabs defaultValue="messages" className="w-full">
                <TabsList>
                    <TabsTrigger value="messages">Messages Trend</TabsTrigger>
                    <TabsTrigger value="tokens">Tokens Trend</TabsTrigger>
                    <TabsTrigger value="models">Model Breakdown</TabsTrigger>
                    <TabsTrigger value="api-usage">API Usage</TabsTrigger>
                </TabsList>

                <TabsContent value="messages" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Messages Over Time</CardTitle>
                            <CardDescription>Daily message count for the last {daysBack} days</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {analytics.dailyMessages.length > 0 ? (
                                <ResponsiveContainer width="100%" height={config.chartHeight}>
                                    <LineChart data={analytics.dailyMessages}>
                                        {config.showGridLines && <CartesianGrid strokeDasharray="3 3" />}
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line
                                            type="monotone"
                                            dataKey="count"
                                            stroke="#3b82f6"
                                            dot={false}
                                            isAnimationActive={!config.hideAnimations}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-80">
                                    <p className="text-muted-foreground">No message data available for this period</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="tokens" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Tokens Over Time</CardTitle>
                            <CardDescription>Daily token consumption</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {analytics.dailyTokens.length > 0 ? (
                                <ResponsiveContainer width="100%" height={config.chartHeight}>
                                    <BarChart data={analytics.dailyTokens}>
                                        {config.showGridLines && <CartesianGrid strokeDasharray="3 3" />}
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar
                                            dataKey="count"
                                            fill="#10b981"
                                            isAnimationActive={!config.hideAnimations}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-80">
                                    <p className="text-muted-foreground">No token data available for this period</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="models" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Model Usage Distribution</CardTitle>
                            <CardDescription>Breakdown by AI model used</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {analytics.modelBreakdown.length > 0 ? (
                                <div className={`${config.compactView ? 'flex flex-col' : 'grid grid-cols-1 md:grid-cols-2'} gap-6`}>
                                    <ResponsiveContainer width="100%" height={config.chartHeight}>
                                        <PieChart>
                                            <Pie
                                                data={analytics.modelBreakdown}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ model, percentage }: any) => `${model} (${percentage.toFixed(1)}%)`}
                                                outerRadius={config.compactView ? 60 : 80}
                                                fill="#8884d8"
                                                dataKey="count"
                                                isAnimationActive={!config.hideAnimations}
                                            >
                                                {analytics.modelBreakdown.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>

                                    <div className="flex flex-col justify-center">
                                        {analytics.modelBreakdown.map((item: any, index: number) => (
                                            <div key={item.model} className="flex items-center gap-2 mb-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                />
                                                <span className="text-sm font-medium">{item.model}</span>
                                                <span className="text-sm text-muted-foreground ml-auto">
                                                    {item.count} uses ({item.percentage.toFixed(1)}%)
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-80">
                                    <p className="text-muted-foreground">No model usage data available for this period</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="api-usage" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>API Token Usage & Models</CardTitle>
                            <CardDescription>Real-time usage statistics (updates every 10 seconds)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {puterLoading ? (
                                <div className="flex items-center justify-center h-80">
                                    <p className="text-muted-foreground">Loading API usage data...</p>
                                </div>
                            ) : puterUsage ? (
                                <div className="space-y-6">
                                    {/* Usage Summary Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border">
                                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Used</p>
                                            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-2">
                                                ${(puterUsage.total / 1000000).toFixed(2)}M
                                            </p>
                                        </div>
                                        <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border">
                                            <p className="text-sm font-medium text-green-600 dark:text-green-400">Remaining</p>
                                            <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-2">
                                                ${(puterUsage.remaining / 1000000).toFixed(2)}M
                                            </p>
                                        </div>
                                        <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg border">
                                            <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Monthly Allowance</p>
                                            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-2">
                                                ${(puterUsage.monthUsageAllowance / 1000000).toFixed(2)}M
                                            </p>
                                        </div>
                                    </div>

                                    {/* Usage Progress */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium">Usage Progress</span>
                                            <span className="text-muted-foreground">
                                                {((puterUsage.total / puterUsage.monthUsageAllowance) * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                                                style={{
                                                    width: `${Math.min((puterUsage.total / puterUsage.monthUsageAllowance) * 100, 100)}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Models Markdown Summary */}
                                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border">
                                        <h3 className="font-semibold mb-3">Model Usage</h3>
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            <ReactMarkdown>
                                                {generateModelMarkdown(puterUsage.models)}
                                            </ReactMarkdown>
                                        </div>
                                    </div>

                                    {/* Last Updated */}
                                    <div className="text-xs text-muted-foreground text-right">
                                        Last updated: {puterUsage.lastUpdated.toLocaleTimeString()}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-80">
                                    <p className="text-muted-foreground">No API usage data available. Puter API may not be loaded.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

function generateModelMarkdown(models: Record<string, any>): string {
    if (!models || Object.keys(models).length === 0) {
        return '## No model data available';
    }

    const sortedModels = Object.entries(models)
        .sort((a, b) => (b[1].cost || 0) - (a[1].cost || 0))
        .slice(0, 15);

    let markdown = '| Model | Calls | Cost | Units |\n';
    markdown += '|-------|-------|------|-------|\n';

    for (const [model, data] of sortedModels) {
        const modelName = model.replace(/^openrouter:/, '').replace(/:.*$/, '');
        const calls = data.count || 0;
        const cost = ((data.cost || 0) / 1000000).toFixed(2);
        const units = data.units || 0;
        markdown += `| ${modelName} | ${calls} | $${cost}M | ${units} |\n`;
    }

    return markdown;
}
