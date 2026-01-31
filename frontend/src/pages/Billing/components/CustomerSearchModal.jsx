import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Search, UserPlus, ArrowLeft, Check, Phone, User, Mail, MapPin, Tag, Info, Award } from 'lucide-react';
import { useCustomers } from '../../../context/CustomerContext';

// Constants synchronized with CustomerDrawer
const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

const SOURCE_OPTIONS = ['Walk-in', 'WhatsApp', 'Instagram', 'Referral', 'Other'];
const TAG_OPTIONS = ['VIP', 'Wholesale', 'Credit'];

const COUNTRY_CODES = [
    { code: '+91', country: 'India', flag: '🇮🇳' },
    { code: '+1', country: 'USA/Canada', flag: '🇺🇸' },
    { code: '+44', country: 'UK', flag: '🇬🇧' },
    { code: '+971', country: 'UAE', flag: '🇦🇪' },
    { code: '+61', country: 'Australia', flag: '🇦🇺' },
    { code: '+65', country: 'Singapore', flag: '🇸🇬' },
    { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
    { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
    { code: '+974', country: 'Qatar', flag: '🇶🇦' },
    { code: '+33', country: 'France', flag: '🇫🇷' },
    { code: '+49', country: 'Germany', flag: '🇩🇪' },
    { code: '+81', country: 'Japan', flag: '🇯🇵' },
    { code: '+86', country: 'China', flag: '🇨🇳' },
    { code: '+94', country: 'Sri Lanka', flag: '🇱🇰' },
    { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
    { code: '+977', country: 'Nepal', flag: '🇳🇵' },
];

const CustomerSearchModal = ({ isOpen, onClose, onSelect }) => {
    const { customers, addCustomer } = useCustomers();
    const [searchTerm, setSearchTerm] = useState('');
    const [view, setView] = useState('search'); // 'search' | 'add'
    const inputRef = useRef(null);
    const addNameRef = useRef(null);

    // Form State for new customer - Exactly like CustomerDrawer
    const [formData, setFormData] = useState({
        fullName: '',
        countryCode: '+91',
        phone: '',
        email: '',
        customerType: 'Individual',
        gstin: '',
        address: {
            street: '',
            area: '',
            city: '',
            pincode: '',
            state: ''
        },
        source: 'Walk-in',
        tags: [],
        loyaltyPoints: 0,
        notes: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setView('search');
            setSearchTerm('');
            resetForm();
            if (inputRef.current) {
                setTimeout(() => inputRef.current.focus(), 100);
            }
        }
    }, [isOpen]);

    const resetForm = () => {
        setFormData({
            fullName: '',
            countryCode: '+91',
            phone: '',
            email: '',
            customerType: 'Individual',
            gstin: '',
            address: {
                street: '',
                area: '',
                city: '',
                pincode: '',
                state: ''
            },
            source: 'Walk-in',
            tags: [],
            loyaltyPoints: 0,
            notes: ''
        });
    };

    useEffect(() => {
        if (view === 'add' && addNameRef.current) {
            setTimeout(() => addNameRef.current.focus(), 100);
        }
    }, [view]);

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

    const handleAddCustomer = async (e) => {
        if (e) e.preventDefault();
        
        if (!formData.fullName || !formData.phone) {
            alert("Name and Phone are required");
            return;
        }

        if (formData.phone.length !== 10) {
            alert("Phone number must be exactly 10 digits");
            return;
        }

        if (formData.customerType === 'Business' && !formData.gstin) {
            alert("GSTIN is required for business customers");
            return;
        }

        setIsSubmitting(true);
        try {
            const submissionData = {
                ...formData,
                phone: `${formData.countryCode}${formData.phone}`
            };
            const newCustomer = await addCustomer(submissionData);
            onSelect(newCustomer);
            onClose();
        } catch (error) {
            console.error("Failed to add customer:", error);
            alert(error.response?.data?.message || "Failed to add customer");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('address.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                address: { ...prev.address, [field]: value }
            }));
        } else if (name === 'phone') {
            const numericValue = value.replace(/[^0-9]/g, '').slice(0, 10);
            setFormData(prev => ({ ...prev, phone: numericValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleTagToggle = (tag) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.includes(tag)
                ? prev.tags.filter(t => t !== tag)
                : [...prev.tags, tag]
        }));
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={view === 'search' ? "Search Customer" : "Add New Customer"}
            className={`transition-all duration-300 ${view === 'search' ? 'w-[90vw] md:w-[60vw] max-w-4xl' : 'w-[95vw] md:w-[80vw] max-w-5xl'} h-fit max-h-[95vh]`}
        >
            <div className="space-y-4 flex flex-col min-h-[400px]">
                {view === 'search' ? (
                    <>
                        {/* Search View Header */}
                        <div className="flex gap-2 shrink-0">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                                <Input
                                    ref={inputRef}
                                    placeholder="Search by Name or Phone..."
                                    className="pl-10 h-12 text-lg border-blue-100 focus:border-blue-500 shadow-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button 
                                onClick={() => setView('add')}
                                className="h-12 px-6 bg-blue-600 hover:bg-blue-700 flex gap-2 items-center text-white font-bold shadow-md"
                            >
                                <UserPlus size={18} />
                                <span className="hidden md:inline">Add New Customer</span>
                            </Button>
                        </div>

                        {/* Search Results */}
                        <div className="border border-slate-100 rounded-xl flex-1 overflow-y-auto bg-slate-50/30 p-2">
                            <div className="px-2 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Search size={14} /> Matches Found ({filteredCustomers.length})
                            </div>

                            {filteredCustomers.length > 0 ? (
                                filteredCustomers.map((customer) => (
                                    <div
                                        key={customer.id || customer._id}
                                        tabIndex={0}
                                        className="mb-2 p-4 bg-white hover:bg-blue-50 cursor-pointer border border-slate-100 hover:border-blue-200 rounded-xl transition-all focus:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 group"
                                        onClick={() => {
                                            onSelect(customer);
                                            onClose();
                                        }}
                                        onKeyDown={(e) => handleKeyDown(e, customer)}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                    {(customer.fullName || customer.name || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800 text-lg">
                                                        {customer.fullName || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.name || 'Unknown'}
                                                    </div>
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                                        <span className="flex items-center gap-1.5 text-sm text-slate-500">
                                                            <Phone size={14} className="text-slate-400" />
                                                            <span className="font-medium">{customer.phone}</span>
                                                        </span>
                                                        {customer.email && (
                                                            <span className="flex items-center gap-1.5 text-sm text-slate-500">
                                                                <Mail size={14} className="text-slate-400" />
                                                                <span>{customer.email}</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <div className="text-blue-600 font-bold bg-blue-50 px-4 py-1.5 rounded-lg text-xs uppercase tracking-wider border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                    Proceed
                                                </div>
                                                {customer.customerType === 'Business' && (
                                                    <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded border border-amber-200">BUSINESS</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-16 text-center">
                                    <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                        <Search size={40} className="text-slate-300" />
                                    </div>
                                    <p className="text-slate-600 font-bold text-xl mb-2">No matching customers</p>
                                    <p className="text-slate-400 mb-6 font-medium">We couldn't find anyone matching your search term.</p>
                                    <Button 
                                        variant="outline" 
                                        onClick={() => setView('add')}
                                        className="text-blue-600 hover:bg-blue-50 border-blue-200 h-12 px-8 font-bold text-lg"
                                    >
                                        Register New Customer
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-center pt-2 px-1">
                            <div className="text-xs text-slate-400 font-medium">
                                Press <kbd className="px-2 py-1 bg-slate-100 rounded border font-sans font-bold shadow-sm">ESC</kbd> to close
                            </div>
                            <Button variant="ghost" onClick={onClose} className="text-slate-500 hover:text-slate-700 font-bold">Cancel</Button>
                        </div>
                    </>
                ) : (
                    /* Add Customer Form View - Synchronized with CustomerDrawer */
                    <form onSubmit={handleAddCustomer} className="flex flex-col h-full max-h-[80vh] overflow-hidden">
                        <div className="flex items-center justify-between gap-4 mb-2 pb-4 border-b border-slate-100 shrink-0">
                            <div className="flex items-center gap-4">
                                <button 
                                    type="button"
                                    onClick={() => setView('search')}
                                    className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors border border-slate-100 shadow-sm"
                                >
                                    <ArrowLeft size={20} className="text-slate-600" />
                                </button>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Register New Customer</h3>
                                    <p className="text-sm font-medium text-slate-500">All fields below will be saved to your permanent directory</p>
                                </div>
                            </div>
                            <div className="hidden md:flex gap-2">
                                <Button type="button" variant="ghost" onClick={resetForm} className="text-slate-500 font-bold">Reset</Button>
                                <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-black px-10 shadow-lg shadow-blue-200">
                                    {isSubmitting ? 'Registering...' : 'SAVE & PROCEED'}
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-8 py-4 custom-scrollbar">
                            {/* Section 1: Basic Info */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                                    <User size={16} /> Basic Information
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                    {/* Name */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            Full Name <span className="text-red-500 font-black">*</span>
                                        </label>
                                        <Input
                                            ref={addNameRef}
                                            name="fullName"
                                            placeholder="Enter full legal name"
                                            className="h-12 border-slate-200 focus:border-blue-500 bg-white shadow-sm font-medium"
                                            value={formData.fullName}
                                            onChange={handleFormChange}
                                            required
                                        />
                                    </div>

                                    {/* Customer Type Toggle */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Customer Type</label>
                                        <div className="flex gap-1 p-1 bg-slate-200/50 rounded-xl h-12">
                                            {['Individual', 'Business'].map(type => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => setFormData(p => ({ ...p, customerType: type, gstin: type === 'Individual' ? '' : p.gstin }))}
                                                    className={`flex-1 flex items-center justify-center text-sm font-black rounded-lg transition-all ${formData.customerType === type ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Phone */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Phone Number <span className="text-red-500 font-black">*</span></label>
                                        <div className="flex h-12 shadow-sm rounded-xl overflow-hidden border border-slate-200">
                                            <select
                                                name="countryCode"
                                                value={formData.countryCode}
                                                onChange={handleFormChange}
                                                className="bg-slate-50 border-r border-slate-200 px-3 text-sm font-bold focus:outline-none min-w-[90px]"
                                            >
                                                {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                                            </select>
                                            <Input
                                                name="phone"
                                                placeholder="9876543210"
                                                className="border-0 h-full rounded-none focus-visible:ring-0 bg-white font-bold tracking-widest text-lg"
                                                value={formData.phone}
                                                onChange={handleFormChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* GSTIN (Conditional) */}
                                    {formData.customerType === 'Business' && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700">GSTIN <span className="text-red-500 font-black">*</span></label>
                                            <Input
                                                name="gstin"
                                                placeholder="15-character GST Number"
                                                className="h-12 border-slate-200 focus:border-blue-500 uppercase tracking-widest font-black bg-white shadow-sm"
                                                value={formData.gstin}
                                                onChange={handleFormChange}
                                                maxLength={15}
                                                required
                                            />
                                        </div>
                                    )}

                                    {/* Email */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 uppercase tracking-tighter">Email Address</label>
                                        <Input
                                            name="email"
                                            type="email"
                                            placeholder="customer@domain.com"
                                            className="h-12 border-slate-200 focus:border-blue-500 bg-white shadow-sm font-medium"
                                            value={formData.email}
                                            onChange={handleFormChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Address */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                    <MapPin size={16} /> Address Details
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-emerald-50/20 p-6 rounded-2xl border border-emerald-100/50">
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-xs font-black text-emerald-800 uppercase">Street / Building</label>
                                        <Input
                                            name="address.street"
                                            placeholder="Door No, Building Name, Street"
                                            className="h-12 bg-white border-emerald-100"
                                            value={formData.address.street}
                                            onChange={handleFormChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-emerald-800 uppercase">Area / Locality</label>
                                        <Input
                                            name="address.area"
                                            placeholder="Enter area"
                                            className="h-12 bg-white border-emerald-100"
                                            value={formData.address.area}
                                            onChange={handleFormChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-emerald-800 uppercase">City</label>
                                        <Input
                                            name="address.city"
                                            placeholder="Enter city"
                                            className="h-12 bg-white border-emerald-100"
                                            value={formData.address.city}
                                            onChange={handleFormChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-emerald-800 uppercase">State</label>
                                        <select
                                            name="address.state"
                                            value={formData.address.state}
                                            onChange={handleFormChange}
                                            className="h-12 w-full rounded-lg border border-emerald-100 bg-white px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option value="">Select State</option>
                                            {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-emerald-800 uppercase">Pincode</label>
                                        <Input
                                            name="address.pincode"
                                            placeholder="6 digits"
                                            maxLength={6}
                                            className="h-12 bg-white border-emerald-100 font-black tracking-widest"
                                            value={formData.address.pincode}
                                            onChange={handleFormChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Professional Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                                        <Award size={16} /> Preferences
                                    </h4>
                                    <div className="space-y-5 bg-amber-50/30 p-6 rounded-2xl border border-amber-100/50">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-amber-800 uppercase">Lead Source</label>
                                            <div className="flex flex-wrap gap-2">
                                                {SOURCE_OPTIONS.map(opt => (
                                                    <button
                                                        key={opt}
                                                        type="button"
                                                        onClick={() => setFormData(p => ({ ...p, source: opt }))}
                                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${formData.source === opt ? 'bg-amber-600 text-white border-amber-600 shadow-md' : 'bg-white text-slate-600 border-amber-100 hover:border-amber-400'}`}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Customer Tags</label>
                                            <div className="flex gap-2">
                                                {TAG_OPTIONS.map(tag => (
                                                    <button
                                                        key={tag}
                                                        type="button"
                                                        onClick={() => handleTagToggle(tag)}
                                                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all border-2 ${formData.tags.includes(tag) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-500 border-slate-100'}`}
                                                    >
                                                        {tag}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Opening Loyalty Points</label>
                                            <Input
                                                name="loyaltyPoints"
                                                type="number"
                                                className="h-10 bg-white font-bold"
                                                value={formData.loyaltyPoints}
                                                onChange={handleFormChange}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-sm font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                        <Info size={16} /> Additional Notes
                                    </h4>
                                    <textarea
                                        name="notes"
                                        rows={6}
                                        placeholder="Internal notes about the customer's preferences, history, or special requests..."
                                        className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 shadow-inner"
                                        value={formData.notes}
                                        onChange={handleFormChange}
                                    />
                                    <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg flex items-center gap-4">
                                        <div className="p-2 bg-white/20 rounded-full shrink-0">
                                            <Info size={20} />
                                        </div>
                                        <p className="text-xs font-bold leading-relaxed">
                                            All information is stored securely. GST billing will be enabled automatically for Business accounts.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setView('search')}
                                className="px-8 h-12 border-slate-200 font-extrabold text-slate-500 hover:bg-slate-50"
                            >
                                BACK TO SEARCH
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="px-12 h-12 bg-blue-600 hover:bg-blue-700 text-white font-black shadow-xl shadow-blue-200 transition-all active:scale-95"
                            >
                                {isSubmitting ? 'SAVING...' : 'REGISTER & SELECT'}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </Modal>
    );
};

export default CustomerSearchModal;
