import React, { createContext, useState, useContext, useEffect } from 'react';
import services from '../services/api';
import { useAuth } from './AuthContext';

const SettingsContext = createContext();

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

export const SettingsProvider = ({ children }) => {
    const { user, isLoading: authLoading } = useAuth();
    const defaultSettings = {
        tax: {
            gstEnabled: true,
            defaultType: 'Exclusive',
            gstin: '',
            state: '',
            registrationType: 'Regular',
            priceMode: 'Exclusive',
            automaticTax: true,
            taxGroups: [
                { id: 'gst-0', name: 'GST 0%', rate: 0, cgst: 0, sgst: 0, igst: 0, active: true },
                { id: 'gst-5', name: 'GST 5%', rate: 5, cgst: 2.5, sgst: 2.5, igst: 5, active: true },
                { id: 'gst-12', name: 'GST 12%', rate: 12, cgst: 6, sgst: 6, igst: 12, active: true },
                { id: 'gst-18', name: 'GST 18%', rate: 18, cgst: 9, sgst: 9, igst: 18, active: true },
                { id: 'gst-28', name: 'GST 28%', rate: 28, cgst: 14, sgst: 14, igst: 28, active: true },
            ],
            slabs: [] // Deprecated but kept for compatibility
        },
        invoice: {
            template: 'Classic',
            paperSize: 'A4',
            showLogo: true,
            showWatermark: false,
            showStoreAddress: true,
            showSignature: true,
            showTaxBreakup: true,
            showHsn: true,
            showMrp: false,
            showSavings: true,
            showCustomerGstin: true,
            showLoyaltyPoints: false,
            showQrcode: true,
            showTerms: true,
            showB2bGstin: true,
            headerTitle: 'Tax Invoice',
            footerNote: 'Thank you for your business!',
            termsAndConditions: '1. Goods once sold will not be taken back.\n2. Interest @18% pa will be charged if not paid within due date.',
            roundingType: 'Nearest'
        },
        defaults: {
            currency: 'INR',
            timeZone: 'Asia/Kolkata',
            language: 'en',
            printLanguage: 'en',
            hsnCode: ''
        },
        store: {
            name: 'My Billing Co.',
            legalName: '',
            businessType: 'Proprietorship',
            contact: '',
            email: '',
            website: '',
            address: {
                street: '',
                area: '',
                city: '',
                state: '',
                pincode: '',
                country: 'India'
            },
            footer: 'Thank you for shopping with us!',
            terms: true,
            logo: true,
            gstin: '',
            fssai: ''
        }
    };

    const [settings, setSettings] = useState(defaultSettings);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Only fetch if user is authenticated and auth is not loading
        if (authLoading || !user) {
            setLoading(false);
            if (!user) {
                setSettings(defaultSettings);
            }
            return;
        }

        const fetchSettings = async () => {
            try {
                const response = await services.settings.getSettings();

                // Deep merge with defaults to ensure all fields exist (even if backend is partial)
                setSettings(prev => ({
                    ...prev,
                    ...response.data,
                    store: { ...prev.store, ...response.data.store },
                    tax: { ...prev.tax, ...response.data.tax },
                    invoice: { ...prev.invoice, ...response.data.invoice },
                    defaults: { ...prev.defaults, ...response.data.defaults }
                }));
            } catch (error) {
                console.error("Failed to fetch settings", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [user, authLoading]);

    const saveSettings = async (newSettings) => {
        try {
            await services.settings.updateSettings(newSettings);
        } catch (error) {
            console.error("Failed to save settings", error);
        }
    };

    const updateSettings = (section, data) => {
        setSettings(prev => {
            const next = {
                ...prev,
                [section]: {
                    ...prev[section],
                    ...data
                }
            };
            return next;
        });
    };

    const updateTaxSlab = (id, updates) => {
        setSettings(prev => {
            const next = {
                ...prev,
                tax: {
                    ...prev.tax,
                    slabs: prev.tax.slabs.map(slab =>
                        slab.id === id ? { ...slab, ...updates } : slab
                    )
                }
            };
            // saveSettings(next); // Removed auto-save
            return next;
        });
    };

    const addTaxSlab = (newSlab) => {
        setSettings(prev => {
            const next = {
                ...prev,
                tax: {
                    ...prev.tax,
                    slabs: [...prev.tax.slabs, { ...newSlab, id: `gst-${Date.now()}` }]
                }
            };
            saveSettings(next);
            return next;
        });
    };

    const resetSlabs = () => {
        setSettings(prev => {
            const next = {
                ...prev,
                tax: {
                    ...prev.tax,
                    slabs: defaultSettings.tax.slabs
                }
            };
            saveSettings(next);
            return next;
        });
    };

    if (loading) {
        return <div className="p-10 text-center text-slate-500">Loading settings...</div>;
    }

    return (
        <SettingsContext.Provider value={{
            settings,
            updateSettings,
            saveSettings, // Exposed
            updateTaxSlab,
            addTaxSlab,
            resetSlabs
        }}>
            {children}
        </SettingsContext.Provider>
    );
};
