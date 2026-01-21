import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { User, Search, Printer, CreditCard, ChevronRight, Users, UserPlus, Calculator } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../../lib/utils';
import CalculatorModal from './CalculatorModal';

const BillingSidebar = ({
    customer,
    onCustomerSearch,
    totals,
    onPaymentChange,
    paymentMode,
    paymentStatus, // New prop
    amountReceived,
    onSavePrint
}) => {
    const currentDate = new Date().toLocaleDateString('en-IN'); // DD/MM/YYYY format
    const [printFormat, setPrintFormat] = useState('80mm');
    const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

    return (
        <div className="w-full lg:w-96 flex flex-col gap-4 h-full">
            {/* Date Block */}
            {/* Date & Calculator Block */}
            <div className="flex gap-2">
                <Card className="flex-1 p-3 bg-white shadow-sm border rounded-lg flex justify-center items-center">
                    <span className="text-sm font-bold text-slate-700">{currentDate}</span>
                </Card>
                <Button
                    className="px-4 py-3 bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700 hover:text-blue-600 shadow-sm rounded-lg flex items-center justify-center gap-2 transition-all font-medium min-w-[100px]"
                    onClick={() => setIsCalculatorOpen(true)}
                    title="Open Calculator"
                >
                    <Calculator size={18} />
                    <span>Calc</span>
                </Button>
            </div>

            <CalculatorModal
                isOpen={isCalculatorOpen}
                onClose={() => setIsCalculatorOpen(false)}
            />

            {/* Customer Search Block */}
            <div className="relative">
                <Input
                    placeholder="Search for a customer by name, phone [F11]"
                    className="pl-4 pr-10 py-5 border-blue-200 focus:border-blue-500 shadow-sm"
                    value={customer ? (customer.fullName || customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim()) : ''}
                    readOnly={true}
                    onClick={() => onCustomerSearch('search')}
                />
                {customer ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-red-500"
                        onClick={(e) => {
                            e.stopPropagation();
                            onCustomerSearch(null); // Clear logic
                        }}
                    >
                        X
                    </Button>
                ) : (
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                )}
            </div>

            {/* Totals Block */}
            {/* Totals Block */}
            <Card className="p-4 bg-white border-blue-100 shadow-sm">
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-slate-600">
                        <span>Subtotal</span>
                        <span>₹ {(totals.grossTotal || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                        <span>Item Discount</span>
                        <span>- ₹ {(totals.itemDiscount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                        <span>Bill Discount</span>
                        <span>- ₹ {(totals.discount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                        <span>Tax</span>
                        <span>₹ {(totals.tax || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                        <span>Rounding</span>
                        <span>₹ {(totals.roundOff || 0).toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2 mt-2 flex justify-between items-end">
                        <span className="font-bold text-slate-900 text-lg">Grand Total</span>
                        <span className="font-bold text-slate-900 text-2xl">₹ {totals.total.toFixed(2)}</span>
                    </div>
                </div>
            </Card>

            {/* Payment Block */}
            <Card className="p-4 bg-white shadow-sm flex-1 flex flex-col gap-4">
                {/* Payment Status & Mode */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500">Payment Status</label>
                        <select
                            className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-blue-500 focus:outline-none"
                            value={paymentStatus}
                            onChange={(e) => onPaymentChange('status', e.target.value)}
                        >
                            <option value="Paid">Paid</option>
                            <option value="Unpaid">Unpaid</option>
                            <option value="Partially Paid">Partially Paid</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500">Payment Mode</label>
                        <select
                            className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-blue-500 focus:outline-none"
                            value={paymentMode}
                            onChange={(e) => onPaymentChange('mode', e.target.value)}
                        >
                            <option value="Cash">Cash</option>
                            <option value="UPI">UPI</option>
                            <option value="Card">Card</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Cheque">Cheque</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Amount Received</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                        <Input
                            value={amountReceived || ''}
                            onChange={(e) => onPaymentChange('amount', e.target.value)}
                            disabled={paymentStatus !== 'Partially Paid'}
                            className={`pl-6 text-right font-bold ${paymentStatus !== 'Partially Paid' ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                        />
                    </div>
                </div>

                <div className="mt-auto pt-4 border-t space-y-2">
                    {/* Amount Actually Paid Display */}
                    <div className="flex justify-between items-end text-emerald-700">
                        <div className="text-sm font-semibold">Amount Paid:</div>
                        <div className="text-lg font-bold">
                            ₹ {paymentStatus === 'Paid' ? totals.total.toFixed(2) : (parseFloat(amountReceived) || 0).toFixed(2)}
                        </div>
                    </div>

                    {/* Balance Due / Change Logic */}
                    {Math.max(0, totals.total - (parseFloat(amountReceived) || 0)) > 0 && paymentStatus !== 'Paid' ? (
                        <div className="flex justify-between items-end text-rose-600">
                            <div className="text-sm font-semibold">Balance Due:</div>
                            <div className="text-xl font-bold">
                                ₹ {paymentStatus === 'Unpaid' ? totals.total.toFixed(2) : (Math.max(0, totals.total - (parseFloat(amountReceived) || 0))).toFixed(2)}
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-between items-end text-slate-700">
                            <div className="text-sm font-semibold">Change to Return:</div>
                            <div className="text-xl font-bold">
                                ₹ {(Math.max(0, (parseFloat(amountReceived) || 0) - totals.total)).toFixed(2)}
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                    <div className="relative w-1/3">
                        <select
                            value={printFormat}
                            onChange={(e) => setPrintFormat(e.target.value)}
                            className="w-full h-12 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                        >
                            <optgroup label="Thermal">
                                <option value="80mm">80mm</option>
                                <option value="58mm">58mm</option>
                                <option value="112mm">112mm</option>
                            </optgroup>
                            <optgroup label="Sheet">
                                <option value="A4">A4 Invoice</option>
                                <option value="A5">A5 Invoice</option>
                            </optgroup>
                        </select>
                        <Printer size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    </div>
                    <Button
                        className="w-2/3 h-12 bg-green-200 text-green-800 hover:bg-green-300 border border-green-300 font-bold text-lg shadow-sm"
                        onClick={() => onSavePrint(printFormat)}
                    >
                        Save & Print
                    </Button>
                </div>
                <Button
                    variant="outline"
                    className="w-full h-10 text-slate-600 font-medium"
                >
                    Other/Credit Payments [Ctrl+M]
                </Button>
            </div>
        </div>
    );
};

export default BillingSidebar;
