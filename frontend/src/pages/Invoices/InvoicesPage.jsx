import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Search, Filter, Eye, Download, Trash2, Calendar, MoreHorizontal, Lock, FileText, CheckCircle, XCircle, Printer, CreditCard, Save, X, RotateCcw, BarChart3, Columns, Mail, ChevronDown } from 'lucide-react';
import services from '../../services/api';
import InvoiceDetailsModal from './InvoiceDetailsModal';
import { utils, writeFile } from 'xlsx';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem } from '../../components/ui/DropdownMenu';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useProducts } from '../../context/ProductContext';
import { useCustomers } from '../../context/CustomerContext';

const InvoicesPage = () => {
    // --- State ---
    const [invoices, setInvoices] = useState([]);
    const [stats, setStats] = useState({
        summary: { totalSales: 0, totalInvoices: 0, avgOrderValue: 0, outstandingAmount: 0 },
        byMethod: []
    });
    const [isLoading, setIsLoading] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isMounted, setIsMounted] = useState(false);
    const { refreshProducts } = useProducts();
    const { refreshCustomers } = useCustomers();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Advanced Features State
    const [savedViews, setSavedViews] = useState([]);
    const [currentViewName, setCurrentViewName] = useState('');
    const [showSaveViewInput, setShowSaveViewInput] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState({
        id: true, date: true, customer: true, type: false, amount: true, balance: true, status: true, method: true, tax: false, discount: false, cashier: false, actions: true
    });

    // Filters
    const [filters, setFilters] = useState({
        search: '',
        dateRange: 'all',
        startDate: '',
        endDate: '',
        status: [],
        paymentMethod: 'All',
        minAmount: '',
        maxAmount: ''
    });

    // --- Effects ---

    // Load saved views from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem('invoiceSavedViews');
        if (saved) {
            try { setSavedViews(JSON.parse(saved)); } catch (e) { console.error("Failed to load saved views"); }
        }
    }, []);

    // --- Helpers ---

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Partially Paid': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Unpaid': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Cancelled': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'Refunded': return 'bg-purple-100 text-purple-700 border-purple-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'Retail': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'Tax': return 'text-purple-600 bg-purple-50 border-purple-200';
            case 'Estimate': return 'text-amber-600 bg-amber-50 border-amber-200';
            default: return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    // --- Fetch Data ---

    const fetchInvoices = useCallback(async () => {
        setIsLoading(true);
        try {
            let start = filters.startDate;
            let end = filters.endDate;
            const now = new Date();

            if (filters.dateRange === 'today') {
                const s = new Date(); s.setHours(0, 0, 0, 0);
                const e = new Date(); e.setHours(23, 59, 59, 999);
                start = s.toISOString(); end = e.toISOString();
            } else if (filters.dateRange === 'week') {
                const s = new Date();
                const day = s.getDay();
                const diff = s.getDate() - day + (day === 0 ? -6 : 1);
                s.setDate(diff); s.setHours(0, 0, 0, 0);
                const e = new Date(); e.setHours(23, 59, 59, 999);
                start = s.toISOString(); end = e.toISOString();
            } else if (filters.dateRange === 'month') {
                const s = new Date(now.getFullYear(), now.getMonth(), 1);
                const e = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                start = s.toISOString(); end = e.toISOString();
            }

            const params = {
                page: pagination.page,
                limit: 50,
                search: filters.search,
                startDate: start,
                endDate: end,
                status: filters.status.length > 0 ? filters.status.join(',') : undefined,
                paymentMethod: filters.paymentMethod,
                minAmount: filters.minAmount,
                maxAmount: filters.maxAmount
            };

            const [invRes, statsRes] = await Promise.all([
                services.invoices.getAll(params),
                services.invoices.getStats(params)
            ]);

            setInvoices(invRes.data.data);
            setPagination({
                page: invRes.data.page,
                pages: invRes.data.pages,
                total: invRes.data.total
            });
            setStats(statsRes.data);

        } catch (error) {
            console.error("Failed to fetch invoices", error);
        } finally {
            setIsLoading(false);
        }
    }, [filters, pagination.page, refreshTrigger]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchInvoices();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchInvoices]);

    // --- Handlers ---

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const toggleStatusFilter = (status) => {
        setFilters(prev => {
            const current = prev.status;
            if (current.includes(status)) return { ...prev, status: current.filter(s => s !== status) };
            else return { ...prev, status: [...current, status] };
        });
    };

    const toggleColumn = (col) => {
        setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
    };

    const saveView = () => {
        if (!currentViewName.trim()) return;
        const newView = { name: currentViewName, filters: { ...filters } };
        const updatedViews = [...savedViews, newView];
        setSavedViews(updatedViews);
        localStorage.setItem('invoiceSavedViews', JSON.stringify(updatedViews));
        setCurrentViewName('');
        setShowSaveViewInput(false);
    };

    const loadView = (view) => {
        setFilters(view.filters);
    };

    const deleteView = (index) => {
        const updated = savedViews.filter((_, i) => i !== index);
        setSavedViews(updated);
        localStorage.setItem('invoiceSavedViews', JSON.stringify(updated));
    };

    const handleBulkAction = async (action) => {
        if (!selectedIds.length) return;
        if (!window.confirm(`Perform '${action}' on ${selectedIds.length} invoices?`)) return;

        try {
            if (action === 'delete') {
                if (services.invoices.bulkDelete) {
                    await services.invoices.bulkDelete(selectedIds);
                } else {
                    await Promise.all(selectedIds.map(id => services.invoices.delete(id)));
                }
                setRefreshTrigger(prev => prev + 1);
                setSelectedIds([]);
                // Sync other contexts
                refreshProducts();
                refreshCustomers();
            } else if (action === 'markPaid') {
                // Assuming backend supports this or looping
                // Since bulkUpdate isn't explicit, we loop for now
                await Promise.all(
                    selectedIds.filter(id => {
                        const inv = invoices.find(i => i.id === id);
                        return inv && inv.status !== 'Paid';
                    }).map(id => services.invoices.update(id, { status: 'Paid', paymentStatus: 'Paid', balance: 0 }))
                );
                setRefreshTrigger(prev => prev + 1);
                setSelectedIds([]);
            } else if (action === 'resend') {
                // Placeholder for resend
                alert("Invoices queued for resending.");
                setSelectedIds([]);
            }
        } catch (error) {
            console.error("Bulk action failed", error);
            alert("Failed to perform bulk action");
        }
    };

    const handleExport = () => {
        const dataToExport = invoices.map(t => ({
            InvoiceID: t.invoiceNumber || t.id,
            Date: new Date(t.date).toLocaleDateString(),
            Customer: t.customerName,
            Type: t.type,
            Subtotal: t.subtotal,
            Tax: t.tax,
            Discount: t.discount,
            Total: t.total,
            Balance: t.balance,
            Status: t.status,
            Method: t.paymentMethod,
            Cashier: t.cashierName,
            Notes: t.internalNotes || ''
        }));
        const ws = utils.json_to_sheet(dataToExport);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Invoices_Audit");
        writeFile(wb, `Invoices_Audit_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleRestApiAction = async (action, id, data = {}) => {
        try {
            if (action === 'delete') await services.invoices.delete(id);
            if (action === 'update') await services.invoices.update(id, data);
            setRefreshTrigger(prev => prev + 1);
            // Sync other contexts
            refreshProducts();
            refreshCustomers();

            if (selectedInvoice && selectedInvoice.id === id) {
                if (action === 'delete') setSelectedInvoice(null);
                else setSelectedInvoice({ ...selectedInvoice, ...data }); // Optimistic update
            }
        } catch (e) {
            alert(`Failed to ${action} invoice`);
        }
    };

    // --- Render ---

    const renderChart = () => {
        const data = stats.byMethod || [];
        const trendData = stats.salesByDate?.map(item => ({
            name: new Date(item._id).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
            sales: item.sales
        })) || [];

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card className="border-none shadow-sm overflow-hidden bg-white">
                    <CardContent className="p-4 h-[220px] md:h-[280px] flex flex-col">
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-3 tracking-wider">Sales Trend</p>
                        <div className="flex-grow w-full min-h-0 relative">
                            {isMounted && (
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                    <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="name" 
                                        tick={{ fontSize: 10, fill: '#94a3b8' }} 
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis hide />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                                </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm overflow-hidden bg-white">
                    <CardContent className="p-4 h-[220px] md:h-[280px] flex flex-col">
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-3 tracking-wider">Payment Methods</p>
                        <div className="flex-grow w-full min-h-0 relative">
                            {isMounted && (
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                    <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="_id" 
                                        tick={{ fontSize: 10, fill: '#94a3b8' }} 
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip 
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="totalAmount" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={32} />
                                </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    return (
        <div className="space-y-6 relative min-h-screen pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">Invoices</h1>
                    <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar pb-1 snap-x">
                        <span className="shrink-0 text-[10px] md:text-sm font-semibold text-slate-500 px-2 py-1 bg-slate-100 rounded-lg border border-slate-200 snap-start">
                            Total: {stats.summary.totalInvoices}
                        </span>
                        <span className="shrink-0 text-[10px] md:text-sm font-bold text-emerald-600 px-2 py-1 bg-emerald-50 rounded-lg border border-emerald-100 snap-start">
                            Sales: ₹{stats.summary.totalSales.toLocaleString()}
                        </span>
                        <span className="shrink-0 text-[10px] md:text-sm font-bold text-amber-600 px-2 py-1 bg-amber-50 rounded-lg border border-amber-100 snap-start">
                            Due: ₹{stats.summary.outstandingAmount.toLocaleString()}
                        </span>
                    </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="flex-1 md:flex-none h-10">
                                <Columns className="mr-2 h-4 w-4" /> Columns
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {Object.keys(visibleColumns).map(col => (
                                <DropdownMenuCheckboxItem
                                    key={col}
                                    checked={visibleColumns[col]}
                                    onCheckedChange={() => toggleColumn(col)}
                                >
                                    {col.charAt(0).toUpperCase() + col.slice(1)}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" className="flex-1 md:flex-none h-10" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                </div>
            </div>

            {/* Quick Tabs & Saved Views */}
            <div className="flex justify-between items-center border-b border-slate-200">
                <div className="flex gap-1 overflow-x-auto pb-2 no-scrollbar snap-x">
                    {[
                        { label: 'All Invoices', id: 'all' },
                        { label: 'Today', id: 'today' },
                        { label: 'Unpaid', id: 'unpaid', filter: { status: ['Unpaid', 'Partially Paid'] } },
                        { label: 'Cancelled', id: 'cancelled', filter: { status: ['Cancelled'] } }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                if (tab.id === 'unpaid') setFilters(prev => ({ ...prev, dateRange: 'all', status: ['Unpaid', 'Partially Paid'] }));
                                else if (tab.id === 'cancelled') setFilters(prev => ({ ...prev, dateRange: 'all', status: ['Cancelled'] }));
                                else setFilters(prev => ({ ...prev, dateRange: tab.id, status: [] }));
                            }}
                            className={`px-4 py-2 text-sm font-semibold whitespace-nowrap rounded-t-lg transition-all border-b-2 snap-start
                                ${(filters.dateRange === tab.id && (!tab.filter || JSON.stringify(filters.status) === JSON.stringify(tab.filter.status)))
                                    ? 'border-primary-main text-primary-main bg-primary-50/50'
                                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                    {savedViews.map((view, index) => (
                        <div key={index} className="group flex items-center bg-slate-100 rounded-t-lg border-b-2 border-transparent hover:bg-slate-200 snap-start">
                            <button
                                onClick={() => loadView(view)}
                                className="px-3 py-2 text-sm font-semibold text-slate-600 whitespace-nowrap"
                            >
                                {view.name}
                            </button>
                            <button onClick={() => deleteView(index)} className="pr-2 text-slate-400 hover:text-rose-500 opacity-100 transition-opacity">
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="pb-2 border-b-2 border-transparent">
                    <Button variant="ghost" size="sm" className="h-8 text-[11px] md:text-sm" onClick={() => setShowSaveViewInput(!showSaveViewInput)}>
                        <Save size={14} className="mr-1 hidden sm:inline" /> Save View
                    </Button>
                </div>
            </div>

            {/* Save View Input */}
            {showSaveViewInput && (
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-md border transform transition-all animate-in slide-in-from-top-2">
                    <Input
                        placeholder="View Name (e.g. 'UPI Sales')"
                        className="h-8 text-sm"
                        value={currentViewName}
                        onChange={e => setCurrentViewName(e.target.value)}
                    />
                    <Button size="sm" onClick={saveView}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowSaveViewInput(false)}><X size={14} /></Button>
                </div>
            )}

            {renderChart()}

            {/* Main Content Area */}
            <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6">

                {/* Left Filter Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Filter Button (Mobile Only) */}
                    <div className="lg:hidden">
                        <Button
                            variant="outline"
                            className="w-full flex justify-between items-center bg-white border-slate-200 shadow-sm"
                            onClick={() => {
                                const el = document.getElementById('filter-section');
                                el.classList.toggle('hidden');
                                if (!el.classList.contains('hidden')) {
                                    el.scrollIntoView({ behavior: 'smooth' });
                                }
                            }}
                        >
                            <span className="flex items-center gap-2"><Filter className="h-4 w-4 text-primary-main" /> Filters & Search</span>
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                        </Button>
                    </div>

                    <Card id="filter-section" className="hidden lg:block sticky top-6">
                        <CardHeader className="pb-3 px-4">
                            <CardTitle className="text-base flex items-center justify-between">
                                <span className="flex items-center gap-2"><Filter className="h-4 w-4" /> Filters</span>
                                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setFilters({ search: '', dateRange: 'all', startDate: '', endDate: '', status: [], paymentMethod: 'All', minAmount: '', maxAmount: '' })}>
                                    <RotateCcw size={12} className="mr-1" /> Reset
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Search */}
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Search</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="ID, Name..."
                                        className="pl-9 bg-slate-50"
                                        value={filters.search}
                                        onChange={(e) => handleFilterChange('search', e.target.value)}
                                    />
                                </div>
                                {/* Advanced Search Chips */}
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {['ID', 'Customer', 'SKU'].map(chip => (
                                        <Badge
                                            key={chip}
                                            variant="outline"
                                            className="text-[10px] cursor-pointer hover:bg-slate-100 text-slate-500"
                                            onClick={() => document.querySelector('input[placeholder="ID, Name..."]').focus()}
                                        >
                                            {chip}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* Date Custom */}
                            {filters.dateRange === 'custom' && (
                                <div className="grid grid-cols-2 gap-2 animate-in slide-in-from-top-2">
                                    <div>
                                        <label className="text-xs text-slate-500">Start</label>
                                        <Input type="date" value={filters.startDate} onChange={e => handleFilterChange('startDate', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500">End</label>
                                        <Input type="date" value={filters.endDate} onChange={e => handleFilterChange('endDate', e.target.value)} />
                                    </div>
                                </div>
                            )}
                            {filters.dateRange !== 'custom' && (
                                <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-8" onClick={() => handleFilterChange('dateRange', 'custom')}>
                                    <Calendar className="mr-2 h-3 w-3" /> Custom Date Range
                                </Button>
                            )}

                            {/* Status */}
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-2 block">Status</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Paid', 'Unpaid', 'Partially Paid', 'Cancelled', 'Refunded'].map(status => (
                                        <Badge
                                            key={status}
                                            variant="outline"
                                            className={`cursor-pointer transition-all ${filters.status.includes(status) ? 'bg-primary-main text-white border-primary-main' : 'hover:bg-slate-100'}`}
                                            onClick={() => toggleStatusFilter(status)}
                                        >
                                            {status}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Payment Method</label>
                                <select
                                    className="w-full border rounded-md p-2 text-sm bg-slate-50"
                                    value={filters.paymentMethod}
                                    onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                                >
                                    <option value="All">All Methods</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Card">Card</option>
                                    <option value="UPI">UPI</option>
                                </select>
                            </div>

                            {/* Amount Range */}
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Amount Range</label>
                                <div className="flex gap-2 items-center">
                                    <Input
                                        placeholder="Min"
                                        type="number"
                                        className="h-8 text-xs bg-slate-50"
                                        value={filters.minAmount}
                                        onChange={e => handleFilterChange('minAmount', e.target.value)}
                                    />
                                    <span className="text-slate-400">-</span>
                                    <Input
                                        placeholder="Max"
                                        type="number"
                                        className="h-8 text-xs bg-slate-50"
                                        value={filters.maxAmount}
                                        onChange={e => handleFilterChange('maxAmount', e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Table Area */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Bulk Selection Bar */}
                    {selectedIds.length > 0 && (
                        <div className="bg-slate-900 text-white px-3 md:px-4 py-3 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3 shadow-xl animate-in slide-in-from-bottom-5 sticky top-4 md:top-6 z-30 mx-2 md:mx-0">
                            <div className="flex items-center justify-between w-full md:w-auto">
                                <span className="text-sm font-semibold bg-primary-main/20 text-primary-light px-2 py-0.5 rounded mr-2">{selectedIds.length}</span>
                                <span className="text-sm font-medium">Invoices Selected</span>
                                <Button size="sm" variant="ghost" className="md:hidden h-8 text-white/60 hover:text-white" onClick={() => setSelectedIds([])}>
                                    <X size={14} />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-1 md:gap-2 items-center justify-center md:justify-end w-full md:w-auto">
                                <Button size="sm" variant="ghost" className="hidden md:flex h-9 text-white font-bold hover:bg-slate-800" onClick={() => setSelectedIds([])}>
                                    Clear
                                </Button>
                                <div className="hidden md:block h-6 w-px bg-slate-700 mx-1"></div>
                                <Button size="sm" variant="ghost" className="h-9 md:h-8 flex-1 md:flex-none text-white font-bold hover:bg-slate-800 border border-slate-700 md:border-none" onClick={() => handleBulkAction('markPaid')}>
                                    <CheckCircle className="mr-1.5 h-4 w-4 text-emerald-400" /> Paid
                                </Button>
                                <Button size="sm" variant="ghost" className="h-9 md:h-8 flex-1 md:flex-none text-white font-bold hover:bg-slate-800 border border-slate-700 md:border-none" onClick={() => handleBulkAction('resend')}>
                                    <Mail className="mr-1.5 h-4 w-4 text-indigo-400" /> Mail
                                </Button>
                                <Button size="sm" variant="ghost" className="h-9 md:h-8 flex-1 md:flex-none text-white font-bold hover:bg-slate-800 border border-slate-700 md:border-none" onClick={handleExport}>
                                    <Download className="mr-1.5 h-4 w-4 text-slate-400" /> PDF
                                </Button>
                                <Button size="sm" variant="ghost" className="h-9 md:h-8 flex-1 md:flex-none text-rose-300 font-bold hover:bg-rose-900/30 border border-rose-900/50 md:border-none" onClick={() => handleBulkAction('delete')}>
                                    <Trash2 className="mr-1.5 h-4 w-4" /> Del
                                </Button>
                            </div>
                        </div>
                    )}

                    <Card className="min-h-[600px] md:min-h-0 border-none shadow-sm md:shadow-none bg-transparent md:bg-white overflow-hidden">
                        <CardContent className="p-0">
                            {/* Desktop Table View */}
                            <div className="hidden md:block rounded-xl border border-slate-200 overflow-x-auto bg-white">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                            <TableHead className="w-[40px]">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-slate-300"
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedIds(invoices.map(i => i.id));
                                                        else setSelectedIds([]);
                                                    }}
                                                    checked={selectedIds.length === invoices.length && invoices.length > 0}
                                                />
                                            </TableHead>
                                            {visibleColumns.id && <TableHead>Invoice ID</TableHead>}
                                            {visibleColumns.date && <TableHead>Date</TableHead>}
                                            {visibleColumns.customer && <TableHead>Customer</TableHead>}
                                            {visibleColumns.type && <TableHead>Type</TableHead>}
                                            {visibleColumns.cashier && <TableHead>Cashier</TableHead>}
                                            {visibleColumns.amount && <TableHead className="text-right">Amount</TableHead>}
                                            {visibleColumns.tax && <TableHead className="text-right">Tax</TableHead>}
                                            {visibleColumns.discount && <TableHead className="text-right">Disc</TableHead>}
                                            {visibleColumns.balance && <TableHead className="text-right">Balance</TableHead>}
                                            {visibleColumns.status && <TableHead className="text-center">Status</TableHead>}
                                            {visibleColumns.method && <TableHead>Method</TableHead>}
                                            {visibleColumns.actions && <TableHead className="text-right">Actions</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            [...Array(5)].map((_, i) => (
                                                <TableRow key={i}>
                                                    <TableCell colSpan={12} className="h-16 animate-pulse bg-slate-50/50"></TableCell>
                                                </TableRow>
                                            ))
                                        ) : invoices.length > 0 ? (
                                            invoices.map((invoice) => (
                                                <TableRow
                                                    key={invoice.id}
                                                    className={`cursor-pointer transition-colors ${selectedInvoice?.id === invoice.id ? 'bg-blue-50/60' : 'hover:bg-slate-50'} ${invoice.status === 'Cancelled' ? 'opacity-60 bg-slate-50' : ''}`}
                                                    onClick={() => setSelectedInvoice(invoice)}
                                                >
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            type="checkbox"
                                                            className="rounded border-slate-300"
                                                            checked={selectedIds.includes(invoice.id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setSelectedIds(prev => [...prev, invoice.id]);
                                                                else setSelectedIds(prev => prev.filter(id => id !== invoice.id));
                                                            }}
                                                        />
                                                    </TableCell>
                                                    {visibleColumns.id && (
                                                        <TableCell className="font-medium text-blue-600">
                                                            {invoice.invoiceNumber || invoice.id.slice(-6).toUpperCase()}
                                                            {invoice.isLocked && <Lock className="inline ml-1 h-3 w-3 text-slate-400" />}
                                                        </TableCell>
                                                    )}
                                                    {visibleColumns.date && <TableCell className="text-slate-500 text-sm">{new Date(invoice.date).toLocaleDateString()}</TableCell>}
                                                    {visibleColumns.customer && <TableCell className="font-medium text-slate-800">{invoice.customerName}</TableCell>}
                                                    {visibleColumns.type && (
                                                        <TableCell>
                                                            <Badge variant="outline" className={`font-normal ${getTypeColor(invoice.type)}`}>
                                                                {invoice.type || 'Retail'}
                                                            </Badge>
                                                        </TableCell>
                                                    )}
                                                    {visibleColumns.cashier && <TableCell className="text-slate-500 text-xs">{invoice.cashierName || 'Sys'}</TableCell>}
                                                    {visibleColumns.amount && <TableCell className="text-right font-bold text-slate-900">₹{(invoice.total || 0).toFixed(2)}</TableCell>}
                                                    {visibleColumns.tax && <TableCell className="text-right text-slate-500 text-sm">₹{invoice.tax?.toFixed(2) || 0}</TableCell>}
                                                    {visibleColumns.discount && <TableCell className="text-right text-slate-500 text-sm">₹{invoice.discount?.toFixed(2) || 0}</TableCell>}
                                                    {visibleColumns.balance && (
                                                        <TableCell className="text-right">
                                                            {invoice.balance > 0 ? <span className="text-rose-500 font-medium">₹{invoice.balance.toFixed(2)}</span> : <span className="text-slate-400">-</span>}
                                                        </TableCell>
                                                    )}
                                                    {visibleColumns.status && (
                                                        <TableCell className="text-center">
                                                            <Badge className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(invoice.status)}`}>
                                                                {invoice.status}
                                                            </Badge>
                                                        </TableCell>
                                                    )}
                                                    {visibleColumns.method && <TableCell className="text-slate-600 text-sm">{invoice.paymentMethod}</TableCell>}
                                                    {visibleColumns.actions && (
                                                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                                                                        <MoreHorizontal size={16} />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-48 bg-white z-50">
                                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                    <DropdownMenuItem onClick={() => setSelectedInvoice(invoice)}>
                                                                        <Eye className="mr-2 h-4 w-4" /> View Details
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => { setIsModalOpen(true); setSelectedInvoice(invoice); }}>
                                                                        <Printer className="mr-2 h-4 w-4" /> Print Receipt
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => alert("Email functionality pending")}>
                                                                        <Mail className="mr-2 h-4 w-4" /> Send Email
                                                                    </DropdownMenuItem>
                                                                    {invoice.balance > 0 && (
                                                                        <DropdownMenuItem onClick={() => { }}>
                                                                            <CreditCard className="mr-2 h-4 w-4" /> Add Payment
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem className="text-rose-600" onClick={(e) => handleRestApiAction('delete', invoice.id)}>
                                                                        <Trash2 className="mr-2 h-4 w-4" /> Cancel/Delete
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={12} className="text-center py-12 text-slate-500">
                                                    No invoices found. Try adjusting filters.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile Invoices List */}
                            <div className="md:hidden space-y-4 pt-4">
                                {isLoading ? (
                                    <div className="text-center py-10 text-slate-500">Loading invoices...</div>
                                ) : invoices.length > 0 ? (
                                    invoices.map((invoice) => (
                                        <div 
                                            key={invoice.id} 
                                            className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm active:bg-slate-50 relative ${invoice.status === 'Cancelled' ? 'opacity-60' : ''}`}
                                            onClick={() => setSelectedInvoice(invoice)}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <span className="text-xs font-mono text-slate-500">{invoice.invoiceNumber || invoice.id.slice(-6).toUpperCase()}</span>
                                                    <h3 className="font-bold text-slate-900">{invoice.customerName}</h3>
                                                </div>
                                                <Badge className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusStyle(invoice.status)}`}>
                                                    {invoice.status}
                                                </Badge>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <div className="text-xs text-slate-500">
                                                    <Calendar className="inline h-3 w-3 mr-1" />
                                                    {new Date(invoice.date).toLocaleDateString()}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total</p>
                                                    <p className="font-bold text-slate-900">₹{(invoice.total || 0).toFixed(2)}</p>
                                                </div>
                                            </div>
                                            {invoice.balance > 0 && (
                                                <div className="mt-2 pt-2 border-t border-slate-50 flex justify-between items-center">
                                                    <span className="text-[10px] text-rose-500 font-bold uppercase">Balance Due</span>
                                                    <span className="text-sm font-bold text-rose-600">₹{invoice.balance.toFixed(2)}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 text-slate-500">No invoices found.</div>
                                )}
                            </div>

                            {/* Pagination */}
                            {pagination.pages > 1 && (
                                <div className="flex items-center justify-between px-2 py-4">
                                    <div className="text-sm text-slate-500">
                                        Page {pagination.page} of {pagination.pages} ({pagination.total} items)
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={pagination.page === 1}
                                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={pagination.page === pagination.pages}
                                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Side Panel (Enhanced Drawer) */}
            {selectedInvoice && (
                <>
                    {/* Backdrop for mobile */}
                    <div 
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm md:hidden z-[55] animate-in fade-in" 
                        onClick={() => setSelectedInvoice(null)}
                    />
                    <div className="w-full md:w-[400px] xl:w-[450px] bg-white h-full overflow-y-auto fixed right-0 top-0 z-[60] shadow-2xl transition-all animate-in slide-in-from-right duration-300">
                        <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 p-4 border-b border-slate-100 flex justify-between items-center">
                        <div className="flex-1">
                            <h2 className="text-lg font-bold text-slate-900 leading-tight">
                                Invoice #{selectedInvoice.invoiceNumber || selectedInvoice.id.slice(-6).toUpperCase()}
                            </h2>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">{new Date(selectedInvoice.date).toLocaleString()}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="shrink-0 rounded-full hover:bg-slate-100" onClick={() => setSelectedInvoice(null)}>
                            <X className="h-5 w-5 text-slate-400" />
                        </Button>
                    </div>

                    <div className="space-y-6">
                        {/* Status Box */}
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-slate-500">Status</span>
                                <Badge className={getStatusStyle(selectedInvoice.status)}>{selectedInvoice.status}</Badge>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-slate-500">Total Amount</span>
                                <span className="text-lg font-bold text-slate-900">₹{(selectedInvoice.total || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-slate-500">Balance Due</span>
                                <span className="text-sm font-bold text-rose-600">₹{selectedInvoice.balance ? selectedInvoice.balance.toFixed(2) : '0.00'}</span>
                            </div>
                        </div>

                        {/* Actions Grid */}
                        <div className="grid grid-cols-2 gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="col-span-2 w-full py-3 text-base font-semibold" 
                                onClick={() => setIsModalOpen(true)}
                            >
                                <Printer className="mr-2 h-4 w-4" /> Print
                            </Button>
                            {selectedInvoice.status !== 'Paid' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="col-span-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                    onClick={() => handleRestApiAction('update', selectedInvoice.id, { status: 'Paid', balance: 0 })}
                                >
                                    <CheckCircle className="mr-2 h-3 w-3" /> Mark Fully Paid
                                </Button>
                            )}
                        </div>

                        {/* Customer */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900 mb-2">Customer Details</h3>
                            <div className="bg-white p-3 border rounded-md">
                                <p className="font-medium text-slate-800">{selectedInvoice.customerName}</p>
                            </div>
                        </div>

                        {/* Items */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900 mb-2">Line Items</h3>
                            <div className="border rounded-md overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-medium text-slate-600">Item</th>
                                            <th className="px-3 py-2 text-right font-medium text-slate-600">Qty</th>
                                            <th className="px-3 py-2 text-right font-medium text-slate-600">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                                            selectedInvoice.items.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="px-3 py-2 text-left text-slate-800">{item.name}</td>
                                                    <td className="px-3 py-2 text-right text-slate-600">{item.quantity}</td>
                                                    <td className="px-3 py-2 text-right text-slate-900 font-medium">₹{(item.total || 0).toFixed(2)}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan={3} className="px-3 py-4 text-center text-slate-500 italic">No items found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>
                </>
            )}

            <InvoiceDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                invoice={selectedInvoice}
            />
        </div>
    );
};

export default InvoicesPage;
