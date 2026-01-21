export const printReceipt = (invoice, format = '80mm', settings = {}) => {
    if (!invoice) return;

    // Destructure Settings with Defaults
    const store = settings.store || {};
    const invoiceSettings = settings.invoice || {};
    const taxSettings = settings.tax || {};
    // const defaults = settings.defaults || {}; // Unused for now

    // Helper: Format Currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    // Helper: Get Address String
    const getAddressStr = (addr) => {
        if (!addr) return '';
        if (typeof addr === 'string') return addr;
        const parts = [addr.street, addr.area, addr.city, addr.state, addr.pincode].filter(Boolean);
        return parts.join(', ');
    };

    const isThermal = format.includes('Thermal') || invoiceSettings.paperSize?.includes('Thermal');

    // --- Styles Generation ---
    const getStyles = () => {
        const baseFont = isThermal ? "'Courier New', monospace" : "'Inter', sans-serif";
        const width = isThermal ? '280px' : '750px'; // Approx A4 width in pixels for screen
        const padding = isThermal ? '10px' : '40px';
        const fontSize = isThermal ? '12px' : '14px';

        return `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { 
                font-family: ${baseFont}; 
                padding: ${padding}; 
                max-width: ${width}; 
                margin: 0 auto; 
                color: #1a1a1a; 
                line-height: 1.4;
            }
            .header { text-align: center; margin-bottom: 20px; border-bottom: ${isThermal ? '1px dashed #000' : '2px solid #eee'}; padding-bottom: 10px; }
            .store-name { font-size: ${isThermal ? '18px' : '24px'}; font-weight: 800; text-transform: uppercase; margin-bottom: 5px; color: #111; }
            .store-detail { font-size: ${isThermal ? '11px' : '13px'}; color: #555; }
            
            .meta-grid { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: ${isThermal ? '11px' : '13px'}; }
            .meta-col { display: flex; flex-direction: column; gap: 2px; }
            .meta-label { color: #666; font-size: 0.9em; }
            .meta-val { font-weight: 600; }

            table { width: 100%; border-collapse: collapse; font-size: ${fontSize}; margin-bottom: 20px; }
            th { text-align: left; border-bottom: 1px solid #000; padding: 5px 2px; font-weight: 600; text-transform: uppercase; font-size: 0.9em; }
            td { padding: 8px 2px; border-bottom: 1px solid #eee; vertical-align: top; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            
            .totals { margin-left: auto; width: ${isThermal ? '100%' : '40%'}; font-size: ${isThermal ? '12px' : '14px'}; }
            .total-row { display: flex; justify-content: space-between; padding: 4px 0; }
            .grand-total { font-weight: 800; font-size: 1.2em; border-top: 2px solid #000; padding-top: 8px; margin-top: 8px; }
            
            .footer { text-align: center; margin-top: 30px; font-size: ${isThermal ? '10px' : '12px'}; color: #666; }
            .terms { text-align: left; font-size: 10px; color: #777; margin-top: 20px; white-space: pre-line; border-top: 1px solid #eee; padding-top: 10px;}
            
            /* Toggles & Elements */
            .watermark { 
                position: fixed; top: 30%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); 
                font-size: 80px; opacity: 0.05; font-weight: bold; pointer-events: none; white-space: nowrap; z-index:-1;
            }
            .tax-breakup { font-size: 10px; margin-top: 10px; color: #555; width: 100%; border-top: 1px dotted #ccc; }
            .tax-breakup th, .tax-breakup td { border: none; padding: 2px; text-align: right; }
            .tax-breakup th:first-child, .tax-breakup td:first-child { text-align: left; }
            
            @media print {
                .no-print { display: none; }
                body { padding: 0; margin: 0; width: 100%; max-width: none; }
            }
        `;
    };

    // --- Content Generators ---
    const generateHeader = () => `
        <div class="header">
            ${invoiceSettings.showLogo && store.logoUrl ? `<img src="${store.logoUrl}" style="height: 50px; margin-bottom: 10px;" />` : ''}
            <div class="store-name">${store.name || 'Store Name'}</div>
            ${invoiceSettings.showStoreAddress ? `<div class="store-detail">${getAddressStr(store.address)}</div>` : ''}
            ${store.contact ? `<div class="store-detail">Phone: ${store.contact}</div>` : ''}
            ${store.email ? `<div class="store-detail">Email: ${store.email}</div>` : ''}
            ${store.gstin ? `<div class="store-detail" style="font-weight: 500; margin-top:4px;">GSTIN: ${store.gstin}</div>` : ''}
        </div>
    `;

    const generateCustomerMeta = () => {
        const custName = invoice.customerName || invoice.customer || 'Walk-in Customer';
        return `
        <div class="meta-grid">
            <div class="meta-col">
                <div><span class="meta-label">Bill To:</span></div>
                <div class="meta-val">${custName}</div>
                ${invoiceSettings.showCustomerGstin && invoice.customerGstin ? `<div><span class="meta-label">GSTIN:</span> ${invoice.customerGstin}</div>` : ''}
            </div>
            <div class="meta-col text-right">
                <div><span class="meta-label">Invoice No:</span> <span class="meta-val">#${invoice.id}</span></div>
                <div><span class="meta-label">Date:</span> <span>${new Date(invoice.date).toLocaleDateString()}</span></div>
            </div>
        </div>
        `;
    };

    const generateTable = () => `
        <table>
            <thead>
                <tr>
                    <th style="width: 40%">Item</th>
                    ${invoiceSettings.showHsn ? '<th>HSN</th>' : ''}
                    <th class="text-center">Qty</th>
                    <th class="text-right">Price</th>
                    ${invoiceSettings.showTaxBreakup ? '<th class="text-right">Tax</th>' : ''}
                    <th class="text-right">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${invoice.items.map(item => `
                    <tr>
                        <td>
                            <div style="font-weight: 500">${item.name}</div>
                            ${item.sku ? `<div style="font-size: 0.8em; color: #666;">SKU: ${item.sku}</div>` : ''}
                        </td>
                        ${invoiceSettings.showHsn ? `<td>${item.hsnCode || '-'}</td>` : ''}
                        <td class="text-center">${item.quantity}</td>
                        <td class="text-right">${(item.price || 0).toFixed(2)}</td>
                         ${invoiceSettings.showTaxBreakup ? `<td class="text-right" style="font-size:0.85em; color:#666;">${item.taxRate || 0}%</td>` : ''}
                        <td class="text-right">${(item.total || 0).toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    const generateTotals = () => `
        <div class="totals">
            <div class="total-row"><span>Subtotal</span> <span>${formatCurrency(invoice.subtotal)}</span></div>
            ${invoice.discount > 0 ? `<div class="total-row" style="color: green;"><span>Discount</span> <span>-${formatCurrency(invoice.discount)}</span></div>` : ''}
            ${invoice.tax > 0 ? `<div class="total-row"><span>Tax (GST)</span> <span>${formatCurrency(invoice.tax)}</span></div>` : ''}
            ${invoice.additionalCharges > 0 ? `<div class="total-row"><span>Charges</span> <span>${formatCurrency(invoice.additionalCharges)}</span></div>` : ''}
            <div class="total-row grand-total"><span>Total</span> <span>${formatCurrency(invoice.total)}</span></div>
            
            ${invoiceSettings.showSavings && invoice.discount > 0 ? `
                <div style="text-align: right; font-size: 11px; color: green; margin-top:5px;">
                    You saved ${formatCurrency(invoice.discount)} on this bill!
                </div>
            ` : ''}
        </div>
    `;

    const generateFooter = () => `
        ${invoiceSettings.showTerms ? `<div class="terms"><strong>Terms & Conditions:</strong><br/>${invoiceSettings.termsAndConditions || 'No returns.'}</div>` : ''}
        <div class="footer">
            <div>${invoiceSettings.footerNote || 'Thank you!'}</div>
            <div style="font-size: 0.8em; margin-top: 4px;">System Generated Invoice</div>
        </div>
    `;

    // --- Main Assembly ---
    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) {
        alert('Popups blocked. Please allow.');
        return;
    }

    const html = `
        <html>
            <head>
                <title>Invoice #${invoice.id}</title>
                <style>${getStyles()}</style>
            </head>
            <body>
                ${invoiceSettings.showWatermark ? `<div class="watermark">${store.name || 'CONFIDENTIAL'}</div>` : ''}
                
                ${generateHeader()}
                ${generateCustomerMeta()}
                ${generateTable()}
                ${generateTotals()}
                ${generateFooter()}

                <div class="no-print" style="text-align: center; margin-top: 20px; padding: 20px; background: #f9f9f9;">
                    <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Print Invoice</button>
                    <button onclick="window.close()" style="padding: 10px 20px; background: #fff; border: 1px solid #ccc; border-radius: 6px; cursor: pointer; margin-left: 10px;">Close</button>
                </div>
            </body>
        </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    // setTimeout(() => printWindow.print(), 500); 
    // Commented out auto-print to allow users to see the preview first as per "Test Preview" button logic often requested. 
    // Actually for "auto-print after sale" requirement, we might want it back, but let's stick to click-to-print for reliability in browser.
};

export default printReceipt;
