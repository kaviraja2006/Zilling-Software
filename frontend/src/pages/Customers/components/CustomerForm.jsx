import React, { useState, useEffect } from 'react';
import { Input } from '../../../components/ui/Input';
import { Check, AlertCircle } from 'lucide-react';

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

const CustomerForm = ({ initialData, onChange, validation, touched, onTagToggle }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        onChange(name, value);
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
        <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
                <h4 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">Basic Information</h4>

                {/* Customer Type */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                        Type <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="customerType"
                                value="Individual"
                                checked={initialData.customerType === 'Individual'}
                                onChange={handleChange}
                                className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-slate-700">Individual</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="customerType"
                                value="Business"
                                checked={initialData.customerType === 'Business'}
                                onChange={handleChange}
                                className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-slate-700">Business</span>
                        </label>
                    </div>
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                        Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <Input
                            name="fullName"
                            value={initialData.fullName}
                            onChange={handleChange}
                            placeholder="e.g. John Doe"
                            className={touched.fullName && validation.fullName && !validation.fullName.valid ? 'border-red-300' : ''}
                        />
                        <div className="absolute right-3 top-3">
                            {getValidationIcon('fullName')}
                        </div>
                    </div>
                    {touched.fullName && validation.fullName && !validation.fullName.valid && (
                        <p className="text-xs text-red-600">{validation.fullName.message}</p>
                    )}
                </div>

                {/* Phone & Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                            Phone <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Input
                                name="phone"
                                value={initialData.phone}
                                onChange={handleChange}
                                placeholder="+91 98765 43210"
                                className={touched.phone && validation.phone && !validation.phone.valid ? 'border-red-300' : ''}
                            />
                            <div className="absolute right-3 top-3">
                                {getValidationIcon('phone')}
                            </div>
                        </div>
                        {touched.phone && validation.phone && !validation.phone.valid && (
                            <p className="text-xs text-red-600">{validation.phone.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Email</label>
                        <div className="relative">
                            <Input
                                name="email"
                                type="email"
                                value={initialData.email}
                                onChange={handleChange}
                                placeholder="john@example.com"
                                className={touched.email && validation.email && !validation.email.valid ? 'border-red-300' : ''}
                            />
                            <div className="absolute right-3 top-3">
                                {getValidationIcon('email')}
                            </div>
                        </div>
                        {touched.email && validation.email && !validation.email.valid && (
                            <p className="text-xs text-red-600">{validation.email.message}</p>
                        )}
                    </div>
                </div>

                {/* GSTIN (conditional) */}
                {initialData.customerType === 'Business' && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                            GSTIN <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Input
                                name="gstin"
                                value={initialData.gstin}
                                onChange={handleChange}
                                placeholder="22AAAAA0000A1Z5"
                                className={`uppercase ${touched.gstin && validation.gstin && !validation.gstin.valid ? 'border-red-300' : ''}`}
                                maxLength={15}
                            />
                            <div className="absolute right-3 top-3">
                                {getValidationIcon('gstin')}
                            </div>
                        </div>
                        {touched.gstin && validation.gstin && !validation.gstin.valid && (
                            <p className="text-xs text-red-600">{validation.gstin.message}</p>
                        )}
                    </div>
                )}
            </div>

            {/* Address */}
            <div className="space-y-4">
                <h4 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">Address</h4>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Street</label>
                    <Input
                        name="address.street"
                        value={initialData.address?.street}
                        onChange={handleChange}
                        placeholder="House/Flat No., Building Name"
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Area</label>
                        <Input
                            name="address.area"
                            value={initialData.address?.area}
                            onChange={handleChange}
                            placeholder="Locality/Area"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">City</label>
                        <Input
                            name="address.city"
                            value={initialData.address?.city}
                            onChange={handleChange}
                            placeholder="City"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Pincode</label>
                        <Input
                            name="address.pincode"
                            value={initialData.address?.pincode}
                            onChange={handleChange}
                            placeholder="400001"
                            maxLength={6}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">State</label>
                        <select
                            name="address.state"
                            value={initialData.address?.state}
                            onChange={handleChange}
                            className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                            <option value="">Select State</option>
                            {INDIAN_STATES.map(state => (
                                <option key={state} value={state}>{state}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Source & Tags */}
            <div className="space-y-4">
                <h4 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">Additional Details</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Source</label>
                        <select
                            name="source"
                            value={initialData.source}
                            onChange={handleChange}
                            className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                            {SOURCE_OPTIONS.map(source => (
                                <option key={source} value={source}>{source}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Loyalty Points</label>
                        <Input
                            name="loyaltyPoints"
                            type="number"
                            value={initialData.loyaltyPoints}
                            onChange={handleChange}
                            placeholder="0"
                            min="0"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Tags</label>
                    <div className="flex gap-2 flex-wrap">
                        {TAG_OPTIONS.map(tag => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => onTagToggle(tag)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${initialData.tags?.includes(tag)
                                    ? tag === 'VIP' ? 'bg-purple-600 text-white'
                                        : tag === 'Wholesale' ? 'bg-blue-600 text-white'
                                            : 'bg-orange-600 text-white'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                            >
                                {initialData.tags?.includes(tag) && <Check size={12} className="inline mr-1" />}
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Notes</label>
                    <textarea
                        name="notes"
                        value={initialData.notes}
                        onChange={handleChange}
                        placeholder="Additional notes about this customer..."
                        rows={3}
                        className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    />
                </div>
            </div>
        </div>
    );
};

export default CustomerForm;
