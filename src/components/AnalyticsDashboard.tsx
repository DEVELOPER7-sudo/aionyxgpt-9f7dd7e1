import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAnalytics } from '@/hooks/useFeatures';

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
                        console.log('Puter API Response:', usage);
                        const total = usage.total || 0;
                        const allowance = usage.allowanceInfo?.monthUsageAllowance || usage.monthUsageAllowance || 0;
                        const remaining = usage.allowanceInfo?.remaining || (allowance - total) || 0;

                        setPuterUsage({
                            total: total,
                            remaining: remaining,
                            monthUsageAllowance: allowance,
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
                <Card className="bg-slate-900 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-sm text-white">Dashboard Customization</CardTitle>
                        <CardDescription className="text-slate-300">Configure layout and chart display options</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 text-white">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Chart Height */}
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <label className="text-sm font-semibold">Chart Height</label>
                                    <span className="text-sm font-medium text-cyan-400">{config.chartHeight}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="200"
                                    max="600"
                                    step="50"
                                    value={config.chartHeight}
                                    onChange={(e) => updateConfig('chartHeight', parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                                />
                                <div className="flex justify-between text-xs text-slate-400">
                                    <span>200px</span>
                                    <span>600px</span>
                                </div>
                            </div>

                            {/* Card Layout */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold">Summary Cards Layout</label>
                                <div className="flex gap-2">
                                    <Button
                                        variant={config.cardLayout === 'grid' ? 'default' : 'outline'}
                                        size="sm"
                                        className={`flex-1 ${config.cardLayout === 'grid' ? 'bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-600' : 'border-slate-600 text-white hover:bg-slate-800'}`}
                                        onClick={() => updateConfig('cardLayout', 'grid')}
                                    >
                                        Grid
                                    </Button>
                                    <Button
                                        variant={config.cardLayout === 'single' ? 'default' : 'outline'}
                                        size="sm"
                                        className={`flex-1 ${config.cardLayout === 'single' ? 'bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-600' : 'border-slate-600 text-white hover:bg-slate-800'}`}
                                        onClick={() => updateConfig('cardLayout', 'single')}
                                    >
                                        Single
                                    </Button>
                                </div>
                            </div>

                            {/* Full Width */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 text-sm font-semibold cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config.fullWidth}
                                        onChange={(e) => updateConfig('fullWidth', e.target.checked)}
                                        className="w-4 h-4 rounded accent-cyan-400"
                                    />
                                    <span>Full Width Layout</span>
                                    {config.fullWidth && <span className="text-xs bg-cyan-600 text-white px-2 py-0.5 rounded">Active</span>}
                                </label>
                            </div>

                            {/* Compact View */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 text-sm font-semibold cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config.compactView}
                                        onChange={(e) => updateConfig('compactView', e.target.checked)}
                                        className="w-4 h-4 rounded accent-cyan-400"
                                    />
                                    <span>Compact View</span>
                                    {config.compactView && <span className="text-xs bg-cyan-600 text-white px-2 py-0.5 rounded">Active</span>}
                                </label>
                            </div>

                            {/* Grid Lines */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 text-sm font-semibold cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config.showGridLines}
                                        onChange={(e) => updateConfig('showGridLines', e.target.checked)}
                                        className="w-4 h-4 rounded accent-cyan-400"
                                    />
                                    <span>Show Grid Lines</span>
                                    {config.showGridLines && <span className="text-xs bg-cyan-600 text-white px-2 py-0.5 rounded">Active</span>}
                                </label>
                            </div>

                            {/* Animations */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 text-sm font-semibold cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config.hideAnimations}
                                        onChange={(e) => updateConfig('hideAnimations', e.target.checked)}
                                        className="w-4 h-4 rounded accent-cyan-400"
                                    />
                                    <span>Reduce Animations</span>
                                    {config.hideAnimations && <span className="text-xs bg-cyan-600 text-white px-2 py-0.5 rounded">Active</span>}
                                </label>
                            </div>
                        </div>

                        {/* Settings Summary */}
                        <div className="mt-6 pt-4 border-t border-slate-700">
                            <p className="text-xs text-slate-300">
                                <strong className="text-cyan-400">Current Settings:</strong> {config.fullWidth ? 'Full width' : 'Max width'} • {config.cardLayout} layout • {config.chartHeight}px charts {config.showGridLines ? '+ gridlines' : ''} {config.hideAnimations ? '• No animations' : '• With animations'}
                            </p>
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

            <Tabs defaultValue="api-usage" className="w-full">
                <TabsList>
                    <TabsTrigger value="api-usage">API Usage</TabsTrigger>
                </TabsList>

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
                                    <div className={`${config.cardLayout === 'grid' ? 'grid grid-cols-1 md:grid-cols-3' : 'flex flex-col'} gap-4`}>
                                        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border">
                                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Used</p>
                                            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-2">
                                                {(puterUsage.total / 1000000).toFixed(2)}M
                                            </p>
                                        </div>
                                        <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border">
                                            <p className="text-sm font-medium text-green-600 dark:text-green-400">Remaining</p>
                                            <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-2">
                                                {(puterUsage.remaining / 1000000).toFixed(2)}M
                                            </p>
                                        </div>
                                        <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg border">
                                            <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Monthly Allowance</p>
                                            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-2">
                                                {(puterUsage.monthUsageAllowance / 1000000).toFixed(2)}M
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

                                    {/* Models Chart and List */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-lg">Model Usage Breakdown</h3>
                                        {Object.keys(puterUsage.models).length > 0 ? (
                                            <>
                                                {/* Bar Chart */}
                                                <div className={`bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border ${config.compactView ? 'md:col-span-2' : ''}`}>
                                                    <h4 className="text-sm font-semibold mb-4">Cost by Model</h4>
                                                    <ResponsiveContainer width="100%" height={config.chartHeight}>
                                                        <BarChart data={getTopModels(puterUsage.models, 10)}>
                                                            {config.showGridLines && <CartesianGrid strokeDasharray="3 3" />}
                                                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                                                            <YAxis />
                                                            <Tooltip />
                                                            <Bar dataKey="cost" fill="#3b82f6" isAnimationActive={!config.hideAnimations} />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>

                                                {/* Models Table */}
                                                <div className={`bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border overflow-x-auto ${!config.compactView ? 'md:col-span-1' : ''}`}>
                                                    <h4 className="text-sm font-semibold mb-4">All Models</h4>
                                                    <table className={`w-full text-sm`}>
                                                        <thead>
                                                            <tr className="border-b">
                                                                <th className="text-left py-2 px-2">Model</th>
                                                                {!config.compactView && <th className="text-center py-2 px-2">Calls</th>}
                                                                <th className="text-right py-2 px-2">Cost ($M)</th>
                                                                {!config.compactView && <th className="text-right py-2 px-2">Units</th>}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {Object.entries(puterUsage.models)
                                                                .sort((a, b) => (b[1].cost || 0) - (a[1].cost || 0))
                                                                .slice(0, config.compactView ? 8 : 15)
                                                                .map(([model, data], idx) => (
                                                                    <tr key={model} className="border-b hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                                                        <td className="py-2 px-2 font-medium truncate">{formatModelName(model)}</td>
                                                                        {!config.compactView && <td className="text-center py-2 px-2">{data.count || 0}</td>}
                                                                        <td className="text-right py-2 px-2 font-semibold text-blue-600 dark:text-blue-400">${((data.cost || 0) / 1000000).toFixed(2)}</td>
                                                                        {!config.compactView && <td className="text-right py-2 px-2">{data.units || 0}</td>}
                                                                    </tr>
                                                                ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground">
                                                No model usage data available
                                            </div>
                                        )}
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

function formatModelName(model: string): string {
    return model
        .replace(/^openrouter:/, '')
        .replace(/:.*$/, '')
        .replace(/_/g, ' ')
        .split('/')
        .pop() || model;
}

function getTopModels(models: Record<string, any>, limit: number = 10) {
    return Object.entries(models)
        .map(([model, data]) => ({
            name: formatModelName(model),
            cost: (data.cost || 0) / 1000000,
            count: data.count || 0,
        }))
        .sort((a, b) => b.cost - a.cost)
        .slice(0, limit);
}
