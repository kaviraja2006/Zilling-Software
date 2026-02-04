import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Search, Plus, FileText, Edit, Paperclip, Trash2, Download, MoreHorizontal, ChevronDown } from 'lucide-react';
import ExpenseModal from './components/ExpenseModal';
import DateRangePicker from '../../components/DateRangePicker/DateRangePicker';
import CategoryFilter from '../../components/CategoryFilter/CategoryFilter';
import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuContent } from '../../components/ui/DropdownMenu';
import { BulkActionsToolbar } from '../../components/Expenses/BulkActionsToolbar';
import { RecurringBadge } from '../../components/Expenses/RecurringBadge';
import { useExpenses } from '../../context/ExpenseContext';
import { exportToCSV } from '../../utils/csvExport';
import { SAMPLE_CATEGORIES } from '../../utils/expenseConstants';

const ExpensesPage = () => {
    const { expenses, deleteExpense, bulkUpdateExpenses, bulkDeleteExpenses, exportToCSV: exportFromAPI, uploadReceipt } = useExpenses();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedExpenses, setSelectedExpenses] = useState([]);
    const [showFilters, setShowFilters] = useState(false);

    // Filter Logic
    const filteredExpenses = expenses.filter(e => {
        // Search filter
        const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (e.paymentMethod && e.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (e.reference && e.reference.toLowerCase().includes(searchTerm.toLowerCase()));

        // Date range filter
        let matchesDateRange = true;
        if (dateRange) {
            const expenseDate = new Date(e.date);
            expenseDate.setHours(0, 0, 0, 0);

            const startDate = new Date(dateRange.startDate);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(dateRange.endDate);
            endDate.setHours(23, 59, 59, 999);

            matchesDateRange = expenseDate >= startDate && expenseDate <= endDate;
        }

        // Category filter
        const matchesCategory = !selectedCategory || e.category === selectedCategory;

        return matchesSearch && matchesDateRange && matchesCategory;
    });

    // Selection handlers
    const toggleSelectAll = () => {
        if (selectedExpenses.length === filteredExpenses.length) {
            setSelectedExpenses([]);
        } else {
            setSelectedExpenses(filteredExpenses.map(e => e.id));
        }
    };

    const toggleSelectExpense = (id) => {
        setSelectedExpenses(prev =>
            prev.includes(id) ? prev.filter(eid => eid !== id) : [...prev, id]
        );
    };

    // Bulk action handlers
    const handleBulkCategoryChange = async (category) => {
        try {
            await bulkUpdateExpenses(selectedExpenses, { category });
            setSelectedExpenses([]);
        } catch (error) {
            alert('Failed to update categories');
        }
    };

    const handleBulkMarkRecurring = async () => {
        const frequency = prompt('Enter frequency (weekly, monthly, quarterly, yearly):');
        if (!frequency || !['weekly', 'monthly', 'quarterly', 'yearly'].includes(frequency.toLowerCase())) {
            alert('Invalid frequency');
            return;
        }

        try {
            await bulkUpdateExpenses(selectedExpenses, {
                isRecurring: true,
                frequency: frequency.toLowerCase()
            });
            setSelectedExpenses([]);
        } catch (error) {
            alert('Failed to mark as recurring');
        }
    };

    const handleBulkExportCSV = () => {
        const selectedExpenseData = expenses.filter(e => selectedExpenses.includes(e.id));
        exportToCSV(selectedExpenseData, `selected-expenses-${Date.now()}.csv`);
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Delete ${selectedExpenses.length} expenses?`)) return;

        try {
            await bulkDeleteExpenses(selectedExpenses);
            setSelectedExpenses([]);
        } catch (error) {
            alert('Failed to delete expenses');
        }
    };

    // Individual action handlers
    const handleEdit = (expense) => {
        setEditingExpense(expense);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this expense?')) return;

        try {
            await deleteExpense(id);
        } catch (error) {
            alert('Failed to delete expense');
        }
    };

    const handleAttachReceipt = async (expenseId) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,.pdf';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    await uploadReceipt(expenseId, file);
                    alert('Receipt uploaded successfully!');
                } catch (error) {
                    console.error('Receipt upload error:', error);
                    alert(`Failed to upload receipt: ${error.message}`);
                }
            }
        };
        input.click();
    };

    const handleExportAll = async () => {
        try {
            await exportFromAPI();
        } catch (error) {
            // Fallback to client-side export
            exportToCSV(filteredExpenses, `expenses-${Date.now()}.csv`);
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingExpense(null);
    };

    // Empty state
    if (expenses.length === 0) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
                    <Button onClick={() => setIsModalOpen(true)} className="bg-red-600 hover:bg-red-700">
                        <Plus className="mr-2 h-4 w-4" /> Add Expense
                    </Button>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
                    <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No expenses yet</h3>
                    <p className="text-slate-600 mb-6 max-w-md mx-auto">
                        Start tracking your business expenses to get better insights into your spending patterns.
                    </p>
                    <Button onClick={() => setIsModalOpen(true)} className="bg-red-600 hover:bg-red-700">
                        <Plus className="mr-2 h-4 w-4" /> Add First Expense
                    </Button>

                    <div className="mt-8 pt-8 border-t border-slate-200">

                        <div className="flex flex-wrap gap-2 justify-center">
                        </div>
                    </div>
                </div>

                <ExpenseModal
                    isOpen={isModalOpen}
                    onClose={handleModalClose}
                    expense={editingExpense}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
                <div className="flex gap-2">
                    <Button
                        onClick={handleExportAll}
                        variant="outline"
                        className="border-slate-300"
                    >
                        <Download className="mr-2 h-4 w-4" /> Export All
                    </Button>
                    <Button onClick={() => setIsModalOpen(true)} className="bg-red-600 hover:bg-red-700">
                        <Plus className="mr-2 h-4 w-4" /> Add Expense
                    </Button>
                </div>
            </div>

            {/* Filters Area */}
            <div className="space-y-4">
                <div className="lg:hidden">
                    <Button
                        variant="outline"
                        className="w-full flex justify-between items-center bg-white border-slate-200"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <span className="flex items-center gap-2"><Search className="h-4 w-4" /> Filters & Search</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </Button>
                </div>

                <div className={`${showFilters ? 'flex' : 'hidden'} lg:flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm transition-all`}>
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Search expenses..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <DateRangePicker
                            value={dateRange}
                            onDateRangeChange={setDateRange}
                        />
                        <CategoryFilter
                            expenses={expenses}
                            value={selectedCategory}
                            onCategoryChange={setSelectedCategory}
                        />
                    </div>
                </div>
            </div>

            {/* Desktop Expenses Table */}
            <div className="hidden md:block rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">
                                    <input
                                        type="checkbox"
                                        checked={selectedExpenses.length === filteredExpenses.length && filteredExpenses.length > 0}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                    />
                                </TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Payment Method</TableHead>
                                <TableHead>Reference</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="w-12 text-center">Receipt</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredExpenses.map((expense) => (
                                <TableRow key={expense.id}>
                                    <TableCell>
                                        <input
                                            type="checkbox"
                                            checked={selectedExpenses.includes(expense.id)}
                                            onChange={() => toggleSelectExpense(expense.id)}
                                            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <span className="font-medium text-slate-900">{expense.title}</span>
                                            {expense.isRecurring && (
                                                <RecurringBadge
                                                    frequency={expense.frequency}
                                                    nextDueDate={expense.nextDueDate}
                                                />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-semibold">
                                            {expense.category}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-slate-500">
                                        {new Date(expense.date).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-slate-600 text-sm">
                                        {expense.paymentMethod || '-'}
                                    </TableCell>
                                    <TableCell className="text-slate-600 text-sm">
                                        {expense.reference || '-'}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-red-600">
                                        -₹{expense.amount.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {expense.receiptUrl ? (
                                            <a
                                                href={expense.receiptUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center p-2 rounded-full hover:bg-blue-50 text-blue-600 transition-colors"
                                                title="View Receipt"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Paperclip className="h-4 w-4" />
                                            </a>
                                        ) : (
                                            <button
                                                className="inline-flex items-center justify-center p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
                                                title="No Receipt Attached"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAttachReceipt(expense.id);
                                                }}
                                            >
                                                <Paperclip className="h-4 w-4 opacity-20" />
                                            </button>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEdit(expense)}>
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    <span>View</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleEdit(expense)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    <span>Edit</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleAttachReceipt(expense.id)}>
                                                    <Paperclip className="mr-2 h-4 w-4" />
                                                    <span>{expense.receiptUrl ? 'Change Receipt' : 'Attach Receipt'}</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(expense.id)}
                                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    <span>Delete</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Mobile Expenses List */}
            <div className="md:hidden space-y-4">
                {filteredExpenses.map((expense) => (
                    <div
                        key={expense.id}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative active:bg-slate-50 transition-colors"
                        onClick={() => handleEdit(expense)}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex gap-2 items-center">
                                <input
                                    type="checkbox"
                                    checked={selectedExpenses.includes(expense.id)}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        toggleSelectExpense(expense.id);
                                    }}
                                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                />
                                <div>
                                    <h3 className="font-bold text-slate-900">{expense.title}</h3>
                                    <p className="text-xs text-slate-500">{new Date(expense.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-red-600">-₹{expense.amount.toFixed(2)}</p>
                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                    {expense.category}
                                </span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-50">
                            <div className="flex gap-2">
                                {expense.receiptUrl && (
                                    <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-100">
                                        <Paperclip className="h-3 w-3 mr-1" /> Receipt
                                    </Badge>
                                )}
                                {expense.isRecurring && (
                                    <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-100">
                                        Recurring
                                    </Badge>
                                )}
                            </div>
                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" onClick={() => handleEdit(expense)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500" onClick={() => handleDelete(expense.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bulk Actions Toolbar */}
            <BulkActionsToolbar
                selectedCount={selectedExpenses.length}
                onClearSelection={() => setSelectedExpenses([])}
                onCategoryChange={handleBulkCategoryChange}
                onMarkRecurring={handleBulkMarkRecurring}
                onExportCSV={handleBulkExportCSV}
                onDelete={handleBulkDelete}
                categories={SAMPLE_CATEGORIES}
            />

            <ExpenseModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                expense={editingExpense}
            />
        </div>
    );
};

export default ExpensesPage;
