export const printReceipt = (invoice, format = '80mm', settings = {}, options = {}) => {
    if (!invoice) return;

    // Destructure Settings with Defaults
    const store = settings.store || {};
    const invoiceSettings = settings.invoice || {};
    // const taxSettings = settings.tax || {};

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

    // Determine Render Mode
    const isBill = options.type === 'bill';

    // Templates apply ONLY if NOT a simple Bill print
    const isMinimal = !isBill && invoiceSettings.template === 'Minimal' && !isThermal;
    const isGstDetailed = !isBill && invoiceSettings.template === 'GST-Detailed';
    const isCompact = !isBill && invoiceSettings.template === 'Compact' && !isThermal;

    // Helper: Amount to Words (Mock for now)
    const amountToWords = (amount) => {
        return "Rupees " + Math.round(amount) + "";
    };

    // ----------------------------------------------------------------------
    //                           CLASSIC STYLES
    // ----------------------------------------------------------------------
    const getClassicStyles = () => {
        const baseFont = isThermal ? "'Courier New', monospace" : "'Inter', sans-serif";
        const width = isThermal ? '280px' : '794px'; // A4 width

        return `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            
            body { 
                font-family: ${baseFont}; 
                margin: 0;
                padding: 0;
                width: ${width};
                color: #1a1a1a; 
                background: white;
                font-size: 12px;
            }

            /* Blue Banner Header */
            .classic-banner {
                background-color: #0e3a8c; /* Royal Blue */
                color: white;
                padding: 30px 40px;
                display: flex;
                align-items: center;
                gap: 20px;
            }
            .logo-circle {
                width: 70px; 
                height: 70px;
                background: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                color: #0e3a8c;
                font-weight: bold;
                font-size: 10px;
                border: 2px solid white;
            }
            .banner-title {
                font-size: 32px;
                font-weight: 600;
                letter-spacing: 1px;
                text-transform: uppercase;
            }

            .main-content {
                padding: 20px 40px;
            }

            /* Top Meta (Date/No) */
            .top-meta {
                display: flex;
                justify-content: flex-end;
                gap: 40px;
                margin-bottom: 20px;
            }
            .meta-item {
                display: flex;
                gap: 15px;
            }
            .meta-label {
                font-weight: 700;
                text-transform: uppercase;
                color: #444;
                width: 80px;
                text-align: right;
            }
            .meta-value {
                font-weight: 600;
                min-width: 80px;
                text-align: right;
            }

            .payment-terms {
                text-align: center;
                margin: 20px 0 40px 0;
                font-style: italic;
                color: #444;
                font-weight: 500;
            }

            /* Address Columns */
            .address-grid {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
                gap: 40px;
            }
            .addr-col {
                flex: 1;
            }
            .col-header {
                font-weight: 700;
                text-transform: uppercase;
                color: #0e3a8c;
                margin-bottom: 10px;
                font-size: 11px;
            }
            .addr-line {
                margin-bottom: 2px;
            }

            /* Table */
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            th {
                background-color: #0e3a8c;
                color: white;
                text-transform: uppercase;
                padding: 8px 10px;
                font-size: 11px;
                text-align: left;
                font-weight: 600;
                border: 1px solid #0e3a8c;
            }
            td {
                border: 1px solid #000;
                padding: 8px 10px;
                font-size: 12px;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }

            /* Totals Section */
            .totals-section {
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                margin-top: 10px;
            }
            .total-row {
                display: flex;
                width: 250px;
                justify-content: space-between;
                padding: 4px 0;
            }
            .total-label {
                text-transform: uppercase;
                font-size: 11px;
                color: #555;
            }
            .total-value {
                font-weight: 600;
            }
            
            .balance-due {
                background-color: #0e3a8c;
                color: white;
                font-weight: bold;
                padding: 8px 10px;
                margin-top: 5px;
                width: 250px;
                display: flex;
                justify-content: space-between;
            }

            /* Footer */
            .classic-footer {
                display: flex;
                justify-content: space-between;
                margin-top: 60px;
                align-items: flex-end;
            }
            .footer-left {
                font-size: 11px;
                color: #444;
                line-height: 1.5;
            }
            .footer-right {
                text-align: center;
                width: 200px;
            }
            .signature-line {
                border-top: 1px solid #000;
                margin-top: 40px;
                padding-top: 5px;
                font-size: 11px;
                color: #444;
            }
            
            .thank-you {
                font-size: 20px; /* large and bold italic */
                font-weight: 700;
                font-style: italic;
                margin-top: 40px;
                color: #111;
            }

            @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .no-print { display: none; }
            }
        `;
    };

    // ----------------------------------------------------------------------
    //                           MINIMAL STYLES
    // ----------------------------------------------------------------------
    const getMinimalStyles = () => {
        return `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { 
                font-family: 'Inter', sans-serif; 
                margin: 0;
                padding: 0;
                width: 794px; /* A4 width */
                color: #333;
                background: white;
            }
            
            /* Header */
            .minimal-header {
                background-color: #0f766e; /* Teal-700 */
                color: white;
                padding: 40px 50px;
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
            }
            .header-left .title {
                font-size: 36px;
                font-weight: 700;
                letter-spacing: -1px;
                line-height: 1;
            }
            .header-left .subtitle {
                margin-top: 8px;
                font-size: 14px;
                opacity: 0.9;
                font-weight: 500;
            }
            .header-right {
                text-align: right;
                max-width: 300px;
            }
            .company-name {
                font-size: 20px;
                font-weight: 700;
                margin-bottom: 8px;
            }
            .company-detail {
                font-size: 13px;
                line-height: 1.5;
                opacity: 0.9;
            }

            /* Content */
            .content-wrapper {
                padding: 40px 50px;
            }

            /* Bill To & Meta */
            .info-grid {
                display: flex;
                justify-content: space-between;
                margin-bottom: 50px;
            }
            .bill-to-section {
                flex: 1;
            }
            .section-label {
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                color: #666;
                letter-spacing: 1px;
                margin-bottom: 12px;
            }
            .customer-name {
                font-size: 16px;
                font-weight: 600;
                color: #111;
                margin-bottom: 4px;
            }
            .customer-detail {
                font-size: 13px;
                color: #555;
                line-height: 1.5;
            }
            
            .invoice-meta {
                text-align: right;
            }
            .meta-row {
                display: flex;
                justify-content: flex-end;
                gap: 20px;
                margin-bottom: 4px;
                font-size: 13px;
            }
            .meta-key {
                color: #666;
                text-transform: uppercase;
                font-size: 11px;
                font-weight: 600;
                letter-spacing: 0.5px;
                padding-top: 2px;
            }
            .meta-val {
                font-weight: 500;
                color: #111;
                min-width: 80px;
            }

            /* Table */
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 40px;
            }
            th {
                text-align: left;
                font-size: 10px;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #666;
                padding: 10px 0;
                border-bottom: 1px solid #eee;
            }
            td {
                padding: 12px 0;
                font-size: 13px;
                color: #333;
                border-bottom: 1px solid #f5f5f5;
                vertical-align: top;
            }
            .col-qty, .col-price, .col-tax, .col-total { text-align: right; }
            .item-name { font-weight: 500; color: #111; }
            .item-desc { font-size: 11px; color: #777; margin-top: 2px; }

            /* Footer Section */
            .footer-grid {
                display: flex;
                gap: 40px;
                align-items: stretch;
            }
            .notes-section {
                flex: 1;
                background-color: #f0f9ff; /* Light blue */
                padding: 20px;
                border-radius: 4px;
            }
            .notes-title {
                font-size: 12px;
                font-weight: 700;
                color: #0f766e;
                margin-bottom: 8px;
            }
            .notes-text {
                font-size: 12px;
                color: #555;
                line-height: 1.5;
            }

            .totals-section {
                width: 300px;
            }
            .totals-bg {
                background-color: #0f766e;
                color: white;
                padding: 20px;
                border-radius: 4px;
                margin-top: 10px;
            }
            .sub-row {
                display: flex;
                justify-content: space-between;
                font-size: 13px;
                margin-bottom: 8px;
                color: #444;
            }
            .sub-row.discount { color: #166534; }
            
            .total-final {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .total-final .label {
                font-size: 13px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .total-final .amount {
                font-size: 24px;
                font-weight: 700;
            }

            @media print {
                .no-print { display: none; }
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
        `;
    };

    // ----------------------------------------------------------------------
    //                           GST DETAILED STYLES
    // ----------------------------------------------------------------------
    const getGstDetailedStyles = () => {
        return `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { 
                font-family: 'Inter', sans-serif;
                padding: 10mm; 
                font-size: 11px; 
                color: #1a1a1a;
                width: 794px; /* A4 */
                margin: 0 auto;
                background: white;
            }
            .container { border: 2px solid #000; }
            .header-row { display: flex; border-bottom: 2px solid #000; }
            .logo-box { width: 100px; border-right: 2px solid #000; display: flex; align-items: center; justify-content: center; padding: 10px; }
            .company-box { flex: 1; text-align: center; padding: 10px; border-right: 2px solid #000; }
            .copy-details { width: 120px; font-size: 10px; }
            .copy-row { border-bottom: 1px solid #000; padding: 2px 5px; display: flex; justify-content: space-between; }
            .copy-row:last-child { border-bottom: none; }
            
            .title-row { text-align: center; border-bottom: 2px solid #000; padding: 5px; font-weight: bold; font-size: 16px; text-transform: uppercase; background: #eee; }
            .sub-title { text-align: center; font-size: 10px; border-bottom: 2px solid #000; padding: 2px; font-style: italic; }
            
            .meta-table { width: 100%; border-collapse: collapse; }
            .meta-table td { border-right: 1px solid #000; border-bottom: 1px solid #000; padding: 4px; }
            .meta-table tr:last-child td { border-bottom: 2px solid #000; }
            
            .party-row { display: flex; border-bottom: 2px solid #000; }
            .party-col { flex: 1; padding: 5px; border-right: 2px solid #000; }
            .party-col:last-child { border-right: none; }
            .party-header { background: #eee; font-weight: bold; border-bottom: 1px solid #000; margin: -5px -5px 5px -5px; padding: 5px; text-align: center; }
            
            .main-table { width: 100%; border-collapse: collapse; font-size: 10px; }
            .main-table th { border: 1px solid #000; border-top: none; background: #eee; vertical-align: middle; text-align: center; font-weight: bold; padding: 4px; }
            .main-table td { border: 1px solid #000; padding: 4px; }
            .main-table .no-border-bottom { border-bottom: none; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            
            .footer-grid { display: flex; border-top: 2px solid #000; }
            .amount-words-col { flex: 1; border-right: 2px solid #000; padding: 5px; position: relative; }
            .tax-summary-col { width: 35%; display: flex; flex-direction: column; }
            
            .tax-row { display: flex; justify-content: space-between; padding: 2px 5px; border-bottom: 1px solid #000; font-size: 10px; }
            .tax-row.final { font-weight: bold; border-bottom: none; background: #eee; font-size: 12px; padding: 5px; }
            
            .bottom-section { display: flex; border-top: 2px solid #000; }
            .bank-details { flex: 1; border-right: 2px solid #000; padding: 5px; font-size: 10px; }
            .signature-box { flex: 1; padding: 5px; display: flex; flex-direction: column; justify-content: space-between; text-align: right; min-height: 80px; }
            
            @media print {
                .no-print { display: none; }
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
        `;
    };

    // ----------------------------------------------------------------------
    //                           GOLD COMPACT STYLES
    // ----------------------------------------------------------------------
    const getCompactStyles = () => {
        return `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { 
                font-family: 'Inter', sans-serif; 
                margin: 0;
                padding: 0;
                width: 794px; /* A4 width */
                color: #333;
                background: white;
            }
            .gold-container {
                padding: 40px;
            }
            .invoice-title-gold {
                text-align: center;
                font-size: 32px;
                font-weight: 700;
                color: #8B6508; /* Dark Goldenrod */
                margin-bottom: 20px;
                text-transform: uppercase;
            }
            .header-section {
                margin-bottom: 30px;
            }
            .business-name {
                font-size: 24px;
                font-weight: 700;
                color: #8B6508;
                margin-bottom: 5px;
            }
            .business-details {
                font-size: 12px;
                color: #555;
                line-height: 1.4;
            }
            
            .gold-bar {
                background-color: #F7E7CE; /* Light Gold/Yellow */
                border-top: 1px solid #DAA520; /* Goldenrod */
                border-bottom: 1px solid #DAA520;
                padding: 5px 10px;
                margin-bottom: 10px;
                font-size: 12px;
                font-weight: 600;
                display: flex;
                justify-content: space-between;
            }
            
            .address-grid {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
                gap: 40px;
            }
            .addr-box {
                flex: 1;
            }
            .addr-header {
                font-weight: 700;
                color: #8B6508;
                font-size: 12px;
                text-transform: uppercase;
                margin-bottom: 5px;
            }
            .addr-content {
                font-size: 12px;
                color: #333;
                line-height: 1.4;
            }
            
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            th {
                background-color: #8B6508;
                color: white;
                font-weight: 700;
                font-size: 11px;
                padding: 8px 10px;
                text-align: left;
                text-transform: uppercase;
            }
            td {
                padding: 8px 10px;
                font-size: 12px;
                border: 1px solid #ddd;
                border-top: none;
                border-bottom: 1px solid #eee;
            }
            tr:nth-child(even) { background-color: #fffdf5; }
            
            .footer-grid {
                display: flex;
                border: 1px solid #8B6508;
            }
            .footer-left {
                flex: 1.5;
                padding: 10px;
                border-right: 1px solid #8B6508;
                font-size: 11px;
            }
            .footer-right {
                flex: 1;
                font-size: 12px;
            }
            
            .total-row {
                display: flex;
                justify-content: space-between;
                padding: 5px 10px;
                border-bottom: 1px solid #eee;
            }
            .total-row:last-child {
                border-bottom: none;
            }
            .total-label { font-weight: 600; color: #555; font-size: 11px; text-transform: uppercase; }
            .grand-total-row {
                display: flex;
                justify-content: space-between;
                padding: 10px;
                background-color: #F7E7CE;
                border-top: 1px solid #DAA520;
                font-weight: 700;
                color: #8B6508;
                font-size: 14px;
            }
            
            .seal-section {
                margin-top: 40px;
                text-align: center;
                font-weight: 700;
                font-size: 12px;
            }
            
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            
             @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .no-print { display: none; }
            }
        `;
    };

    // ----------------------------------------------------------------------
    //                           CLASSIC HTML
    // ----------------------------------------------------------------------
    const generateClassicHTML = () => {
        const custName = invoice.customerName || invoice.customer || 'Walk-in Customer';

        return `
            <div class="classic-banner">
                <div class="logo-circle">
                    ${store.logoUrl ? `<img src="${store.logoUrl}" style="width:100%; height:100%; object-fit:cover;" />` : 'LOGO'}
                </div>
                <div class="banner-title">INVOICE</div>
            </div>

            <div class="main-content">
                <div class="top-meta">
                    <div class="meta-item">
                        <span class="meta-label">Date</span>
                        <span class="meta-value">${new Date(invoice.date).toLocaleDateString()}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Invoice No.</span>
                        <span class="meta-value">#${invoice.id}</span>
                    </div>
                </div>

                <div class="payment-terms">
                    &lt;Payment terms (due on receipt, due in X days)&gt;
                </div>

                <div class="address-grid">
                    <div class="addr-col">
                        <div class="col-header">Company Name</div>
                        <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${store.name || 'Your Company'}</div>
                        <div class="addr-line">${getAddressStr(store.address)}</div>
                        <div class="addr-line">${store.contact}</div>
                        <div class="addr-line">${store.email || ''}</div>
                    </div>
                    <div class="addr-col">
                        <div class="col-header">Bill To</div>
                        <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${custName}</div>
                        <div class="addr-line">${invoice.customerAddress || ''}</div>
                        <div class="addr-line">${invoice.customerPhone || ''}</div>
                        ${invoice.customerGstin ? `<div class="addr-line">GSTIN: ${invoice.customerGstin}</div>` : ''}
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 40%">Description</th>
                            <th class="text-center">Qty</th>
                            <th class="text-right">Unit Price</th>
                            <th class="text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoice.items.map(item => `
                            <tr>
                                <td>
                                    ${item.name}
                                    ${item.sku ? `<br/><span style="font-size:10px;color:#666">${item.sku}</span>` : ''}
                                </td>
                                <td class="text-center">${item.quantity}</td>
                                <td class="text-right">${formatCurrency(item.price)}</td>
                                <td class="text-right">${formatCurrency(item.total)}</td>
                            </tr>
                        `).join('')}
                        <!-- Empty rows for spacing if needed, but keeping it dynamic as per image having empty lines is less practical for web print -->
                    </tbody>
                </table>

                <div class="totals-section">
                    <div class="total-row">
                        <span class="total-label">Subtotal</span>
                        <span class="total-value">${formatCurrency(invoice.subtotal)}</span>
                    </div>
                    ${invoice.discount > 0 ? `
                        <div class="total-row">
                            <span class="total-label">Discount</span>
                            <span class="total-value">-${formatCurrency(invoice.discount)}</span>
                        </div>
                    ` : ''}
                    ${invoice.additionalCharges > 0 ? `
                        <div class="total-row">
                            <span class="total-label">Charges</span>
                            <span class="total-value">${formatCurrency(invoice.additionalCharges)}</span>
                        </div>
                    ` : ''}
                    ${invoice.tax > 0 ? `
                        <div class="total-row">
                            <span class="total-label">Tax Rate</span>
                            <span class="total-value">Included/Extra</span> 
                            <!-- Simplified tax display as per image single line "Tax Rate" -->
                        </div>
                        <div class="total-row">
                            <span class="total-label">Total Tax</span>
                            <span class="total-value">${formatCurrency(invoice.tax)}</span>
                        </div>
                    ` : ''}
                    
                    <div class="balance-due">
                        <span>BALANCE DUE</span>
                        <span>${formatCurrency(invoice.total)}</span>
                    </div>
                </div>

                <div class="classic-footer">
                    <div class="footer-left">
                        <div style="font-weight: 600; margin-bottom: 5px;">Remarks / Payment Instructions:</div>
                        ${invoiceSettings.footerNote || ''}
                        ${store.name ? `<br/>Make all checks payable to ${store.name}<br/>` : ''}
                        ${store.upiId ? `UPI/Paypal: ${store.upiId}` : ''}
                        
                        <div class="thank-you">Thank you for your business!</div>
                    </div>
                    <div class="footer-right">
                        <div class="signature-line">Client Signature X</div>
                    </div>
                </div>
            </div>
        `;
    };

    // ----------------------------------------------------------------------
    //                           MINIMAL HTML
    // ----------------------------------------------------------------------
    const generateMinimalHTML = () => {
        const custName = invoice.customerName || invoice.customer || 'Customer';

        return `
            <div class="minimal-header">
                <div class="header-left">
                    <div class="title">Invoice</div>
                    <div class="subtitle">#${invoice.id}</div>
                </div>
                <div class="header-right">
                    <div class="company-name">${store.name || 'Company Name'}</div>
                    <div class="company-detail">${getAddressStr(store.address)}</div>
                    ${store.email ? `<div class="company-detail">${store.email}</div>` : ''}
                    ${store.gstin ? `<div class="company-detail">GSTIN: ${store.gstin}</div>` : ''}
                </div>
            </div>

            <div class="content-wrapper">
                <div class="info-grid">
                    <div class="bill-to-section">
                        <div class="section-label">Bill To</div>
                        <div class="customer-name">${custName}</div>
                        ${invoice.customerGstin ? `<div class="customer-detail">GSTIN: ${invoice.customerGstin}</div>` : ''}
                        ${invoice.customerPhone ? `<div class="customer-detail">Ph: ${invoice.customerPhone}</div>` : ''}
                        ${invoice.customerAddress ? `<div class="customer-detail">${invoice.customerAddress}</div>` : ''}
                    </div>
                    <div class="invoice-meta">
                        <div class="meta-row">
                            <span class="meta-key">Invoice Date</span>
                            <span class="meta-val">${new Date(invoice.date).toLocaleDateString()}</span>
                        </div>
                        <div class="meta-row">
                            <span class="meta-key">Due Date</span>
                            <span class="meta-val">${new Date(invoice.date).toLocaleDateString() /* TODO: add due date logic */}</span>
                        </div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th width="45%">Item Description</th>
                            ${invoiceSettings.showHsn ? '<th>HSN</th>' : ''}
                            <th class="col-qty">Msg</th>
                            <th class="col-price">Price</th>
                            ${invoiceSettings.showTaxBreakup ? '<th class="col-tax">Tax</th>' : ''}
                            <th class="col-total">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoice.items.map(item => `
                            <tr>
                                <td>
                                    <div class="item-name">${item.name}</div>
                                    ${item.sku ? `<div class="item-desc">SKU: ${item.sku}</div>` : ''}
                                </td>
                                ${invoiceSettings.showHsn ? `<td>${item.hsnCode || '-'}</td>` : ''}
                                <td class="col-qty">${item.quantity}</td>
                                <td class="col-price">${(item.price || 0).toFixed(2)}</td>
                                ${invoiceSettings.showTaxBreakup ? `<td class="col-tax">${item.taxRate || 0}%</td>` : ''}
                                <td class="col-total">${(item.total || 0).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="footer-grid">
                    <div class="notes-section">
                        <div class="notes-title">NOTES</div>
                        <div class="notes-text">
                            ${invoiceSettings.footerNote || 'Thank you for your business!'}
                            <br/><br/>
                            ${invoiceSettings.termsAndConditions ? `<strong>Terms:</strong><br/>${invoiceSettings.termsAndConditions}` : ''}
                        </div>
                    </div>
                    
                    <div class="totals-section">
                        <div class="sub-row">
                            <span>Subtotal</span>
                            <span>${formatCurrency(invoice.subtotal)}</span>
                        </div>
                        ${invoice.tax > 0 ? `
                        <div class="sub-row">
                            <span>Tax (GST)</span>
                            <span>${formatCurrency(invoice.tax)}</span>
                        </div>
                        ` : ''}
                        ${invoice.discount > 0 ? `
                        <div class="sub-row discount">
                            <span>Discount</span>
                            <span>-${formatCurrency(invoice.discount)}</span>
                        </div>
                        ` : ''}
                        ${invoice.additionalCharges > 0 ? `
                        <div class="sub-row">
                            <span>Charges</span>
                            <span>${formatCurrency(invoice.additionalCharges)}</span>
                        </div>
                        ` : ''}

                        <div class="totals-bg">
                            <div class="total-final">
                                <span class="label">Total</span>
                                <span class="amount">${formatCurrency(invoice.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // ----------------------------------------------------------------------
    //                           GOLD COMPACT HTML
    // ----------------------------------------------------------------------
    const generateCompactHTML = () => {
        const custName = invoice.customerName || invoice.customer || 'Walk-in Customer';

        return `
            <div class="gold-container">
                <div class="invoice-title-gold">Invoice</div>
                
                <div class="header-section">
                    <div class="business-name">${store.name || 'Your Business Name'}</div>
                    <div class="business-details">
                        ${getAddressStr(store.address)}<br/>
                        ${store.email ? `${store.email}<br/>` : ''}
                        ${store.contact ? `Contact: ${store.contact}` : ''}
                        ${store.gstin ? `<br/>GSTIN: ${store.gstin}` : ''}
                    </div>
                </div>
                
                <div class="gold-bar">
                    <span>INVOICE NO.: #${invoice.id}</span>
                    <div class="text-right">
                        <span>Invoice Date: ${new Date(invoice.date).toLocaleDateString()}</span>
                        <br/>
                        <span>Due Date: ${new Date(invoice.date).toLocaleDateString()}</span>
                    </div>
                </div>
                
                <div class="gold-bar" style="margin-top: 5px;"></div>
                
                <div class="address-grid">
                    <div class="addr-box">
                        <div class="addr-header">BILL TO</div>
                        <div class="addr-content">
                            <b>${custName}</b><br/>
                            ${invoice.customerAddress || ''}<br/>
                            ${invoice.customerPhone ? `Ph: ${invoice.customerPhone}<br/>` : ''}
                            ${invoice.customerGstin ? `GSTIN: ${invoice.customerGstin}` : ''}
                        </div>
                    </div>
                    
                    <div class="addr-box">
                        <div class="addr-header">SHIP TO</div>
                        <div class="addr-content">
                            <b>${custName}</b><br/>
                            ${invoice.customerAddress || ''}<br/>
                        </div>
                    </div>
                </div>
                
                <div style="font-size: 11px; font-weight: bold; margin-bottom: 5px; color: #555;">
                     ${invoice.customerGstin ? `GSTIN NO.: ${invoice.customerGstin}` : ''}
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 45%;">DESCRIPTION</th>
                            <th class="text-center">QTY</th>
                            <th class="text-right">UNIT PRICE</th>
                            <th class="text-right">TOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoice.items.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td class="text-center">${item.quantity}</td>
                                <td class="text-right">${formatCurrency(item.price)}</td>
                                <td class="text-right">${formatCurrency(item.total)}</td>
                            </tr>
                        `).join('')}
                        <!-- Filler rows for visual match -->
                         ${Array(Math.max(0, 8 - invoice.items.length)).fill(0).map(() => `
                            <tr><td style="color:transparent; height: 20px;">.</td><td></td><td></td><td></td></tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="footer-grid">
                    <div class="footer-left">
                        <div style="font-weight: 700; margin-bottom: 5px; color: #8B6508;">Terms & Instructions</div>
                        <div style="margin-bottom: 20px;">
                             ${invoiceSettings.termsAndConditions || '1. Goods once sold will not be taken back.<br/>2. Subject to Chennai jurisdiction.'}
                        </div>
                        
                        <div style="border-top: 1px solid #ccc; padding-top: 5px; margin-top: 10px;">
                            <b>Payment Mode:</b> ${invoice.paymentMode || 'Cash/UPI'}
                            ${store.upiId ? `<br/>UPI: ${store.upiId}` : ''}
                        </div>
                        
                        <div class="seal-section">
                            <br/><br/>
                            Seal & Signature
                        </div>
                    </div>
                    <div class="footer-right">
                        <div class="total-row">
                            <span class="total-label">Subtotal</span>
                            <span>${formatCurrency(invoice.subtotal)}</span>
                        </div>
                        ${invoice.discount > 0 ? `
                        <div class="total-row">
                            <span class="total-label">Discount</span>
                            <span>${formatCurrency(invoice.discount)}</span>
                        </div>
                        ` : ''}
                        ${invoice.tax > 0 ? `
                         <div class="total-row">
                            <span class="total-label">Tax (GST)</span>
                            <span>${formatCurrency(invoice.tax)}</span>
                        </div>
                        ` : ''}
                        <div class="total-row">
                            <span class="total-label">Received Balance</span>
                            <span>0.00</span>
                        </div>
                         <div class="total-row" style="background-color: #fffdf5; font-weight: bold; color: #8B6508;">
                            <span class="total-label" style="color: #8B6508;">Balance Due</span>
                            <span>${formatCurrency(invoice.total)}</span>
                        </div>
                        
                         <div class="grand-total-row">
                            <span>GRAND TOTAL</span>
                            <span>${formatCurrency(invoice.total)}</span>
                        </div>
                    </div>
                </div>

            </div >
    `;
    }



    // ----------------------------------------------------------------------
    //                           STANDARD BILL STYLES
    // ----------------------------------------------------------------------
    const getBillStyles = () => {
        // Determine effective format
        // format arg takes precedence, then settings
        const effectiveFormat = (format || invoiceSettings.paperSize || '80mm').toLowerCase();

        let width = '794px'; // Default A4
        let padding = '20px';
        let fontSize = '12px';
        let headerSize = '18px';

        if (effectiveFormat.includes('58mm')) {
            width = '180px'; // ~48mm printable
            padding = '5px';
            fontSize = '10px';
            headerSize = '14px';
        } else if (effectiveFormat.includes('80mm')) {
            width = '280px'; // ~72mm printable
            padding = '10px';
            fontSize = '11px';
            headerSize = '16px';
        } else if (effectiveFormat.includes('112mm')) {
            width = '400px'; // ~104mm printable
            padding = '15px';
            fontSize = '12px';
            headerSize = '18px';
        } else if (effectiveFormat.includes('a5')) {
            width = '559px'; // A5 width at 96dpi
            padding = '20px';
            fontSize = '12px';
            headerSize = '20px';
        } else {
            // A4 or Default
            width = '794px';
            padding = '40px';
            fontSize = '14px';
            headerSize = '24px';
        }

        const baseFont = (effectiveFormat.includes('mm') || effectiveFormat.includes('thermal'))
            ? "'Courier New', monospace"
            : "'Inter', sans-serif";

        return `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { 
                font-family: ${baseFont}; 
                margin: 0;
                padding: ${padding};
                width: ${width}; 
                color: #000;
                background: white;
                font-size: ${fontSize};
            }
            .bill-header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .store-name { font-size: ${headerSize}; font-weight: bold; text-transform: uppercase; }
            .store-info { font-size: 11px; margin-top: 5px; }
            
            .bill-meta { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 10px; }
            .meta-left { text-align: left; }
            .meta-right { text-align: right; }
            
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 1px; }
            th { text-align: left; border-bottom: 1px dashed #000; padding: 5px 0; }
            td { padding: 5px 0; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            
            .bill-totals { margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px; font-size: 12px; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .total-row.final { font-weight: bold; font-size: 14px; border-top: 1px solid #000; padding-top: 5px; margin-top: 5px; }
            
            .bill-footer { text-align: center; margin-top: 20px; font-size: 11px; }
            
             @media print {
                .no-print { display: none; }
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
        `;
    }

    // ----------------------------------------------------------------------
    //                           STANDARD BILL HTML
    // ----------------------------------------------------------------------
    const generateBillHTML = () => {
        const custName = invoice.customerName || invoice.customer || 'Customer';
        return `
            <div class="bill-header">
                <div class="store-name">${store.name || 'Store Name'}</div>
                <div class="store-info">
                    ${getAddressStr(store.address)}<br/>
                    ${store.contact ? `Ph: ${store.contact}` : ''}
                    ${store.gstin ? `<br/>GSTIN: ${store.gstin}` : ''}
                </div>
            </div>
            
            <div class="bill-meta">
                <div class="meta-left">
                    Bill No: ${invoice.id}<br/>
                    Date: ${new Date(invoice.date).toLocaleDateString()}
                </div>
                <div class="meta-right">
                    Customer: ${custName}
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th width="45%">Item</th>
                        <th class="text-center" width="15%">Qty</th>
                        <th class="text-right" width="20%">Price</th>
                        <th class="text-right" width="20%">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoice.items.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td class="text-center">${item.quantity}</td>
                            <td class="text-right">${Number(item.price).toFixed(2)}</td>
                            <td class="text-right">${Number(item.total).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="bill-totals">
                <div class="total-row">
                    <span>Subtotal</span>
                    <span>${formatCurrency(invoice.subtotal)}</span>
                </div>
                ${invoice.discount > 0 ? `
                <div class="total-row">
                    <span>Discount</span>
                    <span>-${formatCurrency(invoice.discount)}</span>
                </div>` : ''}
                ${invoice.tax > 0 ? `
                <div class="total-row">
                    <span>Tax</span>
                    <span>${formatCurrency(invoice.tax)}</span>
                </div>
                <div class="total-row" style="color:#555; font-size:10px;">
                    <span>SGST (${((invoice.tax / (invoice.subtotal || 1)) * 50).toFixed(2)}%)</span>
                    <span>${formatCurrency(invoice.tax / 2)}</span>
                </div>
                <div class="total-row" style="color:#555; font-size:10px;">
                    <span>CGST (${((invoice.tax / (invoice.subtotal || 1)) * 50).toFixed(2)}%)</span>
                    <span>${formatCurrency(invoice.tax / 2)}</span>
                </div>` : ''}
                <div class="total-row final">
                    <span>TOTAL</span>
                    <span>${formatCurrency(invoice.total)}</span>
                </div>
            </div>
            
            <div class="bill-footer">
                Thank you for your visit!<br/>
                ${store.footer || ''}
            </div>
        `;
    }

    // ----------------------------------------------------------------------
    //                           GST DETAILED HTML
    // ----------------------------------------------------------------------
    const generateGstDetailedHTML = () => {
        const custName = invoice.customerName || invoice.customer || 'Walk-in Customer';

        // Calculations for GST
        const totalTaxable = invoice.items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
        const cgstAmount = (invoice.tax || 0) / 2;
        const sgstAmount = (invoice.tax || 0) / 2;

        return `
    < div class="container" >
                <div class="header-row">
                    <div class="logo-box">
                        ${store.logoUrl ? `<img src="${store.logoUrl}" style="max-width:80px;" />` : '<b>LOGO</b>'}
                    </div>
                    <div class="company-box">
                        <div style="font-size: 22px; font-weight: bold;">${store.name || 'Store Name'}</div>
                        <div>${getAddressStr(store.address)}</div>
                        <div>Tel: ${store.contact || '-'}</div>
                        <div style="font-weight: bold; margin-top: 2px;">GSTIN: ${store.gstin || 'N/A'}</div>
                    </div>
                    <div class="copy-details">
                        <div class="copy-row"><span>Original</span> <input type="checkbox" checked /></div>
                        <div class="copy-row"><span>Duplicate</span> <input type="checkbox" /></div>
                        <div class="copy-row"><span>Triplicate</span> <input type="checkbox" /></div>
                        <div class="copy-row"><span>Extra Copy</span> <input type="checkbox" /></div>
                    </div>
                </div>

                <div class="title-row">Tax Invoice</div>
                <div class="sub-title">(See rule 7, for a tax invoice referred to in section 31)</div>

                <table class="meta-table">
                    <tr>
                        <td width="50%">
                            <b>Invoice No:</b> ${invoice.id ? invoice.id.slice(-8).toUpperCase() : ''}<br/>
                            <b>Invoice Date:</b> ${new Date(invoice.date).toLocaleDateString()}
                        </td>
                        <td width="50%">
                            <b>Transport Mode:</b> -<br/>
                            <b>Vehicle Number:</b> -
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <b>Reverse Charge (Y/N):</b> No<br/>
                            <b>State:</b> ${store.address?.state || ''}
                        </td>
                        <td>
                            <b>Date of Supply:</b> ${new Date(invoice.date).toLocaleDateString()}<br/>
                            <b>Place of Supply:</b> ${custName ? 'Local' : ''}
                        </td>
                    </tr>
                </table>

                <div class="party-row">
                    <div class="party-col">
                        <div class="party-header">Detail of Receiver (Billed to)</div>
                        <div><b>Name:</b> ${custName}</div>
                        <div><b>Address:</b> ${invoice.customerAddress || '-'}</div>
                        <div><b>GSTIN:</b> ${invoice.customerGstin || '-'}</div>
                        <div><b>Phone:</b> ${invoice.customerPhone || '-'}</div>
                    </div>
                    <div class="party-col">
                        <div class="party-header">Detail of Consignee (Shipped to)</div>
                        <div><b>Name:</b> ${custName}</div>
                        <div><b>Address:</b> ${invoice.customerAddress || '-'}</div>
                        <div><b>GSTIN:</b> ${invoice.customerGstin || '-'}</div>
                        <div><b>State:</b> -</div>
                    </div>
                </div>

                <table class="main-table">
                    <thead>
                        <tr>
                            <th rowspan="2" style="width: 30px;">S.No</th>
                            <th rowspan="2">Product Description</th>
                            <th rowspan="2" style="width: 60px;">HSN/SAC</th>
                            <th rowspan="2" style="width: 40px;">Qty</th>
                            <th rowspan="2" style="width: 60px;">Rate</th>
                            <th rowspan="2" style="width: 70px;">Taxable Value</th>
                            <th colspan="2">CGST</th>
                            <th colspan="2">SGST</th>
                            <th rowspan="2" style="width: 80px;">Total</th>
                        </tr>
                        <tr>
                            <th style="font-size: 9px;">Rate</th>
                            <th style="font-size: 9px;">Amt</th>
                            <th style="font-size: 9px;">Rate</th>
                            <th style="font-size: 9px;">Amt</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoice.items.map((item, i) => `
                        <tr>
                            <td class="text-center">${i + 1}</td>
                            <td>${item.name}</td>
                            <td class="text-center">${item.hsnCode || '-'}</td>
                            <td class="text-center">${item.quantity}</td>
                            <td class="text-right">${parseFloat(item.price).toFixed(2)}</td>
                            <td class="text-right">${(item.quantity * item.price).toFixed(2)}</td>
                            <td class="text-center">${item.taxRate ? (item.taxRate / 2) + '%' : '0%'}</td>
                            <td class="text-right">${item.taxRate ? ((item.total * (item.taxRate / 100)) / 2).toFixed(2) : '0.00'}</td>
                            <td class="text-center">${item.taxRate ? (item.taxRate / 2) + '%' : '0%'}</td>
                            <td class="text-right">${item.taxRate ? ((item.total * (item.taxRate / 100)) / 2).toFixed(2) : '0.00'}</td>
                            <td class="text-right" style="font-weight:bold;">${parseFloat(item.total).toFixed(2)}</td>
                        </tr>
                        `).join('')}
                        
                        <tr style="background: #eee; font-weight: bold;">
                            <td colspan="5" class="text-right">Total</td>
                            <td class="text-right">${totalTaxable.toFixed(2)}</td>
                            <td class="text-center"></td>
                            <td class="text-right">${cgstAmount.toFixed(2)}</td>
                            <td class="text-center"></td>
                            <td class="text-right">${sgstAmount.toFixed(2)}</td>
                            <td class="text-right">${parseFloat(invoice.total).toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="footer-grid">
                    <div class="amount-words-col">
                        <b>Total Invoice Amount in Words:</b><br/>
                        <div style="margin-top: 5px; font-style: italic;">
                            ${amountToWords(invoice.total)} Only
                        </div>
                    </div>
                    <div class="tax-summary-col">
                        <div class="tax-row"><span>Total Amount before Tax:</span> <span>${totalTaxable.toFixed(2)}</span></div>
                        <div class="tax-row"><span>Add: CGST</span> <span>${cgstAmount.toFixed(2)}</span></div>
                        <div class="tax-row"><span>Add: SGST</span> <span>${sgstAmount.toFixed(2)}</span></div>
                        <div class="tax-row"><span>Add: IGST</span> <span>0.00</span></div>
                        <div class="tax-row" style="border-top: 1px solid #000;"><span>Total Tax Amount:</span> <span>${(invoice.tax || 0).toFixed(2)}</span></div>
                        <div class="tax-row final"><span>Total Amount after Tax:</span> <span>${parseFloat(invoice.total).toFixed(2)}</span></div>
                        <div class="tax-row" style="border-top: 1px solid #000; font-size: 9px; justify-content: center;">GST on Reverse Charge: No</div>
                    </div>
                </div>

                <div class="bottom-section">
                    <div class="bank-details">
                        <b>Bank Details</b><br/>
                        ${store.upiId ? `UPI/Paypal: ${store.upiId}<br/>` : ''}
                        <b>Terms & Conditions:</b><br/>
                        ${invoiceSettings.termsAndConditions || '1. Goods once sold will not be taken back.<br/>2. Subject to local jurisdiction.'}
                    </div>
                    <div class="signature-box">
                        <div style="font-size: 10px;">Certified that the particulars given above are true and correct</div>
                        <div style="font-weight: bold;">For ${store.name || 'Store'}</div>
                        <br/><br/>
                        <div>Authorised Signatory</div>
                    </div>
                </div>
            </div >
    <div style="text-align: center; margin-top: 10px; font-size: 9px;">System Generated Invoice</div>
`;
    }


    // --- Main Assembly ---
    const printWindow = window.open('', '', 'height=800,width=1000');
    if (!printWindow) {
        alert('Popups blocked. Please allow.');
        return;
    }

    const html = `
    < html >
            <head>
                <title>Invoice #${invoice.id}</title>
                <style>
                    ${isBill ? getBillStyles() :
            isGstDetailed ? getGstDetailedStyles() :
                isMinimal ? getMinimalStyles() :
                    isCompact ? getCompactStyles() :
                        getClassicStyles()}
                </style>
            </head>
            <body>
                ${isBill ? generateBillHTML() :
            isGstDetailed ? generateGstDetailedHTML() :
                isMinimal ? generateMinimalHTML() :
                    isCompact ? generateCompactHTML() :
                        generateClassicHTML()}

                <script>
                    window.onload = function() {
                        window.print();
                        // Optional: Close after print (commented out as it can be abrupt)
                        // window.onafterprint = function() { window.close(); };
                    }
                </script>
            </body>
        </html >
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
};

export default printReceipt;
