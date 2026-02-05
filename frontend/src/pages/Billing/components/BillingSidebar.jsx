import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Phone, User, MessageCircle, Mail, CheckCircle, Printer, Calculator, X, Edit2, Calendar, CreditCard, Banknote, Coins, Smartphone } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '../../../lib/utils';
import CalculatorModal from './CalculatorModal';
import { useCustomers } from '../../../context/CustomerContext';

const BillingSidebar = ({
    customer,
    onCustomerChange,
    totals = {},
    onPaymentChange,
    paymentMode,
    paymentStatus,
    amountReceived,
    onSavePrint,
    onRemoveDiscount,
    onEditDiscount,
    isProcessing = false,
    requireMobile = true
}) => {
    const currentDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const [printFormat, setPrintFormat] = useState('80mm');
    const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
    const { getCustomerByMobile } = useCustomers();

    // Customer Capture State
    const [mobile, setMobile] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [whatsappOptIn, setWhatsappOptIn] = useState(false);
    const [smsOptIn, setSmsOptIn] = useState(false);
    const [customerFound, setCustomerFound] = useState(false);
    const [isNewCustomer, setIsNewCustomer] = useState(false);
    const [mobileError, setMobileError] = useState('');
    const mobileInputRef = useRef(null);

    // Auto-focus mobile input on mount
    useEffect(() => {
        if (requireMobile && mobileInputRef.current) {
            mobileInputRef.current.focus();
        }
    }, [requireMobile]);

    // Only hydrate local state when mobile number changes (not on every customer update)
    useEffect(() => {
        if (!customer) {
            // Reset when customer is cleared
            setMobile('');
            setCustomerName('');
            setWhatsappOptIn(false);
            setSmsOptIn(false);
            setCustomerFound(false);
            setIsNewCustomer(false);
            return;
        }

        // Only update if the mobile number is different (prevents overwriting during typing)
        if (customer.phone && customer.phone !== mobile) {
            setMobile(customer.phone);
            setCustomerName(customer.fullName || customer.name || '');
            setWhatsappOptIn(!!customer.whatsappOptIn);
            setSmsOptIn(!!customer.smsOptIn);
            setCustomerFound(true);
            setIsNewCustomer(false);
            setMobileError('');
        }
    }, [customer?.phone]); // Only depend on phone number

    // Handle mobile number change with lookup
    const handleMobileChange = async (e) => {
        const value = e.target.value.replace(/\D/g, ''); // Only digits
        setMobile(value);

        if (value.length < 10) {
            setMobileError(value.length > 0 ? 'Must be 10 digits' : '');
            setCustomerFound(false);
            setIsNewCustomer(false);
            return;
        }

        if (value.length === 10) {
            setMobileError('');
            // Lookup customer
            try {
                const foundCustomer = await getCustomerByMobile(value);
                if (foundCustomer) {
                    // Customer exists - auto-fill
                    setCustomerName(foundCustomer.fullName || '');
                    setWhatsappOptIn(foundCustomer.whatsappOptIn || false);
                    setSmsOptIn(foundCustomer.smsOptIn || false);
                    setCustomerFound(true);
                    setIsNewCustomer(false);

                    // Notify parent immediately
                    onCustomerChange(foundCustomer);
                } else {
                    // New customer
                    setCustomerFound(false);
                    setIsNewCustomer(true);
                    setCustomerName('');
                    setWhatsappOptIn(false);
                    setSmsOptIn(false);

                    // Notify parent with mobile data immediately
                    onCustomerChange({
                        phone: value,
                        isNew: true
                    });
                }
            } catch (error) {
                console.error('Customer lookup failed:', error);
                setIsNewCustomer(true);
            }
        }

        if (value.length > 10) {
            setMobileError('Maximum 10 digits');
        }
    };

    // Name change handler
    const handleNameChange = (e) => {
        setCustomerName(e.target.value);
    };

    const handleWhatsAppChange = (e) => {
        setWhatsappOptIn(e.target.checked);
    };

    const handleSmsChange = (e) => {
        setSmsOptIn(e.target.checked);
    };



    // Update parent when customer details change - debounced to avoid infinite loops
    useEffect(() => {
        if (mobile.length === 10 && !mobileError && customerName.trim()) {
            const customerData = {
                phone: mobile,
                fullName: customerName,
                name: customerName,
                whatsappOptIn,
                smsOptIn,
                isNew: isNewCustomer,
                id: customer?.id // Preserve existing customer ID if exists
            };

            // Only update if data has actually changed
            const hasChanged =
                customer?.phone !== mobile ||
                customer?.fullName !== customerName ||
                customer?.whatsappOptIn !== whatsappOptIn ||
                customer?.smsOptIn !== smsOptIn;

            if (hasChanged || !customer) {
                onCustomerChange(customerData);
            }
        }
    }, [customerName, whatsappOptIn, smsOptIn, mobile, mobileError, isNewCustomer]); // Removed gstin, address, customer from deps

    // Totals
    const safeTotal = totals?.total ?? 0;
    const safeGrossTotal = totals?.grossTotal ?? 0;
    const safeItemDiscount = totals?.itemDiscount ?? 0;
    const safeBillDiscount = totals?.discount ?? 0;
    const safeTax = totals?.tax ?? 0;
    const safeRoundOff = totals?.roundOff ?? 0;

    // Payment Logic
    const amtReceived = parseFloat(amountReceived) || 0;
    const balanceDue = Math.max(0, safeTotal - amtReceived);
    const changeToReturn = Math.max(0, amtReceived - safeTotal);
    const isPaid = paymentStatus === 'Paid';
    const isUnpaid = paymentStatus === 'Unpaid';

    // Helper for icons based on mode
    const getPaymentIcon = (mode) => {
        switch (mode) {
            case 'Cash': return <Banknote size={16} />;
            case 'UPI': return <Smartphone size={16} />;
            case 'Card': return <CreditCard size={16} />;
            default: return <Coins size={16} />;
        }
    };

    // Determine if save should be disabled - BOTH mobile and name required
    const isSaveDisabled = requireMobile && (mobile.length !== 10 || mobileError !== '' || !customerName.trim());

    return (
        <div className="flex flex-col h-full bg-slate-50 border-l border-slate-200/60 shadow-xl overflow-hidden w-full">
            {/* 1. Header & Utilities - Compact */}
            <div className="shrink-0 px-3 py-2 border-b border-slate-200 bg-white flex justify-between items-center h-10">
                <div className="flex items-center gap-2 text-slate-500">
                    <Calendar size={14} />
                    <span className="text-xs font-semibold">{currentDate}</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                    onClick={() => setIsCalculatorOpen(true)}
                    title="Open Calculator"
                >
                    <Calculator size={16} />
                </Button>
            </div>

            <CalculatorModal
                isOpen={isCalculatorOpen}
                onClose={() => setIsCalculatorOpen(false)}
            />

            {/* Main Content - Flex-1 to fill space, but compact to avoid scroll */}
            <div className="flex-1 flex flex-col p-2 space-y-2 overflow-auto min-h-0">

                {/* 2. Customer Section - Progressive Capture */}
                <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-600 uppercase">Customer {requireMobile && '*'}</label>
                        {customer && !isNewCustomer && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 px-2 text-[10px] text-slate-400 hover:text-rose-500"
                                onClick={() => onCustomerChange(null)}
                            >
                                <X size={12} className="mr-1" /> Clear
                            </Button>
                        )}
                    </div>

                    {/* Tier 1: Mobile (Required) */}
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <Input
                            ref={mobileInputRef}
                            type="tel"
                            placeholder="Enter 10-digit mobile *"
                            value={mobile}
                            onChange={handleMobileChange}
                            maxLength={10}
                            className={cn(
                                "pl-9 h-9 text-sm",
                                mobileError && "border-red-500 focus:border-red-500",
                                customerFound && "border-green-500 focus:border-green-500"
                            )}
                        />
                        {customerFound && (
                            <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" size={16} />
                        )}
                    </div>

                    {mobileError && <p className="text-xs text-red-600">⚠ {mobileError}</p>}
                    {customerFound && <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle size={12} /> Existing customer</p>}
                    {isNewCustomer && mobile.length === 10 && <p className="text-xs text-blue-600">→ New customer will be created</p>}

                    {/* Tier 2: Name + Messaging Opt-ins (Required name) */}
                    {mobile.length === 10 && !mobileError && (
                        <>
                            <Input
                                placeholder="Customer Name (required) *"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className={cn(
                                    "h-9 text-sm",
                                    !customerName.trim() && "border-amber-300 bg-amber-50/30"
                                )}
                            />

                            {!customerName.trim() && (
                                <p className="text-xs text-amber-600">⚠ Name is required to save bill</p>
                            )}

                            <div className="flex gap-3 text-xs">
                                <label className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={whatsappOptIn}
                                        onChange={handleWhatsAppChange}
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <MessageCircle size={14} />
                                    WhatsApp
                                </label>
                            </div>
                        </>
                    )}
                </div>

                {/* 3. Bill Summary - Flexible space but mostly compact */}
                <div className="flex flex-col gap-1 shrink-0 bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
                    {/* Subtotal */}
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Subtotal</span>
                        <span className="font-semibold text-slate-900">₹{safeGrossTotal.toFixed(2)}</span>
                    </div>

                    {/* Item Disc */}
                    {safeItemDiscount > 0 && (
                        <div className="flex justify-between text-sm text-emerald-600">
                            <span>Item Discount</span>
                            <span>- ₹{safeItemDiscount.toFixed(2)}</span>
                        </div>
                    )}

                    {/* Bill Discount */}
                    <div className="flex justify-between items-center text-sm h-6">
                        <span className="text-emerald-700 font-medium text-xs uppercase tracking-tight">Bill Discount</span>
                        <div className="flex items-center gap-2">
                            {safeBillDiscount > 0 ? (
                                <>
                                    <span className="font-medium text-emerald-700">- ₹{safeBillDiscount.toFixed(2)}</span>
                                    <div className="flex bg-slate-100 rounded-md p-0.5 border border-slate-200 scale-90 origin-right">
                                        <button
                                            onClick={onEditDiscount}
                                            className="p-1 hover:bg-white hover:text-blue-600 rounded-sm"
                                        >
                                            <Edit2 size={10} />
                                        </button>
                                        <div className="w-px bg-slate-200 my-0.5"></div>
                                        <button
                                            onClick={onRemoveDiscount}
                                            className="p-1 hover:bg-white hover:text-rose-600 rounded-sm"
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <button
                                    onClick={onEditDiscount}
                                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1"
                                >
                                    + ADD DISC
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tax & Rounding */}
                    {/* Tax & Rounding */}
                    <div className="flex justify-between text-xs text-slate-500 pt-1 border-t border-dashed border-slate-100">
                        <span>Tax: ₹{safeTax.toFixed(2)}</span>
                        <span>Round: {safeRoundOff > 0 ? '+' : ''}{safeRoundOff.toFixed(2)}</span>
                    </div>

                    {/* Tax Breakdown */}
                    {safeTax > 0 && (
                        <div className="flex flex-col gap-0.5 pt-1 px-1">
                            <div className="flex justify-between text-[10px] text-slate-400">
                                <span>SGST ({((safeTax / (totals.subtotal || 1)) * 50).toFixed(2)}%)</span>
                                <span>₹{(safeTax / 2).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400">
                                <span>CGST ({((safeTax / (totals.subtotal || 1)) * 50).toFixed(2)}%)</span>
                                <span>₹{(safeTax / 2).toFixed(2)}</span>
                            </div>
                        </div>
                    )}

                    {/* Grand Total */}
                    <div className="border-t border-slate-100 pt-1 mt-1 flex justify-between items-end">
                        <span className="font-bold text-slate-700 text-sm">Grand Total</span>
                        <span className="text-2xl font-bold tracking-tight text-slate-900 leading-none">
                            ₹{safeTotal.toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* 4. Payment Section - Compact */}
                <div className="flex-1 flex flex-col gap-2 bg-white rounded-lg border border-slate-200 p-3 shadow-sm min-h-0">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment</label>

                    {/* Status & Mode Row */}
                    <div className="flex gap-2 shrink-0">
                        <select
                            className={cn(
                                "flex-1 h-8 rounded-md text-xs font-bold border px-2 focus:outline-none focus:ring-1 focus:ring-offset-0 transition-colors appearance-none",
                                isPaid ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                                    isUnpaid ? "bg-rose-50 border-rose-200 text-rose-700" :
                                        "bg-amber-50 border-amber-200 text-amber-700"
                            )}
                            value={paymentStatus}
                            onChange={(e) => onPaymentChange('status', e.target.value)}
                        >
                            <option value="Paid">Paid Fully</option>
                            <option value="Unpaid">Unpaid / Credit</option>
                            <option value="Partially Paid">Partially Paid</option>
                        </select>

                        <div className="relative w-[110px] shrink-0">
                            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                                {getPaymentIcon(paymentMode)}
                            </div>
                            <select
                                className="w-full h-8 rounded-md border border-slate-200 bg-slate-50 pl-7 pr-2 text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                                value={paymentMode}
                                onChange={(e) => onPaymentChange('mode', e.target.value)}
                            >
                                <option value="Cash">Cash</option>
                                <option value="UPI">UPI</option>
                                <option value="Card">Card</option>
                                <option value="Bank Transfer">Bank</option>
                                <option value="Cheque">Cheque</option>
                            </select>
                        </div>
                    </div>

                    {/* Amount Received Input */}
                    {!isUnpaid && (
                        <div className="relative group shrink-0">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm group-focus-within:text-blue-500">₹</div>
                            <Input
                                value={amountReceived || ''}
                                onChange={(e) => onPaymentChange('amount', e.target.value)}
                                className="pl-7 h-10 text-xl font-bold bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 rounded-md shadow-inner"
                                placeholder="0.00"
                            />
                            {isPaid && parseFloat(amountReceived) >= safeTotal && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                                    <CheckCircle size={18} fill="currentColor" className="text-emerald-100" />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Flexible spacer */}
                    <div className="flex-1"></div>

                    {/* Balance / Change Info */}
                    <div className="shrink-0 pt-2 border-t border-slate-100/50">
                        {!isPaid && !isUnpaid && balanceDue > 0 ? (
                            <div className="flex justify-between items-end">
                                <span className="text-xs font-semibold text-rose-600">Balance Due</span>
                                <span className="text-lg font-bold text-rose-600 leading-none">₹{balanceDue.toFixed(2)}</span>
                            </div>
                        ) : changeToReturn > 0 ? (
                            <div className="flex justify-between items-end">
                                <span className="text-xs font-semibold text-emerald-600">Change Return</span>
                                <span className="text-xl font-bold text-emerald-600 leading-none">₹{changeToReturn.toFixed(2)}</span>
                            </div>
                        ) : (
                            <div className="w-full text-center text-[10px] text-slate-400 font-medium">
                                {isPaid ? "Payment Complete" : "Credit Bill"}
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* 5. Fixed Actions - Compact */}
            <div className="shrink-0 p-2 border-t border-slate-200 bg-white space-y-2 z-10">
                <div className="flex gap-2 h-10">
                    <div className="relative w-24 shrink-0">
                        <select
                            value={printFormat}
                            onChange={(e) => setPrintFormat(e.target.value)}
                            className="w-full h-full rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
                        >
                            <optgroup label="Thermal">
                                <option value="80mm">80mm</option>
                                <option value="58mm">58mm</option>
                            </optgroup>
                            <optgroup label="Sheet">
                                <option value="A4">A4</option>
                                <option value="A5">A5</option>
                            </optgroup>
                        </select>
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                            <Printer size={12} />
                        </div>
                    </div>

                    <Button
                        className={cn(
                            "flex-1 h-full bg-slate-900 text-white hover:bg-slate-800 shadow-md transition-all font-bold text-sm flex items-center justify-center gap-2 rounded-md",
                            isSaveDisabled && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={() => onSavePrint(printFormat)}
                        disabled={isProcessing || isSaveDisabled}
                        title={isSaveDisabled ? "Please enter valid customer mobile number and name" : "Save & Print"}
                    >
                        {isProcessing ? (
                            <>
                                <Printer size={16} className="animate-pulse" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Printer size={16} />
                                Save & Print
                            </>
                        )}
                    </Button>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-6 text-[10px] text-slate-400 hover:text-slate-600 font-normal py-0"
                    onClick={() => {
                        onPaymentChange('status', 'Unpaid');
                        onPaymentChange('mode', 'Credit');
                    }}
                >
                    Mark as Credit / Unpaid (Ctrl+M)
                </Button>
            </div>
        </div>
    );
};

export default BillingSidebar;
