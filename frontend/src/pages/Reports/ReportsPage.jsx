import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
    Calendar, Download, TrendingUp, TrendingDown, FileText, CreditCard,
    IndianRupee, Wallet, Users, Repeat, Layers, PieChart as PieIcon,
    ArrowUpRight, ArrowDownRight, Share2, Printer, LayoutDashboard, LineChart
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, BarChart, Bar, ScatterChart, Scatter, ZAxis
} from 'recharts';
import services from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { useSettings } from '../../context/SettingsContext';

const ReportsPage = () => {
    const { settings } = useSettings();
    // --- State ---
    const [viewMode, setViewMode] = useState('analyst'); // 'owner' | 'analyst'
    const [datePreset, setDatePreset] = useState('thisWeek');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [compare, setCompare] = useState(false);
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({
        dashboard: {
            sales: { value: 0, prev: 0, change: 0, sparkline: [] },
            orders: { value: 0, prev: 0, change: 0 },
            expenses: { value: 0, prev: 0, change: 0 },
            netProfit: { value: 0, prev: 0, change: 0 },
            aov: { value: 0, prev: 0, change: 0 }
        },
        customers: { newCustomers: 0, returningCustomers: 0, repeatRate: 0, clv: 0 },
        paymentMethods: [],
        topProducts: [],
        salesTrend: []
    });

    const [topProductsTab, setTopProductsTab] = useState('product'); // 'product', 'category', 'brand'
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

    const printRef = useRef();

    // --- Date Logic ---
    useEffect(() => {
        const now = new Date();
        let start = new Date();
        let end = new Date();

        switch (datePreset) {
            case 'today':
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'yesterday':
                start.setDate(start.getDate() - 1);
                start.setHours(0, 0, 0, 0);
                end.setDate(end.getDate());
                end.setHours(23, 59, 59, 999); // Actually end of yesterday
                end = new Date(start); end.setHours(23, 59, 59, 999);
                break;
            case 'thisWeek':
                const day = start.getDay();
                const diff = start.getDate() - day + (day === 0 ? -6 : 1);
                start.setDate(diff); start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'thisMonth':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                break;
            case 'lastMonth':
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
                break;
            default:
                break;
        }
        setDateRange({ start: start.toISOString(), end: end.toISOString() });
    }, [datePreset]);

    // --- Data Fetching ---
    // Fetch main dashboard data (when date range changes)
    useEffect(() => {
        if (!dateRange.start) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const params = { startDate: dateRange.start, endDate: dateRange.end };

                const [dashRes, custRes, payRes, trendRes] = await Promise.all([
                    services.reports.getDashboardStats(params),
                    services.reports.getCustomerMetrics(params),
                    services.reports.getPaymentMethodStats(params),
                    services.reports.getSalesTrend(params)
                ]);

                setStats(prev => ({
                    ...prev,
                    dashboard: dashRes.data,
                    customers: custRes.data,
                    paymentMethods: payRes.data,
                    salesTrend: trendRes.data
                }));
            } catch (error) {
                console.error("Analytics Error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [dateRange]);

    // Fetch top products separately (when tab or date range changes)
    useEffect(() => {
        if (!dateRange.start) return;

        const fetchTopProducts = async () => {
            try {
                const params = { startDate: dateRange.start, endDate: dateRange.end, groupBy: topProductsTab };
                const prodRes = await services.reports.getTopProducts(params);
                setStats(prev => ({ ...prev, topProducts: prodRes.data }));
            } catch (error) {
                console.error("Top Products Error:", error);
            }
        };

        fetchTopProducts();
    }, [dateRange, topProductsTab]);

    // --- Helpers ---
    const formatCurrency = (val) => `₹${(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    const formatPercent = (val) => `${(val || 0).toFixed(1)}%`;

    // --- Exports ---
    const handleExport = async (type) => {
        const doc = new jsPDF();
        const now = new Date();
        const reportTitle = type === 'summary' ? "Business Performance Summary" : "Detailed Analytics";
        const dateRangeStr = `Analytics Report (${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()})`;

        // --- Header Section ---
        doc.setFontSize(18);
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text(settings.store.name || "Store Analytics", 14, 20);

        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139); // slate-500
        const address = [
            `${settings.store.address?.street || ''} ${settings.store.address?.area || ''}`,
            `${settings.store.address?.city || ''} ${settings.store.address?.state || ''} ${settings.store.address?.pincode || ''}`
        ].filter(s => s.trim()).join(', ');
        doc.text(address, 14, 26);
        doc.text(`GSTIN: ${settings.store.gstin || 'N/A'}`, 14, 31);

        doc.setDrawColor(226, 232, 240); // slate-200
        doc.line(14, 35, 196, 35);

        // --- Report Title & Date ---
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(reportTitle, 14, 45);

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85); // slate-700
        doc.text(dateRangeStr, 14, 52);

        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105); // slate-600
        doc.text(`Exported on: ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`, 14, 58);

        if (type === 'summary') {
            // Capture Owner View Tiles
            if (printRef.current) {
                const canvas = await html2canvas(printRef.current, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff'
                });
                const imgData = canvas.toDataURL('image/png');
                const imgProps = doc.getImageProperties(imgData);
                const pdfWidth = doc.internal.pageSize.getWidth() - 28;
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                doc.addImage(imgData, 'PNG', 14, 65, pdfWidth, pdfHeight);
            }
            doc.save(`Summary_Report_${now.toISOString().split('T')[0]}.pdf`);
        } else if (type === 'detailed') {
            autoTable(doc, {
                startY: 65,
                head: [['Metric', 'Value', 'Previous', 'Change']],
                body: [
                    ['Total Sales', formatCurrency(stats.dashboard.sales.value), formatCurrency(stats.dashboard.sales.prev), formatPercent(stats.dashboard.sales.change)],
                    ['Net Profit', formatCurrency(stats.dashboard.netProfit.value), formatCurrency(stats.dashboard.netProfit.prev), formatPercent(stats.dashboard.netProfit.change)],
                    ['Expenses', formatCurrency(stats.dashboard.expenses.value), formatCurrency(stats.dashboard.expenses.prev), formatPercent(stats.dashboard.expenses.change)],
                    ['Orders', stats.dashboard.orders.value, stats.dashboard.orders.prev, formatPercent(stats.dashboard.orders.change)],
                ],
                headStyles: { fillColor: [79, 70, 229], textColor: 255 }, // indigo-600
                alternateRowStyles: { fillColor: [248, 250, 252] }, // slate-50
                margin: { left: 14, right: 14 }
            });

            doc.save(`Detailed_Report_${now.toISOString().split('T')[0]}.pdf`);
        }
    };

    // --- Components ---

    const StatCard = ({ title, metric, icon: Icon, colorClass, tooltipData }) => {
        const isPositive = metric.change >= 0;
        return (
            <div className="group relative bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-sm font-medium text-slate-500">{title}</p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">{metric.prefix || ''}{typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}</h3>
                    </div>
                    <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10`}>
                        <Icon className={`h-5 w-5 ${colorClass.replace('bg-', 'text-')}`} />
                    </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className={`${isPositive ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-rose-600 bg-rose-50 border-rose-100'} px-1.5 py-0.5 text-xs font-semibold flex items-center`}>
                        {isPositive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                        {Math.abs(metric.change).toFixed(1)}%
                    </Badge>
                    <span className="text-xs text-slate-400">vs prev period</span>
                </div>

                {/* Sparkline (Recharts) */}
                {metric.sparkline && metric.sparkline.length > 0 && (
                    <div className="h-10 w-full opacity-50">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
                            <AreaChart data={metric.sparkline}>
                                <Area type="monotone" dataKey="value" stroke={isPositive ? "#10b981" : "#f43f5e"} fill="transparent" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Tooltip on Hover */}
                {tooltipData && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-xl p-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center border border-slate-200 z-10 pointer-events-none">
                        <p className="text-xs font-bold text-slate-700 uppercase mb-2">Detailed Breakdown</p>
                        {tooltipData.map((t, i) => (
                            <div key={i} className="flex justify-between text-sm py-1 border-b last:border-0 border-slate-100">
                                <span className="text-slate-500">{t.label}</span>
                                <span className="font-medium text-slate-900">{t.value}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const OwnerView = () => (
        <div className="space-y-6" ref={printRef}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Story Tile 1: Growth */}
                <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-lg">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-medium opacity-90 mb-1">Revenue Growth</h3>
                        <p className="text-3xl font-bold mb-4">{stats.dashboard.sales.change > 0 ? '+' : ''}{stats.dashboard.sales.change.toFixed(1)}%</p>
                        <p className="text-sm opacity-80">
                            Compared to last week, you made <strong>{formatCurrency(stats.dashboard.sales.value - stats.dashboard.sales.prev)}</strong> more in revenue.
                        </p>
                    </CardContent>
                </Card>

                {/* Story Tile 2: Profitability */}
                <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none shadow-lg">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-medium opacity-90 mb-1">Net Margin</h3>
                        <p className="text-3xl font-bold mb-4">
                            {stats.dashboard.sales.value > 0
                                ? ((stats.dashboard.netProfit.value / stats.dashboard.sales.value) * 100).toFixed(1)
                                : 0}%
                        </p>
                        <p className="text-sm opacity-80">
                            You kept <strong>{formatCurrency(stats.dashboard.netProfit.value)}</strong> as pure profit after {formatCurrency(stats.dashboard.expenses.value)} in expenses.
                        </p>
                    </CardContent>
                </Card>

                {/* Story Tile 3: Top Performer */}
                <Card className="bg-white border-none shadow-lg">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Top Category</h3>
                        {stats.topProducts.length > 0 ? (
                            <div>
                                <p className="text-2xl font-bold text-indigo-600">{stats.topProducts[0]?.name || 'N/A'}</p>
                                <p className="text-sm text-slate-500 mt-1">{stats.topProducts[0]?.quantity} units sold</p>
                            </div>
                        ) : (
                            <p className="text-slate-400">No data available</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Simplified Trend */}
            <Card>
                <CardHeader><CardTitle>Revenue Trend</CardTitle></CardHeader>
                <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
                        <AreaChart data={stats.salesTrend}>
                            <defs>
                                <linearGradient id="colorSalesOwner" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="date" hide />
                            <Tooltip />
                            <Area type="monotone" dataKey="sales" stroke="#6366f1" fillOpacity={1} fill="url(#colorSalesOwner)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );

    const AnalystView = () => (
        <div className="space-y-6">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Revenue"
                    metric={{ ...stats.dashboard.sales, prefix: '₹' }}
                    icon={IndianRupee}
                    colorClass="bg-indigo-500"
                    tooltipData={[
                        { label: 'Gross Sales', value: formatCurrency(stats.dashboard.sales.value) },
                        { label: 'Discounts', value: formatCurrency(0) }, // Add if available
                        { label: 'Returns', value: formatCurrency(0) }
                    ]}
                />
                <StatCard
                    title="Net Profit"
                    metric={{ ...stats.dashboard.netProfit, prefix: '₹' }}
                    icon={Wallet}
                    colorClass="bg-emerald-500"
                    tooltipData={[
                        { label: 'Margin', value: `${stats.dashboard.sales.value ? ((stats.dashboard.netProfit.value / stats.dashboard.sales.value) * 100).toFixed(1) : 0}%` },
                        { label: 'Profit/Order', value: formatCurrency(stats.dashboard.netProfit.value / (stats.dashboard.orders.value || 1)) }
                    ]}
                />
                <StatCard
                    title="Expenses"
                    metric={{ ...stats.dashboard.expenses, prefix: '₹' }}
                    icon={TrendingDown}
                    colorClass="bg-rose-500"
                />
                <StatCard
                    title="Avg Order Value"
                    metric={{ ...stats.dashboard.aov, prefix: '₹' }}
                    icon={CreditCard}
                    colorClass="bg-amber-500"
                />
            </div>

            {/* Charts Row 1: Trend & Methods */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Revenue & Order Volume</CardTitle>
                        <div className="flex gap-2">
                            <Badge variant="outline" className={`${compare ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'} cursor-pointer`} onClick={() => setCompare(!compare)}>
                                {compare ? 'Comparing...' : 'Compare Period'}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
                            <AreaChart data={stats.salesTrend}>
                                <defs>
                                    <linearGradient id="colSal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                                <YAxis yAxisId="right" orientation="right" hide />
                                <Tooltip />
                                <Area yAxisId="left" type="monotone" dataKey="sales" stroke="#4f46e5" fillOpacity={1} fill="url(#colSal)" />
                                {/* Ghost Line for comparison could be overlaid here if data structure supported it */}
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Payment Methods</CardTitle></CardHeader>
                    <CardContent className="h-80 relative">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
                            <PieChart>
                                <Pie
                                    data={stats.paymentMethods}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    onClick={(data) => setSelectedPaymentMethod(selectedPaymentMethod === data.name ? null : data.name)}
                                >
                                    {stats.paymentMethods.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#f59e0b', '#ef4444'][index % 4]} opacity={selectedPaymentMethod && selectedPaymentMethod !== entry.name ? 0.3 : 1} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                            <span className="text-xs text-slate-500">Total</span>
                            <span className="font-bold text-slate-900">{formatCurrency(stats.dashboard.sales.value)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Row 2: Customer & Quadrant */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Customer Metrics */}
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Users size={16} /> Customer Insights</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex justify-between items-center border-b pb-4">
                            <div>
                                <p className="text-sm text-slate-500">New Customers</p>
                                <p className="text-xl font-bold text-emerald-600">{stats.customers.newCustomers}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-slate-500">Returning</p>
                                <p className="text-xl font-bold text-indigo-600">{stats.customers.returningCustomers}</p>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-slate-500">Repeat Rate</p>
                                <p className="text-lg font-semibold">{stats.customers.repeatRate.toFixed(1)}%</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 text-right">CLV (Est.)</p>
                                <p className="text-lg font-semibold">{formatCurrency(stats.customers.clv)}</p>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-500">
                            <strong>Tip:</strong> Improve CLV by running loyalty campaigns for returning users.
                        </div>
                    </CardContent>
                </Card>

                {/* Quadrant Chart (Revenue vs Margin) - Simplified as Scatter */}
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle>Product Performance Matrix</CardTitle></CardHeader>
                    <CardContent className="h-64">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={150}>
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 30 }}>
                                <CartesianGrid />
                                <XAxis type="number" dataKey="marginPercent" name="Margin" unit="%" domain={[0, 'auto']} label={{ value: 'Margin %', position: 'insideBottom', offset: -10 }} />
                                <YAxis type="number" dataKey="revenue" name="Revenue" unit="₹" label={{ value: 'Revenue', angle: -90, position: 'insideLeft', offset: 10, dx: -10 }} />
                                <ZAxis type="number" dataKey="quantity" range={[60, 400]} name="Quantity" />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                <Scatter name="Products" data={stats.topProducts} fill="#8884d8">
                                    {stats.topProducts.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.marginPercent > 30 ? (entry.revenue > 5000 ? '#10b981' : '#f59e0b') : '#ef4444'} />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Row 3: Top Listings with Tabs */}
            <Card>
                <CardHeader className="border-b bg-slate-50/50 py-3">
                    <div className="flex items-center justify-between">
                        <CardTitle>Top Performers</CardTitle>
                        <div className="flex gap-2">
                            {['product', 'category', 'brand'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setTopProductsTab(tab)}
                                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${topProductsTab === tab ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}s
                                </button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto scrollbar-hide">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3 text-right">Revenue</th>
                                    <th className="px-4 py-3 text-right">Units</th>
                                    <th className="px-4 py-3 text-right">Margin %</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {stats.topProducts.map((p, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(p.revenue)}</td>
                                        <td className="px-4 py-3 text-right">{p.quantity}</td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`px-2 py-0.5 rounded text-xs ${p.marginPercent > 30 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                                {formatPercent(p.marginPercent)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    return (
        <div className="h-[calc(100vh-theme(spacing.16))] overflow-y-auto scrollbar-hide bg-slate-50/30 space-y-6 pb-20">
            {/* Sticky Header */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 -mx-6 px-6 py-4 flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'analyst' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
                            onClick={() => setViewMode('analyst')}
                        >
                            <LineChart className="h-3 w-3 inline mr-1" /> Detailed
                        </button>
                        <button
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'owner' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
                            onClick={() => setViewMode('owner')}
                        >
                            <LayoutDashboard className="h-3 w-3 inline mr-1" /> Owner Summary
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Date Controls */}
                    <select
                        className="bg-slate-50 border border-slate-200 text-sm rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                        value={datePreset}
                        onChange={(e) => setDatePreset(e.target.value)}
                    >
                        <option value="today">Today</option>
                        <option value="yesterday">Yesterday</option>
                        <option value="thisWeek">This Week</option>
                        <option value="lastMonth">Last Month</option>
                        <option value="thisMonth">This Month</option>
                    </select>

                    <Button variant="outline" size="sm" onClick={() => handleExport(viewMode === 'owner' ? 'summary' : 'detailed')}>
                        <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="h-96 flex items-center justify-center text-slate-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
                    Loading analytics...
                </div>
            ) : (
                viewMode === 'owner' ? <OwnerView /> : <AnalystView />
            )}
        </div>
    );
};

export default ReportsPage;
