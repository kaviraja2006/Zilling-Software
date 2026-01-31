import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Search, UserPlus, ArrowLeft, Loader2 } from 'lucide-react';
import { useCustomers } from '../../../context/CustomerContext';
import CustomerForm from '../../Customers/components/CustomerForm';
import useCustomerForm from '../../../hooks/useCustomerForm';

const CustomerSearchModal = ({ isOpen, onClose, onSelect }) => {
    const { customers, addCustomer } = useCustomers();
    const [searchTerm, setSearchTerm] = useState('');
    const [mode, setMode] = useState('search'); // 'search' | 'add'
    const [isSaving, setIsSaving] = useState(false);
    const inputRef = useRef(null);

    const {
        formData,
        handleChange,
        handleTagToggle,
        resetForm,
        isFormValid,
        validation,
        touched
    } = useCustomerForm();

    useEffect(() => {
        if (isOpen) {
            setMode('search');
            setSearchTerm('');
            resetForm();
            if (inputRef.current) {
                setTimeout(() => inputRef.current.focus(), 100);
            }
        }
    }, [isOpen, resetForm]);

    const filteredCustomers = customers.filter(customer => {
        const fullName = customer.fullName || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.name || '';
        return fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (customer.phone && customer.phone.includes(searchTerm));
    }).slice(0, 10);

    const handleKeyDown = (e, customer) => {
        if (e.key === 'Enter') {
            onSelect(customer);
            onClose();
        }
    };

    const handleSaveNewCustomer = async () => {
        if (!isFormValid()) {
            alert("Please fill name and phone correctly.");
            return;
        }

        setIsSaving(true);
        try {
            const newCustomer = await addCustomer(formData);
            onSelect(newCustomer);
            onClose();
        } catch (error) {
            alert(error.response?.data?.message || "Failed to create customer");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === 'search' ? "Search Customer" : "Add New Customer"}
            className="w-[60vw] max-w-4xl h-[80vh]"
        >
            <div className="space-y-4 h-full flex flex-col">
                {mode === 'search' ? (
                    <>
                        <div className="relative shrink-0 flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                                <Input
                                    ref={inputRef}
                                    placeholder="Search by Name or Phone..."
                                    className="pl-10 h-12 text-lg"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button 
                                variant="primary" 
                                className="h-12 px-6 bg-blue-600 hover:bg-blue-700"
                                onClick={() => setMode('add')}
                            >
                                <UserPlus className="mr-2 h-4 w-4" /> Add New
                            </Button>
                        </div>

                        <div className="border rounded-md flex-1 overflow-y-auto">
                            {/* Walk-in Option */}
                            <div
                                tabIndex={0}
                                className="p-3 hover:bg-green-50 cursor-pointer border-b border-slate-100 bg-green-50/30 focus:bg-green-100 focus:outline-none"
                                onClick={() => {
                                    onSelect({ name: 'Walk-in Customer', phone: '', email: '' });
                                    onClose();
                                }}
                            >
                                <div className="font-semibold text-green-700">Walk-in Customer</div>
                                <div className="text-xs text-green-600">Standard / Guest</div>
                            </div>

                            {filteredCustomers.length > 0 ? (
                                filteredCustomers.map((customer, index) => (
                                    <div
                                        key={customer.id || customer._id}
                                        tabIndex={0}
                                        className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 focus:bg-blue-50 focus:outline-none"
                                        onClick={() => {
                                            onSelect(customer);
                                            onClose();
                                        }}
                                        onKeyDown={(e) => handleKeyDown(e, customer)}
                                    >
                                        <div className="font-semibold text-slate-800">
                                            {customer.fullName || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.name || 'Unknown'}
                                        </div>
                                        <div className="text-sm text-slate-500">
                                            {customer.phone} {customer.email && `| ${customer.email}`}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-4">
                                    <p>No customers found matching "{searchTerm}"</p>
                                    <Button variant="outline" onClick={() => setMode('add')}>
                                        <UserPlus className="mr-2 h-4 w-4" /> Create New Customer
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button variant="outline" onClick={onClose}>Cancel</Button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <CustomerForm 
                                 initialData={formData}
                                 onChange={handleChange}
                                 validation={validation || {}}
                                 touched={touched || {}}
                                 onTagToggle={handleTagToggle}
                            />
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t shrink-0">
                            <Button variant="ghost" onClick={() => setMode('search')}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Search
                            </Button>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={onClose}>Cancel</Button>
                                <Button 
                                    className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
                                    onClick={handleSaveNewCustomer}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                                        </>
                                    ) : (
                                        "Create & Select"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default CustomerSearchModal;
