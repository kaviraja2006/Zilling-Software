import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import {
    Store, Receipt, Calculator, Printer, Globe, Layout,
    Save, RotateCcw, Eye, CheckCircle, FileText, User, LogOut
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import services from '../../services/api';

const SettingsPage = () => {
    const { settings, updateSettings, loading } = useSettings();
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('store');
    const [unsavedChanges, setUnsavedChanges] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);



    const handleSave = async () => {
        // Prepare payload
        const payload = {
            ...settings,
            lastUpdatedAt: new Date()
        };
        // Call API manually or via Context if context supports full update
        // Assuming context updateSettings merges partially, let's update section by section or use a full save API
        // Ideally context 'updateSettings' just updates local state. We need a 'saveSettings' function.
        // For this implementation, let's assume updateSettings triggers a backend save or we call API.
        try {
            await services.settings.updateSettings(payload);
            setUnsavedChanges(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            // Re-fetch or Context will auto-update? Assuming context might need refresh.
        } catch (error) {
            console.error("Failed to save settings", error);
        }
    };

    // Helper to update deeply nested state in Context
    const handleChange = (section, field, value, subField = null) => {
        setUnsavedChanges(true);
        if (subField) {
            // e.g. store.address.city
            updateSettings(section, {
                [field]: {
                    ...settings[section][field],
                    [subField]: value
                }
            });
        } else {
            updateSettings(section, { [field]: value });
        }
    };



    const tabs = [
        { id: 'store', label: 'Store Profile', icon: Store },
        { id: 'tax', label: 'Tax & GST', icon: Calculator },
        { id: 'invoice', label: 'Invoice Design', icon: Layout },
        { id: 'print', label: 'Printer & Local', icon: Printer },
        { id: 'account', label: 'Account', icon: User },
    ];

    if (!settings) return <div className="p-10 flex justifying-center">Loading Settings...</div>;

    const renderTabContent = () => {
        switch (activeTab) {
            case 'store':
                return (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <Card>
                            <CardContent className="p-6 space-y-4">
                                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Basic Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Store Display Name</label>
                                        <Input value={settings.store.name || ''} onChange={(e) => handleChange('store', 'name', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Legal Business Name</label>
                                        <Input value={settings.store.legalName || ''} onChange={(e) => handleChange('store', 'legalName', e.target.value)} placeholder="As per GST Certificate" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Business Type</label>
                                        <select
                                            className="w-full h-10 rounded-md border border-slate-200 px-3 bg-white text-sm focus:ring-2 focus:ring-indigo-500"
                                            value={settings.store.businessType || 'Proprietorship'}
                                            onChange={(e) => handleChange('store', 'businessType', e.target.value)}
                                        >
                                            <option value="Proprietorship">Proprietorship</option>
                                            <option value="Partnership">Partnership</option>
                                            <option value="LLP">LLP</option>
                                            <option value="Private Limited">Private Limited</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Contact Number</label>
                                        <Input value={settings.store.contact || ''} onChange={(e) => handleChange('store', 'contact', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Email Address</label>
                                        <Input value={settings.store.email || ''} onChange={(e) => handleChange('store', 'email', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Website</label>
                                        <Input value={settings.store.website || ''} onChange={(e) => handleChange('store', 'website', e.target.value)} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6 space-y-4">
                                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Location & Address</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="col-span-2 space-y-2">
                                        <label className="text-sm font-medium">Street Address / Building</label>
                                        <Input value={settings.store.address?.street || ''} onChange={(e) => handleChange('store', 'address', e.target.value, 'street')} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Area / Locality</label>
                                        <Input value={settings.store.address?.area || ''} onChange={(e) => handleChange('store', 'address', e.target.value, 'area')} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">City</label>
                                        <Input value={settings.store.address?.city || ''} onChange={(e) => handleChange('store', 'address', e.target.value, 'city')} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">State</label>
                                        <Input value={settings.store.address?.state || ''} onChange={(e) => handleChange('store', 'address', e.target.value, 'state')} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Pincode</label>
                                        <Input value={settings.store.address?.pincode || ''} onChange={(e) => handleChange('store', 'address', e.target.value, 'pincode')} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6 space-y-4">
                                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Statutory Identifiers</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">FSSAI License No</label>
                                        <Input
                                            value={settings.store.fssai || ''}
                                            maxLength={14}
                                            placeholder="14-digit license number"
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '').slice(0, 14);
                                                handleChange('store', 'fssai', val);
                                            }}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );

            case 'tax':
                return (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <Card>
                            <CardContent className="p-6 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-800">GST Configuration</h3>
                                        <p className="text-sm text-slate-500">Enable tax calculations and define your GSTIN</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={settings.tax.gstEnabled} onChange={(e) => handleChange('tax', 'gstEnabled', e.target.checked)} />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>

                                {settings.tax.gstEnabled && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">GSTIN</label>
                                            <Input className="uppercase font-mono" placeholder="22AAAAA0000A1Z5" value={settings.store.gstin || ''} onChange={(e) => handleChange('store', 'gstin', e.target.value)} />
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>


                    </div>
                );

            case 'invoice':
                return (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        {/* Layout & Presets */}
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="text-lg font-semibold text-slate-800 mb-4">Invoice Template</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {['Classic', 'Compact', 'GST-Detailed', 'Minimal'].map(tmpl => (
                                        <div
                                            key={tmpl}
                                            onClick={() => handleChange('invoice', 'template', tmpl)}
                                            className={`
                                                cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-3 transition-all
                                                ${settings.invoice.template === tmpl ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-slate-300'}
                                            `}
                                        >
                                            <div className="w-12 h-16 bg-white border border-slate-200 shadow-sm rounded flex flex-col p-1 gap-1">
                                                {/* Mini Skeleton Invoice */}
                                                <div className="h-2 w-full bg-slate-200 rounded-sm"></div>
                                                <div className="flex gap-1"><div className="h-4 w-4 bg-slate-100"></div><div className="h-4 flex-1 bg-slate-100"></div></div>
                                                <div className="flex-1 bg-slate-50 mt-1"></div>
                                            </div>
                                            <span className={`text-sm font-medium ${settings.invoice.template === tmpl ? 'text-indigo-700' : 'text-slate-600'}`}>{tmpl}</span>
                                            {settings.invoice.template === tmpl && <CheckCircle className="h-4 w-4 text-indigo-600 absolute top-2 right-2 opacity-0" />}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Visual Toggles Grid */}


                        <Card>
                            <CardContent className="p-6 space-y-4">
                                <h3 className="text-lg font-semibold text-slate-800">Footer & Terms</h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Header Title</label>
                                        <Input value={settings.invoice.headerTitle || ''} onChange={(e) => handleChange('invoice', 'headerTitle', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Footer Note</label>
                                        <Input value={settings.invoice.footerNote || ''} onChange={(e) => handleChange('invoice', 'footerNote', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Terms & Conditions</label>
                                        <textarea
                                            className="w-full rounded-md border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-500 h-24"
                                            value={settings.invoice.termsAndConditions || ''}
                                            onChange={(e) => handleChange('invoice', 'termsAndConditions', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );

            case 'print':
                return (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <Card>
                            <CardContent className="p-6 space-y-4">
                                <h3 className="text-lg font-semibold text-slate-800">Printer & Localization</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Paper Size</label>
                                        <select
                                            className="w-full h-10 rounded-md border border-slate-200 px-3 bg-white text-sm"
                                            value={settings.invoice.paperSize || 'A4'}
                                            onChange={(e) => handleChange('invoice', 'paperSize', e.target.value)}
                                        >
                                            <option value="A4">A4 (Standard)</option>
                                            <option value="A5">A5 (Half Page)</option>
                                            <option value="Thermal-3inch">Thermal 3 Inch (80mm)</option>
                                            <option value="Thermal-2inch">Thermal 2 Inch (58mm)</option>
                                            <option value="112mm">Thermal 112mm</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Language</label>
                                        <select
                                            className="w-full h-10 rounded-md border border-slate-200 px-3 bg-white text-sm"
                                            value={settings.defaults.language}
                                            onChange={(e) => handleChange('defaults', 'language', e.target.value)}
                                        >
                                            <option value="en">English (Default)</option>
                                            <option value="hi">Hindi</option>
                                            <option value="ta">Tamil</option>
                                            <option value="kn">Kannada</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Currency</label>
                                        <select
                                            className="w-full h-10 rounded-md border border-slate-200 px-3 bg-white text-sm"
                                            value={settings.defaults.currency || '₹'}
                                            onChange={(e) => handleChange('defaults', 'currency', e.target.value)}
                                        >
                                            <option value="₹">Indian Rupee (₹)</option>
                                            <option value="$">USA Dollar ($)</option>
                                        </select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );
            case 'account':
                const userName = user?.name || 'User';
                const userEmail = user?.email || '';
                const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

                return (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <Card>
                            <CardContent className="p-6 space-y-6">
                                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Account Details</h3>
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 overflow-hidden rounded-full bg-indigo-600 border-4 border-white shadow-md flex items-center justify-center text-white font-bold text-xl">
                                        {userInitials}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900">{userName}</h2>
                                        <p className="text-slate-500">{userEmail}</p>
                                        <Badge className="mt-1 bg-indigo-50 text-indigo-700 border-indigo-100">{user?.role || 'Manager'}</Badge>
                                    </div>
                                </div>

                                <div className="pt-4 border-t">
                                    <h4 className="text-sm font-medium text-slate-700 mb-3">Session Management</h4>
                                    <Button
                                        onClick={logout}
                                        variant="destructive"
                                        className="w-full sm:w-auto bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 hover:border-rose-300 shadow-sm"
                                    >
                                        <LogOut className="h-4 w-4 mr-2" />
                                        Log Out
                                    </Button>
                                    <p className="text-xs text-slate-400 mt-2">This will end your current session.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Settings</h1>
                    {unsavedChanges && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 animate-pulse text-[10px] sm:text-xs">
                            Unsaved Changes
                        </Badge>
                    )}
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 sm:flex-none text-xs sm:text-sm"
                        onClick={() => window.location.reload()}
                    >
                        <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" /> Reset
                    </Button>
                    {unsavedChanges && (
                        <Button
                            size="sm"
                            className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 text-xs sm:text-sm font-bold"
                            onClick={handleSave}
                        >
                            <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" /> Save Changes
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row max-w-7xl mx-auto pt-6 px-4 sm:px-6 gap-6 lg:gap-8">
                {/* Sidebar Navigation */}
                <div className="flex lg:flex-col lg:w-64 flex-shrink-0 gap-1 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex-shrink-0 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-all
                                ${activeTab === tab.id
                                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200'
                                    : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-900'}
                            `}
                        >
                            <tab.icon size={16} className="sm:w-[18px] sm:h-[18px]" />
                            <span className="whitespace-nowrap">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 min-w-0">
                    {renderTabContent()}
                </div>
            </div>

            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-300 z-50">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Settings saved successfully!</span>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;
