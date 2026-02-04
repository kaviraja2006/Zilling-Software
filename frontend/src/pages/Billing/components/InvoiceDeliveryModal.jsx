import React, { useState } from 'react';
import { X, MessageCircle, Check, Copy } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { generateWhatsAppMessage, sendViaWhatsApp, copyWhatsAppMessage } from '../../../utils/invoiceMessaging';
import { useSettings } from '../../../context/SettingsContext';

/**
 * Invoice Delivery Modal
 * 
 * Shown after successful invoice save - provides WhatsApp sending option
 */
const InvoiceDeliveryModal = ({ isOpen, onClose, invoice, customer }) => {
    const { settings } = useSettings();
    const [copied, setCopied] = useState(false);
    const [sending, setSending] = useState(false);

    if (!isOpen) return null;

    // Extract customer data from invoice object (primary) or customer prop (fallback)
    const customerName = invoice?.customerName ||
        invoice?.customer_name ||
        customer?.fullName ||
        customer?.name ||
        'Customer';

    const mobile = invoice?.customerMobile ||
        invoice?.customer_phone ||
        customer?.phone ||
        customer?.mobile ||
        '';

    console.log('InvoiceDeliveryModal - invoice:', invoice);
    console.log('InvoiceDeliveryModal - customerName:', customerName);
    console.log('InvoiceDeliveryModal - mobile:', mobile);

    // Generate WhatsApp message with full details
    const whatsappMessage = generateWhatsAppMessage(invoice, customerName, settings);

    const handleWhatsApp = async () => {
        if (!mobile) {
            alert('Customer mobile number not found');
            return;
        }

        setSending(true);

        try {
            // Send via WhatsApp (desktop → web fallback + clipboard copy)
            await sendViaWhatsApp(mobile, whatsappMessage);

            // Show success message
            const toast = document.createElement('div');
            toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
            toast.innerHTML = `
                <div class="flex items-center gap-2">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                    <span>WhatsApp opened. Click "Send" to deliver invoice.</span>
                </div>
            `;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 4000);

            // Close modal after a brief delay
            setTimeout(() => {
                onClose();
                setSending(false);
            }, 1500);

        } catch (error) {
            console.error('WhatsApp send failed:', error);
            alert('Failed to open WhatsApp. Message copied to clipboard.');
            setSending(false);
        }
    };

    const handleCopy = async () => {
        const success = await copyWhatsAppMessage(whatsappMessage);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-green-50">
                    <div className="flex items-center gap-2">
                        <MessageCircle className="text-green-600" size={24} />
                        <h2 className="text-lg font-bold text-slate-800">Send Invoice via WhatsApp</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)]">
                    {/* Customer Info */}
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-1">Sending to:</div>
                        <div className="font-semibold text-slate-800">{customerName}</div>
                        <div className="text-sm text-slate-600">{mobile}</div>
                    </div>

                    {/* Message Preview */}
                    <div className="relative">
                        <label className="text-xs font-semibold text-slate-600 uppercase mb-2 block">
                            Message Preview
                        </label>
                        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-line relative">
                            {whatsappMessage}
                            <button
                                onClick={handleCopy}
                                className="absolute top-2 right-2 p-2 bg-white border border-green-300 rounded hover:bg-green-50 transition-colors shadow-sm"
                                title="Copy message"
                            >
                                {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} className="text-slate-500" />}
                            </button>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                            {whatsappMessage.length} characters
                        </div>
                    </div>

                    {/* Helper Text */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs text-blue-700">
                            💡 <strong>How it works:</strong> Opens WhatsApp app or WhatsApp Web. Message is pre-filled — just click "Send" in WhatsApp.
                        </p>
                    </div>
                </div>

                {/* Footer with Action Button */}
                <div className="p-4 border-t bg-slate-50 space-y-2">
                    <Button
                        onClick={handleWhatsApp}
                        disabled={sending}
                        className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 py-3 disabled:opacity-50"
                    >
                        <MessageCircle size={20} />
                        {sending ? 'Opening WhatsApp...' : '💬 Send Invoice via WhatsApp'}
                    </Button>
                    <Button
                        onClick={onClose}
                        variant="ghost"
                        className="w-full"
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default InvoiceDeliveryModal;
