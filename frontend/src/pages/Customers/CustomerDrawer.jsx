import React, { useState, useEffect } from 'react';
import { Drawer } from '../../components/ui/Drawer';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ShoppingBag, Calendar, Check, AlertCircle, Printer, ChevronDown, ChevronUp } from 'lucide-react';
import services from '../../services/api';
import { useSettings } from '../../context/SettingsContext';
import { printReceipt } from '../../utils/printer';
import CustomerForm from './components/CustomerForm';
import useCustomerForm from '../../hooks/useCustomerForm';

const CustomerDrawer = ({ isOpen, onClose, customer, onSave, initialTab = 'details' }) => {
    const title = customer ? 'Customer Details' : 'Add New Customer';
    const { settings } = useSettings();
    const [activeTab, setActiveTab] = useState('details');
    const [expandedOrder, setExpandedOrder] = useState(null);
    
    const {
        formData,
        setFormData,
        validation,
        touched,
        handleChange,
        handleTagToggle,
        resetForm,
        isFormValid
    } = useCustomerForm(customer);

    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [duplicates, setDuplicates] = useState([]);
    const [searchingDuplicates, setSearchingDuplicates] = useState(false);

    // Get debounced values from formData for duplicate search
    // (Could also move this to hook but keeping here for now as it's specific to this view)
    const [debouncedPhone, setDebouncedPhone] = useState(formData.phone);
    const [debouncedEmail, setDebouncedEmail] = useState(formData.email);

    useEffect(() => {
        const h = setTimeout(() => {
            setDebouncedPhone(formData.phone);
            setDebouncedEmail(formData.email);
        }, 300);
        return () => clearTimeout(h);
    }, [formData.phone, formData.email]);

    useEffect(() => {
        if (isOpen) {
            resetForm(customer);
            setActiveTab(initialTab || 'details');
            setDuplicates([]);
        }
    }, [customer, isOpen, resetForm, initialTab]);

    useEffect(() => {
        if (customer && activeTab === 'history' && isOpen) {
            const fetchOrders = async () => {
                setLoadingOrders(true);
                try {
                    const response = await services.invoices.getAll({ customerId: customer.id });
                    setOrders(response.data.data || []);
                } catch (error) {
                    console.error("Failed to fetch customer orders", error);
                } finally {
                    setLoadingOrders(false);
                }
            };
            fetchOrders();
        }
    }, [customer, activeTab, isOpen]);

    // Duplicate detection
    useEffect(() => {
        const searchDuplicates = async () => {
            const query = debouncedPhone || debouncedEmail;
            if (!query || query.length < 3 || customer) return;

            setSearchingDuplicates(true);
            try {
                const response = await services.customers.searchDuplicates(query);
                setDuplicates(response.data || []);
            } catch (error) {
                console.error("Failed to search duplicates", error);
                setDuplicates([]);
            } finally {
                setSearchingDuplicates(false);
            }
        };

        searchDuplicates();
    }, [debouncedPhone, debouncedEmail, customer]);

    const handleSave = (addAnother = false) => {
        if (!isFormValid()) {
            alert("Please fill all required fields correctly.");
            return;
        }

        onSave(formData, addAnother);

        if (addAnother) {
            resetForm();
        }
    };

    const handleSelectDuplicate = (dup) => {
        // Close drawer and notify parent to edit this customer
        onClose();
        // You might want to emit an event or call a callback to edit the selected customer
        console.log("Selected duplicate:", dup);
    };

    const getValidationIcon = (fieldName) => {
        if (!touched[fieldName]) return null;
        const val = validation[fieldName];
        if (!val) return null;

        if (val.valid) {
            return <Check className="text-green-500" size={16} />;
        } else {
            return <AlertCircle className="text-red-500" size={16} />;
        }
    };

    return (
        <Drawer isOpen={isOpen} onClose={onClose} title={title} width="max-w-3xl">
            <div className="h-full flex flex-col">
                {/* Tabs */}
                {customer && (
                    <div className="flex border-b border-slate-200 mb-6">
                        <button
                            className={`px-4 py-2 text-sm font-medium ${activeTab === 'details' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
                            onClick={() => setActiveTab('details')}
                        >
                            Profile
                        </button>
                        <button
                            className={`px-4 py-2 text-sm font-medium ${activeTab === 'history' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
                            onClick={() => setActiveTab('history')}
                        >
                            Purchase History
                        </button>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto">
                    {activeTab === 'details' ? (
                        <div className="space-y-6">
                            {/* Customer ID (read-only for existing customers) */}
                            {customer && customer.customerId && (
                                <div className="bg-blue-50 p-3 rounded-lg">
                                    <p className="text-xs text-slate-600">Customer ID</p>
                                    <p className="font-mono font-semibold text-blue-900">{customer.customerId}</p>
                                </div>
                            )}

                            {/* Duplicate Warning */}
                            {!customer && duplicates.length > 0 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                    <div className="flex items-start gap-2 mb-2">
                                        <AlertCircle className="text-amber-600 mt-0.5" size={18} />
                                        <div>
                                            <p className="font-semibold text-amber-900 text-sm">Possible Duplicates Found</p>
                                            <p className="text-xs text-amber-700">Similar customers already exist:</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2 mt-3">
                                        {duplicates.map(dup => (
                                            <div key={dup.id} className="bg-white p-2 rounded border border-amber-200 flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium text-sm text-slate-900">{dup.fullName}</p>
                                                    <p className="text-xs text-slate-600">{dup.phone} {dup.email && `• ${dup.email}`}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleSelectDuplicate(dup)}
                                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                                >
                                                    Use This
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Basic Information, Address, Source & Tags handled by CustomerForm */}
                            <CustomerForm 
                                initialData={formData}
                                onChange={handleChange}
                                validation={validation}
                                touched={touched}
                                onTagToggle={handleTagToggle}
                            />

                            {/* Account Summary (for existing customers) */}
                            {customer && (
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">Account Summary</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-slate-50 p-4 rounded-lg text-center flex flex-col justify-between">
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase">Total Visits</p>
                                                <p className="text-xl font-bold text-slate-900">{customer.totalVisits}</p>
                                            </div>
                                            <button
                                                onClick={() => setActiveTab('history')}
                                                className="mt-2 text-[10px] text-blue-600 font-semibold hover:underline"
                                            >
                                                View Detailed History →
                                            </button>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-lg text-center">
                                            <p className="text-xs text-slate-500 uppercase">Total Spent</p>
                                            <p className="text-xl font-bold text-green-600">₹{customer.totalSpent}</p>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-lg text-center">
                                            <p className="text-xs text-slate-500 uppercase">Due Amount</p>
                                            <p className="text-xl font-bold text-red-600">₹{customer.due}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Purchase History */}
                            {loadingOrders ? (
                                <div className="text-center py-8 text-slate-500">Loading history...</div>
                            ) : orders.length > 0 ? (
                                orders.map((order) => (
                                    <div key={order.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                                        <div
                                            className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                                            onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                                    <ShoppingBag size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">Order #{order.id.slice(-6).toUpperCase()}</p>
                                                    <div className="flex items-center text-xs text-slate-500 gap-2 mt-1">
                                                        <Calendar size={12} />
                                                        <span>{new Date(order.date).toLocaleDateString()}</span>
                                                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                        <span>{order.items?.length || 0} Items</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="font-bold text-slate-900">₹{(order.total || 0).toFixed(2)}</p>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${order.status === 'Paid' ? 'bg-green-100 text-green-700' :
                                                        order.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {order.status || 'Paid'}
                                                    </span>
                                                </div>
                                                <div className="text-slate-400">
                                                    {expandedOrder === order.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                </div>
                                            </div>
                                        </div>

                                        {expandedOrder === order.id && (
                                            <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/50">
                                                <div className="py-3">
                                                    <table className="w-full text-sm">
                                                        <thead>
                                                            <tr className="text-slate-500 border-b border-slate-200">
                                                                <th className="text-left py-2 font-medium">Item</th>
                                                                <th className="text-center py-2 font-medium">Qty</th>
                                                                <th className="text-right py-2 font-medium">Price</th>
                                                                <th className="text-right py-2 font-medium">Total</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {order.items?.map((item, idx) => (
                                                                <tr key={idx} className="border-b border-slate-100 last:border-0">
                                                                    <td className="py-2 text-slate-700 font-medium">{item.name}</td>
                                                                    <td className="py-2 text-center text-slate-600">{item.quantity}</td>
                                                                    <td className="py-2 text-right text-slate-600">₹{item.price?.toFixed(2)}</td>
                                                                    <td className="py-2 text-right text-slate-900">₹{item.total?.toFixed(2)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                        <tfoot>
                                                            <tr className="border-t border-slate-200">
                                                                <td colSpan="3" className="py-2 text-right text-slate-500 font-medium">Subtotal</td>
                                                                <td className="py-2 text-right text-slate-900">₹{order.subtotal?.toFixed(2)}</td>
                                                            </tr>
                                                            {order.tax > 0 && (
                                                                <tr>
                                                                    <td colSpan="3" className="py-1 text-right text-slate-500">Tax</td>
                                                                    <td className="py-1 text-right text-slate-900">₹{order.tax?.toFixed(2)}</td>
                                                                </tr>
                                                            )}
                                                            {order.discount > 0 && (
                                                                <tr>
                                                                    <td colSpan="3" className="py-1 text-right text-green-600">Discount</td>
                                                                    <td className="py-1 text-right text-green-600">-₹{order.discount?.toFixed(2)}</td>
                                                                </tr>
                                                            )}
                                                            <tr className="border-t border-slate-200">
                                                                <td colSpan="3" className="py-2 text-right font-bold text-slate-900">Grand Total</td>
                                                                <td className="py-2 text-right font-bold text-blue-600">₹{order.total?.toFixed(2)}</td>
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>
                                                <div className="flex justify-end pt-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            printReceipt(order, settings.invoice?.paperSize || '80mm', settings);
                                                        }}
                                                    >
                                                        <Printer size={14} className="mr-1.5" /> Print Invoice
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 flex flex-col items-center text-slate-500">
                                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3 text-slate-400">
                                        <ShoppingBag size={24} />
                                    </div>
                                    <p>No purchase history found.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="pt-4 flex gap-3 border-t border-slate-100 mt-4">
                    {activeTab === 'details' && (
                        <>
                            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
                            {!customer && (
                                <Button
                                    variant="outline"
                                    className="flex-1 border-blue-600 text-blue-600 hover:bg-blue-50"
                                    onClick={() => handleSave(true)}
                                >
                                    Save & Add Another
                                </Button>
                            )}
                            <Button className="flex-1" variant="primary" onClick={() => handleSave(false)}>
                                {customer ? 'Update Customer' : 'Save Customer'}
                            </Button>
                        </>
                    )}
                    {activeTab === 'history' && (
                        <Button variant="outline" className="w-full" onClick={() => setActiveTab('details')}>Back to Details</Button>
                    )}
                </div>
            </div>
        </Drawer>
    );
};

export default CustomerDrawer;
