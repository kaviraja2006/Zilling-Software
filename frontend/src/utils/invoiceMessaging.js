/**
 * Utility functions for WhatsApp Invoice Messaging
 */

export const generateWhatsAppMessage = (bill, customerName, settings) => {
    if (!bill) return '';

    const storeName = settings?.store?.name || 'Our Store';
    const currency = settings?.defaults?.currency || '₹';
    const date = new Date(bill.date).toLocaleDateString();

    // Header
    let message = `*INVOICE from ${storeName}*\n`;
    message += `Date: ${date}\n`;
    message += `Customer: ${customerName}\n`;
    message += `Bill No: #${bill.id || bill.invoiceNumber || 'N/A'}\n\n`;

    // Items
    message += `*Items:*\n`;
    if (bill.items && bill.items.length > 0) {
        bill.items.forEach(item => {
            message += `${item.name} x ${item.quantity} = ${currency}${item.total.toFixed(2)}\n`;
        });
    } else if (bill.cart && bill.cart.length > 0) {
        // Fallback if passing active bill object before normalization
        bill.cart.forEach(item => {
            const total = item.total || (item.sellingPrice * item.quantity);
            message += `${item.name} x ${item.quantity} = ${currency}${total.toFixed(2)}\n`;
        });
    }

    message += `\n------------------\n`;

    // Totals
    const total = bill.total || bill.totals?.total || 0;
    message += `*TOTAL AMOUNT: ${currency}${total.toFixed(2)}*\n`;

    if (settings?.store?.website) {
        message += `\nVisit us: ${settings.store.website}`;
    }

    message += `\n\nThank you for your business! 🙏`;

    return message;
};

export const sendViaWhatsApp = async (mobile, message) => {
    if (!mobile) return false;

    // Clean mobile number (remove spaces, dashes)
    let cleanMobile = mobile.replace(/\D/g, '');

    // Add country code if missing (assuming India +91 for now based on context)
    if (cleanMobile.length === 10) {
        cleanMobile = '91' + cleanMobile;
    }

    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${cleanMobile}?text=${encodedMessage}`;

    // Open in new tab
    window.open(url, '_blank');
    return true;
};

export const copyWhatsAppMessage = async (message) => {
    try {
        await navigator.clipboard.writeText(message);
        return true;
    } catch (err) {
        console.error('Failed to copy text: ', err);
        return false;
    }
};
