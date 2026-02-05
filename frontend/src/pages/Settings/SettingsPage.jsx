import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import {
    Store, Receipt, Calculator, Printer, Globe, Layout,
    Save, RotateCcw, Plus, Trash2, Eye, CheckCircle, FileText, Cloud
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { cn } from '../../lib/utils';
import services from '../../services/api';
import { getReceiptHTML } from '../../utils/printReceipt';
import { X } from 'lucide-react';

const LivePreviewModal = ({ isOpen, onClose, settings }) => {
    if (!isOpen) return null;

    const mockInvoice = {
        id: 'PRE-2024-001',
        date: new Date(),
        customerName: 'Rahul Sharma',
        customerPhone: '9876543210',
        customerAddress: '12, M.G. Road, Indiranagar, Bangalore',
        customerGstin: '29ABCDE1234F1Z5',
        items: [
            { name: 'Cotton Polo T-Shirt', quantity: 2, price: 799, total: 1598, taxRate: 5, hsnCode: '6105' },
            { name: 'Denim Jeans Slim Fit', quantity: 1, price: 1999, total: 1999, taxRate: 12, hsnCode: '6203' },
            { name: 'Leather Belt', quantity: 1, price: 499, total: 499, taxRate: 18, hsnCode: '4203' }
        ],
        subtotal: 4096,
        discount: 0,
        taxType: 'Intra-State',
        tax: 418.66, // Approx tax
        total: 4514.66,
        cgst: 209.33,
        sgst: 209.33
    };

    const htmlContent = getReceiptHTML(mockInvoice, settings.invoice.paperSize || 'A4', settings, { preview: true });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col border border-slate-200">
                <div className="flex justify-between items-center p-4 border-b bg-slate-50 rounded-t-lg">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">Invoice Preview</h3>
                        <p className="text-xs text-slate-500">Live preview of <b>{settings.invoice.template}</b> template</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500 hover:text-red-500">
                        <X size={20} />
                    </button>
                </div>
                <div className="flex-1 bg-slate-100/50 p-6 overflow-hidden flex justify-center">
                    <div className="shadow-lg border bg-white h-full w-full max-w-[850px] overflow-hidden rounded">
                        <iframe
                            title="Invoice Preview"
                            srcDoc={htmlContent}
                            className="w-full h-full"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const SettingsPage = () => {
    const { settings, updateSettings, loading } = useSettings();
    const [activeTab, setActiveTab] = useState('store');
    const [unsavedChanges, setUnsavedChanges] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // Local state for complex forms (Tax Matrix)
    const [taxGroups, setTaxGroups] = useState([]);

    // Sync local state when settings load
    useEffect(() => {
        if (settings?.tax?.taxGroups) {
            setTaxGroups(settings.tax.taxGroups);
        }
    }, [settings]);

    const handleSave = async () => {
        // Prepare payload (merge local states like taxGroups back into settings update)
        const payload = {
            ...settings,
            tax: {
                ...settings.tax,
                taxGroups: taxGroups
            },
            lastUpdatedAt: new Date()
        };
        // Call API manually or via Context if context supports full update
        // Assuming context updateSettings merges partially, let's update section by section or use a full save API
        // Ideally context 'updateSettings' just updates local state. We need a 'saveSettings' function.
        // For this implementation, let's assume updateSettings triggers a backend save or we call API.
        try {
            await services.settings.updateSettings(payload);
            setUnsavedChanges(false);
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

    // Tax Matrix Helpers
    const addTaxGroup = () => {
        const newGroup = {
            id: Date.now().toString(),
            name: 'New Tax Group',
            rate: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            active: true
        };
        setTaxGroups([...taxGroups, newGroup]);
        setUnsavedChanges(true);
    };

    const updateTaxGroup = (id, field, value) => {
        const updated = taxGroups.map(g => {
            if (g.id === id) {
                const updatedGroup = { ...g, [field]: value };
                // Auto-calc breakdown if rate changes
                if (field === 'rate') {
                    const rate = parseFloat(value) || 0;
                    updatedGroup.igst = rate;
                    updatedGroup.cgst = rate / 2;
                    updatedGroup.sgst = rate / 2;
                }
                return updatedGroup;
            }
            return g;
        });
        setTaxGroups(updated);
        setUnsavedChanges(true);
    };

    const removeTaxGroup = (id) => {
        setTaxGroups(taxGroups.filter(g => g.id !== id));
        setUnsavedChanges(true);
    };

    const tabs = [
        { id: 'store', label: 'Store Profile', icon: Store },
        { id: 'tax', label: 'Tax & GST', icon: Calculator },
        { id: 'invoice', label: 'Invoice Design', icon: Layout },
        { id: 'print', label: 'Printer & Local', icon: Printer },
        { id: 'backup', label: 'Data Backup', icon: Cloud },
    ];

    const [backupLoading, setBackupLoading] = useState(false);
    const [backupStatus, setBackupStatus] = useState(null);

    const handleBackup = async () => {
        setBackupLoading(true);
        try {
            const res = await services.backup.trigger();
            setBackupStatus({ success: true, timestamp: res.data.timestamp });
        } catch (err) {
            // Check for authentication errors
            const isAuthError = err.response?.status === 401 || err.response?.data?.authRequired;
            const errorMessage = err.response?.data?.error || err.message;

            setBackupStatus({
                success: false,
                error: errorMessage,
                authRequired: isAuthError
            });
        } finally {
            setBackupLoading(false);
        }
    };

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
                                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Owner / User Profile</h3>
                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
                                    <p className="text-sm text-blue-800">
                                        👤 Information about the person using this software (you), not the store.
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Full Name</label>
                                        <Input
                                            value={settings.user?.fullName || ''}
                                            onChange={(e) => handleChange('user', 'fullName', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Mobile Number</label>
                                        <Input
                                            value={settings.user?.mobile || ''}
                                            onChange={(e) => handleChange('user', 'mobile', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Email Address</label>
                                        <Input
                                            type="email"
                                            value={settings.user?.email || ''}
                                            onChange={(e) => handleChange('user', 'email', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Role</label>
                                        <select
                                            className="w-full h-10 rounded-md border border-slate-200 px-3 bg-white text-sm focus:ring-2 focus:ring-indigo-500"
                                            value={settings.user?.role || 'Owner'}
                                            onChange={(e) => handleChange('user', 'role', e.target.value)}
                                        >
                                            <option value="Owner">Owner</option>
                                            <option value="Manager">Manager</option>
                                            <option value="Cashier">Cashier</option>
                                            <option value="Staff">Staff</option>
                                        </select>
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
                                        <Input value={settings.store.fssai || ''} onChange={(e) => handleChange('store', 'fssai', e.target.value)} />
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
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Default Tax Preference</label>
                                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                                {['Inclusive', 'Exclusive'].map(mode => (
                                                    <button
                                                        key={mode}
                                                        onClick={() => handleChange('tax', 'defaultType', mode)}
                                                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${settings.tax.defaultType === mode ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                                                    >
                                                        {mode} (Prices)
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Tax Matrix Editor */}
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-800">Tax Matrix</h3>
                                        <p className="text-sm text-slate-500">Define tax slabs used in products</p>
                                    </div>
                                    <Button size="sm" onClick={addTaxGroup} variant="outline"><Plus className="h-4 w-4 mr-2" /> Add Group</Button>
                                </div>

                                <div className="overflow-x-auto border rounded-xl">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-slate-600 font-medium">
                                            <tr>
                                                <th className="px-4 py-3">Group Name</th>
                                                <th className="px-4 py-3 w-24">Rate (%)</th>
                                                <th className="px-4 py-3 w-24">CGST</th>
                                                <th className="px-4 py-3 w-24">SGST</th>
                                                <th className="px-4 py-3 w-24">IGST</th>
                                                <th className="px-4 py-3 w-16">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {taxGroups.map((group) => (
                                                <tr key={group.id} className="group hover:bg-slate-50/50">
                                                    <td className="px-4 py-2">
                                                        <Input className="h-8" value={group.name} onChange={(e) => updateTaxGroup(group.id, 'name', e.target.value)} />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <Input className="h-8" type="number" value={group.rate} onChange={(e) => updateTaxGroup(group.id, 'rate', e.target.value)} />
                                                    </td>
                                                    <td className="px-4 py-2 text-slate-500">{group.cgst}%</td>
                                                    <td className="px-4 py-2 text-slate-500">{group.sgst}%</td>
                                                    <td className="px-4 py-2 text-slate-500">{group.igst}%</td>
                                                    <td className="px-4 py-2">
                                                        <button onClick={() => removeTaxGroup(group.id)} className="text-rose-400 hover:text-rose-600 transition-colors p-1">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {taxGroups.length === 0 && (
                                                <tr><td colSpan="6" className="text-center py-6 text-slate-400">No tax groups defined. Add one to get started.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
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
                            <CardContent className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-slate-800">Visual Options</h3>
                                    <Button variant="ghost" size="sm" className="text-indigo-600" onClick={() => setShowPreview(true)}><Eye className="h-4 w-4 mr-2" /> Live Preview (Beta)</Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-8">
                                    {[
                                        { key: 'showLogo', label: 'Show Store Logo' },
                                        { key: 'showWatermark', label: 'Show Watermark' },
                                        { key: 'showStoreAddress', label: 'Show Store Address' },
                                        { key: 'showTaxBreakup', label: 'Tax Breakup Table' },
                                        { key: 'showHsn', label: 'HSN/SAC Codes' },
                                        { key: 'showMrp', label: 'Show MRP vs Selling' },
                                        { key: 'showSavings', label: 'Savings Highlight' },
                                        { key: 'showCustomerGstin', label: 'Customer GSTIN' },
                                        { key: 'showQrcode', label: 'UPI QR Code' },
                                        { key: 'showTerms', label: 'Terms & Conditions' },
                                        { key: 'showLoyaltyPoints', label: 'Loyalty Points' },
                                        { key: 'showSignature', label: 'Auth. Signature Box' }
                                    ].map(opt => (
                                        <div key={opt.key} className="flex items-center justify-between group">
                                            <span className="text-slate-600 text-sm group-hover:text-slate-900 transition-colors">{opt.label}</span>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={settings.invoice[opt.key]}
                                                    onChange={(e) => handleChange('invoice', opt.key, e.target.checked)}
                                                />
                                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

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
                                        <Input value={settings.defaults.currency || ''} onChange={(e) => handleChange('defaults', 'currency', e.target.value)} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );
            case 'backup':
                return (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <Card>
                            <CardContent className="p-6 space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-50 rounded-full">
                                        <Cloud className="h-6 w-6 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-800">Google Drive Backup</h3>
                                        <p className="text-sm text-slate-500">
                                            Your data is automatically backed up to your Google Drive in the
                                            <code className="mx-1 bg-slate-100 px-1 rounded text-xs">/BillingSoftware</code> folder.
                                        </p>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <h4 className="font-medium text-slate-700 mb-2">Backup Status</h4>
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex justify-between items-center">
                                        <div>
                                            <p className="text-sm font-medium text-slate-800">
                                                {backupStatus?.success
                                                    ? "Last Backup Successful"
                                                    : "System Ready"}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {backupStatus?.timestamp
                                                    ? new Date(backupStatus.timestamp).toLocaleString()
                                                    : "Automatic mode active"}
                                            </p>
                                        </div>
                                        <Button
                                            onClick={handleBackup}
                                            disabled={backupLoading}
                                            variant="outline"
                                            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                        >
                                            {backupLoading ? "Backing up..." : "Backup Now"}
                                        </Button>
                                    </div>
                                    {backupStatus?.success === false && (
                                        <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                                            <p className="text-sm font-medium text-rose-800">
                                                {backupStatus.authRequired ? '⚠️ Authentication Required' : '❌ Backup Failed'}
                                            </p>
                                            <p className="text-xs text-rose-600 mt-1">
                                                {backupStatus.error || "Check internet connection or re-login."}
                                            </p>
                                            {backupStatus.authRequired && (
                                                <p className="text-xs text-rose-700 mt-2 font-medium">
                                                    → Please log out and log back in to restore backup functionality.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="bg-blue-50 p-4 rounded-lg flex gap-3 text-sm text-blue-800">
                                    <CheckCircle className="h-5 w-5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold">Local-First Security</p>
                                        <p className="opacity-90 mt-1">
                                            Your main database is always on this computer. Google Drive only holds encrypted JSON copies for emergency recovery.
                                        </p>
                                    </div>
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
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Settings</h1>
                    {settings.onboardingCompletedAt && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Profile completed on {new Date(settings.onboardingCompletedAt).toLocaleDateString()}
                        </Badge>
                    )}
                    {unsavedChanges && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 animate-pulse">
                            Unsaved Changes
                        </Badge>
                    )}
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="ghost" onClick={() => window.location.reload()} className="flex-1 sm:flex-none"><RotateCcw className="h-4 w-4 mr-2" /> Reset</Button>
                    <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 flex-1 sm:flex-none">
                        <Save className="h-4 w-4 mr-2" /> Save Changes
                    </Button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row max-w-7xl mx-auto pt-8 px-4 sm:px-6 gap-8">
                {/* Sidebar Navigation */}
                <div className="w-full lg:w-64 flex-shrink-0">
                    <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap
                                    ${activeTab === tab.id
                                        ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200'
                                        : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-900'}
                                `}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="hidden lg:block pt-8 px-4">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">System</p>
                        <p className="text-xs text-slate-400">Version 2.4.0 (Build 2024.1)</p>
                        <p className="text-xs text-slate-400 mt-1">Last Updated: {settings.lastUpdatedAt ? new Date(settings.lastUpdatedAt).toLocaleDateString() : 'Never'}</p>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1">
                    {renderTabContent()}
                </div>
            </div>
            <LivePreviewModal isOpen={showPreview} onClose={() => setShowPreview(false)} settings={settings} />
        </div>
    );
};

export default SettingsPage;
