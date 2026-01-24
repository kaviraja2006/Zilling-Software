export const printReceipt = (billData, format = '80mm', settings = {}) => {
    const {
        customerName,
        date,
        items,
        subtotal,
        tax,
        discount,
        total,
        paymentMode,
        id
    } = billData;

    // Handle Settings Structure (Root vs Flat Store)
    const store = settings.store || settings || {};
    const invoiceSettings = settings.invoice || {};
    const template = invoiceSettings.template || 'Classic'; // Classic, Modern, Minimal, Compact

    // Helper to format address
    const getAddressStr = (addr) => {
        if (!addr) return '';
        if (typeof addr === 'string') return addr;
        return [addr.street, addr.area, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ');
    };

    // Fallback defaults
    const storeName = store.name || 'MY STORE';
    const storeAddr = getAddressStr(store.address) || '123 Main Street, City';
    const storePhone = store.contact || '';
    const storeEmail = store.email || '';
    const footerMsg = store.footer || 'Thank you for shopping with us!';

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert("Please allow popups to print receipts.");
        return;
    }

    const isThermal = ['80mm', '58mm', '112mm', '128mm'].includes(format);
    const bodyWidth = { '80mm': '80mm', '58mm': '58mm', '112mm': '112mm', 'A4': '210mm', 'A5': '148mm' }[format] || '80mm';
    const fontSize = format === '58mm' ? '10px' : '12px';

    const getStyles = () => {
        let base = `
            * { box-sizing: border-box; }
            body { font-family: 'Inter', Helvetica, Arial, sans-serif; width: 100%; max-width: ${bodyWidth}; margin: 0 auto; padding: ${isThermal ? '5px 0' : '10mm'}; font-size: ${fontSize}; color: #333; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th { text-align: left; padding: 5px; font-size: 0.9em; }
            td { padding: 5px; vertical-align: top; }
            .totals { width: 40%; margin-left: auto; font-size: 0.9em; }
            .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
            @media print { body { width: 100%; padding: 0mm; } @page { size: ${isThermal ? 'auto' : format + ' portrait'}; margin: 5mm; } }
        `;

        if (isThermal) {
            return base + `
                .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 5px; }
                th { border-bottom: 1px dashed #000; }
                .footer { text-align: center; font-size: 9px; margin-top: 10px; }
            `;
        }

        // Sheet Template Styles
        if (template === 'Minimal') {
            return base + `
                .header { margin-bottom: 30px; }
                .store-title { font-size: 24px; font-weight: 300; letter-spacing: 1px; text-transform: uppercase; }
                .invoice-title { font-size: 14px; text-transform: uppercase; letter-spacing: 2px; color: #888; margin-top: 10px; }
                table { margin-top: 30px; }
                th { border-bottom: 1px solid #ddd; font-weight: 500; color: #666; text-transform: uppercase; font-size: 0.8em; }
                td { border-bottom: 1px solid #f5f5f5; padding: 10px 5px; }
                .totals { margin-top: 20px; font-weight: 300; }
                .grand-total { border-top: 1px solid #000; padding-top: 10px; font-weight: 600; font-size: 1.2em; }
            `;
        } else if (template === 'Compact') {
            return base + `
                body { padding: 0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .shape-top-right { position: fixed; top: 0; right: 0; width: 0; height: 0; border-style: solid; border-width: 0 150px 150px 0; border-color: transparent #008fa0 transparent transparent; z-index: -1; }
                .shape-top-right-2 { position: fixed; top: 0; right: 0; width: 0; height: 0; border-style: solid; border-width: 0 100px 100px 0; border-color: transparent #f0b4bf transparent transparent; z-index: -2; transform: translate(-40px, 0); }
                
                .shape-bottom-left { position: fixed; bottom: 0; left: 0; width: 0; height: 0; border-style: solid; border-width: 150px 0 0 150px; border-color: transparent transparent transparent #008fa0; z-index: -1; }
                .shape-bottom-left-2 { position: fixed; bottom: 0; left: 0; width: 0; height: 0; border-style: solid; border-width: 100px 0 0 100px; border-color: transparent transparent transparent #f0b4bf; z-index: -2; transform: translate(40px, 0); }
                
                .content-wrap { padding: 15mm 15mm 30mm 15mm; position: relative; }
                
                .compact-header { display: flex; justify-content: space-between; margin-top: 60px; margin-bottom: 50px; }
                .page-title { font-size: 42px; font-weight: 700; letter-spacing: 4px; color: #333; text-transform: uppercase; }
                
                .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
                .meta-col h3 { font-size: 14px; color: #666; margin-bottom: 5px; font-weight: 600; text-transform: uppercase; }
                .meta-col p { font-size: 14px; margin: 2px 0; color: #333; font-weight: 500; }
                
                table { margin-top: 20px; width: 100%; border-collapse: collapse; }
                th { background-color: #e5e7eb; color: #333; font-weight: 700; text-transform: uppercase; padding: 12px 10px; font-size: 11px; border: 1px solid #9ca3af; border-bottom: 1px solid #000; letter-spacing: 1px; }
                td { padding: 15px 10px; border-left: 1px solid #d1d5db; border-right: 1px solid #d1d5db; font-size: 13px; color: #4b5563; }
                tr:last-child td { border-bottom: 1px solid #000; }
                
                .compact-total { display: flex; justify-content: space-between; align-items: center; border: 1px solid #9ca3af; border-top: none; padding: 15px 20px; margin-top: -10px; background: #fff; }
                .grand-label { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #333; }
                .grand-value { font-size: 18px; font-weight: 800; color: #333; }
                
                .footer-section { display: flex; justify-content: space-between; margin-top: 60px; align-items: flex-end; }
                .notes { font-size: 12px; color: #666; line-height: 1.6; }
                .signature { text-align: center; border-top: 1px solid #333; padding-top: 10px; width: 200px; font-size: 12px; color: #666; }
                .sign-label { font-family: 'Times New Roman', serif; font-style: italic; font-size: 24px; color: #333; margin-bottom: 5px; }
            `;
        } else if (template === 'GST-Detailed') {
            return base + `
                body { padding: 10mm; font-size: 11px; }
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
                
                .footer-grid { display: flex; border-top: 2px solid #000; }
                .amount-words-col { flex: 1; border-right: 2px solid #000; padding: 5px; position: relative; }
                .tax-summary-col { width: 35%; display: flex; flex-direction: column; }
                
                .tax-row { display: flex; justify-content: space-between; padding: 2px 5px; border-bottom: 1px solid #000; font-size: 10px; }
                .tax-row.final { font-weight: bold; border-bottom: none; background: #eee; font-size: 12px; padding: 5px; }
                
                .bottom-section { display: flex; border-top: 2px solid #000; }
                .bank-details { flex: 1; border-right: 2px solid #000; padding: 5px; font-size: 10px; }
                .signature-box { flex: 1; padding: 5px; display: flex; flex-direction: column; justify-content: space-between; text-align: right; min-height: 80px; }
            `;
        } else if (template === 'Modern') {
            return base + `
                .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 40px; border-bottom: 4px solid #3b82f6; padding-bottom: 20px; }
                .store-title { font-size: 26px; font-weight: 800; color: #1e3a8a; }
                th { background: #f1f5f9; color: #334155; font-weight: 600; text-transform: uppercase; font-size: 0.8em; padding: 8px; }
                td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; }
                .totals { background: #f8fafc; padding: 15px; border-radius: 8px; width: 50%; }
                .grand-total { color: #2563eb; font-size: 1.4em; border-top: 2px solid #e2e8f0; margin-top: 5px; padding-top: 5px; }
            `;
        } else {
            // Classic (Default)
            return base + `
                .header-wrapper { display: flex; justify-content: space-between; margin-bottom: 40px; }
                .store-info h1 { margin: 0; font-size: 24px; color: #2d3748; }
                .store-info p { margin: 2px 0; font-size: 11px; color: #4a5568; }
                
                .invoice-details-box { text-align: right; }
                .invoice-title-large { font-size: 28px; font-weight: bold; color: #a0aec0; text-transform: uppercase; margin-bottom: 10px; }
                .inv-meta-table { border-collapse: collapse; margin-left: auto; width: 250px; }
                .inv-meta-table th { background: #e2e8f0; border: 1px solid #cbd5e0; font-size: 10px; text-align: center; padding: 4px; text-transform: uppercase; }
                .inv-meta-table td { border: 1px solid #cbd5e0; font-size: 12px; text-align: center; padding: 8px; font-weight: bold; }
                
                .section-header { background: #e2e8f0; border: 1px solid #cbd5e0; padding: 5px 10px; font-weight: bold; font-size: 11px; text-transform: uppercase; color: #2d3748; margin-bottom: 10px; width: 50%; }
                .client-info { padding-left: 10px; margin-bottom: 40px; font-size: 12px; }
                .client-info p { margin: 2px 0; }
                
                .classic-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                .classic-table th { background: #e2e8f0; border: 1px solid #cbd5e0; padding: 8px; text-align: left; font-size: 11px; text-transform: uppercase; }
                .classic-table td { border-left: 1px solid #cbd5e0; border-right: 1px solid #cbd5e0; padding: 10px 8px; font-size: 12px; }
                .classic-table tr:last-child td { border-bottom: 1px solid #cbd5e0; }
                
                .classic-footer-row { display: flex; justify-content: space-between; align-items: center; border: 1px solid #cbd5e0; padding: 10px; font-weight: bold; }
                .thank-you { font-style: italic; font-size: 12px; color: #4a5568; }
                
                .bottom-contact { text-align: center; margin-top: 50px; font-size: 10px; color: #718096; }
            `;
        }
    };

    let content = '';

    const commonItems = `
        <tbody>
            ${items.map((item, i) => `
            <tr>
                <td>${isThermal ? item.name : i + 1}</td>
                ${!isThermal ? `<td>${item.name}${item.sku ? `<br/><span style="font-size:10px;color:#888">${item.sku}</span>` : ''}</td>` : ''}
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">${parseFloat(item.price).toFixed(2)}</td>
                <td class="text-right font-bold">${parseFloat(item.total).toFixed(2)}</td>
            </tr>`).join('')}
        </tbody>
    `;

    if (isThermal) {
        content = `
            <div class="header">
                <div style="font-size: 1.2em; font-weight: bold;">${storeName}</div>
                <div>${storeAddr}</div>
                <div>${storePhone}</div>
            </div>
            <div style="font-size: 0.9em; margin-bottom: 5px;">
                <div class="row"><span>Inv No:</span> <b>${id ? id.slice(-6).toUpperCase() : 'N/A'}</b></div>
                <div class="row"><span>Date:</span> <span>${new Date(date).toLocaleDateString()}</span></div>
                <div>Customer: ${customerName}</div>
            </div>
            <table>
                <thead><tr><th>Item</th><th class="text-right">Qty</th><th class="text-right">Price</th><th class="text-right">Total</th></tr></thead>
                ${commonItems}
            </table>
            <div style="border-top: 1px dashed #000; padding-top: 5px;">
                <div class="row"><span>Subtotal</span><span>${parseFloat(subtotal).toFixed(2)}</span></div>
                ${tax > 0 ? `<div class="row"><span>Tax</span><span>${parseFloat(tax).toFixed(2)}</span></div>` : ''}
                ${discount > 0 ? `<div class="row"><span>Discount</span><span>-${parseFloat(discount).toFixed(2)}</span></div>` : ''}
                <div class="row" style="font-size: 1.1em; font-weight: bold; margin-top: 5px;"><span>Total</span><span>${parseFloat(total).toFixed(2)}</span></div>
                ${(billData.balance > 0) ? `<div class="row"><span>Due</span><span>${parseFloat(billData.balance).toFixed(2)}</span></div>` : ''}
            </div>
            <div class="footer">${footerMsg}</div>
        `;
    } else if (template === 'GST-Detailed') {
        // --- GST DETAILED LAYOUT (Govt Format) ---
        // Calculate tax breakdown
        const totalTaxable = items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
        const cgstAmount = tax / 2;
        const sgstAmount = tax / 2;

        content = `
            <div class="container">
                <div class="header-row">
                    <div class="logo-box">
                        ${store.logoUrl ? `<img src="${store.logoUrl}" style="max-width:80px;" />` : '<b>LOGO</b>'}
                    </div>
                    <div class="company-box">
                        <div style="font-size: 22px; font-weight: bold;">${storeName}</div>
                        <div>${storeAddr}</div>
                        <div>Tel: ${storePhone}</div>
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
                            <b>Invoice No:</b> ${id ? id.slice(-8).toUpperCase() : ''}<br/>
                            <b>Invoice Date:</b> ${new Date(date).toLocaleDateString()}
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
                            <b>Date of Supply:</b> ${new Date(date).toLocaleDateString()}<br/>
                            <b>Place of Supply:</b> ${customerName ? 'Local' : ''}
                        </td>
                    </tr>
                </table>

                <div class="party-row">
                    <div class="party-col">
                        <div class="party-header">Detail of Receiver (Billed to)</div>
                        <div><b>Name:</b> ${customerName}</div>
                        <div><b>Address:</b> -</div>
                        <div><b>GSTIN:</b> -</div>
                        <div><b>State:</b> -</div>
                    </div>
                    <div class="party-col">
                        <div class="party-header">Detail of Consignee (Shipped to)</div>
                        <div><b>Name:</b> ${customerName}</div>
                        <div><b>Address:</b> -</div>
                        <div><b>GSTIN:</b> -</div>
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
                        ${items.map((item, i) => `
                        <tr>
                            <td class="text-center">${i + 1}</td>
                            <td>${item.name}</td>
                            <td class="text-center">${item.hsnCode || '-'}</td>
                            <td class="text-center">${item.quantity}</td>
                            <td class="text-right">${parseFloat(item.price).toFixed(2)}</td>
                            <td class="text-right">${(item.quantity * item.price).toFixed(2)}</td>
                            <!-- Approximate tax split mechanism -->
                            <td class="text-center">${item.taxRate ? (item.taxRate / 2) + '%' : '0%'}</td>
                            <td class="text-right">${item.taxRate ? ((item.total * (item.taxRate / 100)) / 2).toFixed(2) : '0.00'}</td>
                            <td class="text-center">${item.taxRate ? (item.taxRate / 2) + '%' : '0%'}</td>
                            <td class="text-right">${item.taxRate ? ((item.total * (item.taxRate / 100)) / 2).toFixed(2) : '0.00'}</td>
                            <td class="text-right font-bold">${parseFloat(item.total).toFixed(2)}</td>
                        </tr>
                        `).join('')}
                        <!-- Fill empty rows to maintain height if needed, skipping for dynamic -->
                        <tr style="background: #eee; font-weight: bold;">
                            <td colspan="5" class="text-right">Total</td>
                            <td class="text-right">${totalTaxable.toFixed(2)}</td>
                            <td class="text-center"></td>
                            <td class="text-right">${cgstAmount.toFixed(2)}</td>
                            <td class="text-center"></td>
                            <td class="text-right">${sgstAmount.toFixed(2)}</td>
                            <td class="text-right">${parseFloat(total).toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="footer-grid">
                    <div class="amount-words-col">
                        <b>Total Invoice Amount in Words:</b><br/>
                        <div style="margin-top: 5px; font-style: italic;">
                            ${amountToWords(total)} Only
                        </div>
                    </div>
                    <div class="tax-summary-col">
                        <div class="tax-row"><span>Total Amount before Tax:</span> <span>${totalTaxable.toFixed(2)}</span></div>
                        <div class="tax-row"><span>Add: CGST</span> <span>${cgstAmount.toFixed(2)}</span></div>
                        <div class="tax-row"><span>Add: SGST</span> <span>${sgstAmount.toFixed(2)}</span></div>
                        <div class="tax-row"><span>Add: IGST</span> <span>0.00</span></div>
                        <div class="tax-row" style="border-top: 1px solid #000;"><span>Total Tax Amount:</span> <span>${tax.toFixed(2)}</span></div>
                        <div class="tax-row final"><span>Total Amount after Tax:</span> <span>${parseFloat(total).toFixed(2)}</span></div>
                        <div class="tax-row" style="border-top: 1px solid #000; font-size: 9px; justify-content: center;">GST on Reverse Charge: No</div>
                    </div>
                </div>

                <div class="bottom-section">
                    <div class="bank-details">
                        <b>Bank Details</b><br/>
                        Bank Name: HDFC Bank<br/>
                        Bank A/C: XXXXXXXXXX<br/>
                        Bank IFSC: HDFC000XXXX<br/><br/>
                        <b>Terms & Conditions:</b><br/>
                        1. Goods once sold will not be taken back.<br/>
                        2. Subject to local jurisdiction.
                    </div>
                    <div class="signature-box">
                        <div style="font-size: 10px;">Certified that the particulars given above are true and correct</div>
                        <div style="font-weight: bold;">For ${storeName}</div>
                        <br/><br/>
                        <div>Authorised Signatory</div>
                    </div>
                </div>
            </div>
            <div style="text-align: center; margin-top: 10px; font-size: 9px;">System Generated Invoice</div>
        `;
    } else if (template === 'Compact') {
        // --- COMPACT / MODERN GEO LAYOUT ---
        content = `
            ${isThermal ? '' : `
            <div class="shape-top-right"></div>
            <div class="shape-top-right-2"></div>
            <div class="shape-bottom-left"></div>
            <div class="shape-bottom-left-2"></div>
            `}
            
            <div class="content-wrap">
                <div class="compact-header">
                    <div class="page-title">INVOICE</div>
                </div>

                <div class="meta-grid">
                    <div class="meta-col">
                        <h3>Date Issued:</h3>
                        <p>${new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        
                        <h3 style="margin-top: 15px;">Invoice No:</h3>
                        <p>#${id ? id.slice(-6).toUpperCase() : 'N/A'}</p>
                    </div>
                    <div class="meta-col">
                        <h3>Issued To:</h3>
                        <p>${customerName}</p>
                        <p>${getAddressStr(store.address) || 'N/A'}</p>
                    </div>
                </div>

                <div style="font-size: 10px; color: #666; margin-bottom: 20px;">
                    <b>Vendor:</b><br/>
                    ${storeName}<br/>
                    ${storeAddr}<br/>
                    Tel: ${storePhone} | ${storeEmail}<br/>
                    ${store.website || ''}
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 10%;">No</th>
                            <th style="width: 50%;">Description</th>
                            <th style="width: 10%;" class="text-center">Qty</th>
                            <th style="width: 15%;" class="text-center">Price</th>
                            <th style="width: 15%;" class="text-center">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map((item, i) => `
                        <tr>
                            <td class="text-center">${i + 1}</td>
                            <td>${item.name}</td>
                            <td class="text-center">${item.quantity}</td>
                            <td class="text-center">${parseFloat(item.price).toFixed(2)}</td>
                            <td class="text-center">${parseFloat(item.total).toFixed(2)}</td>
                        </tr>
                        `).join('')}
                        <!-- Fill empty rows visual if needed, but keeping it dynamic as per data -->
                        ${Array(Math.max(0, 5 - items.length)).fill(0).map(() => `
                        <tr><td style="height:35px"></td><td></td><td></td><td></td><td></td></tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="compact-total">
                    <span class="grand-label">GRAND TOTAL</span>
                    <span class="grand-value">₹${parseFloat(total).toFixed(2)}</span>
                </div>

                <div class="footer-section">
                    <div class="notes">
                        <b>Note:</b><br/>
                        ${store.name}<br/>
                        Account: XXXXX-XXXXX<br/>
                        ${footerMsg}
                    </div>
                    <div style="text-align: center;">
                        <div class="sign-label">Authorized</div>
                        <div class="signature">Finance Manager</div>
                    </div>
                </div>
            </div>
        `;
    } else {
        // SHEET TEMPLATES (Minimal, Modern, Classic)
        const headerContent = template === 'Modern' ? `
            <div class="header">
                <div>
                    <div class="store-title">${storeName}</div>
                    <div>${storeAddr}</div>
                    <div>${storePhone}</div>
                    ${storeEmail ? `<div>${storeEmail}</div>` : ''}
                </div>
                <div class="text-right">
                    <div style="font-size: 3em; color: #e2e8f0; font-weight: bold;">INVOICE</div>
                    <div>#${id ? id.slice(-8).toUpperCase() : 'N/A'}</div>
                    <div>${new Date(date).toLocaleDateString()}</div>
                </div>
            </div>
        ` : template === 'Minimal' ? `
            <div class="header">
                <div class="store-title">${storeName}</div>
                <div style="color: #666;">${storeAddr} | ${storePhone}</div>
                <div class="invoice-title">Invoice #${id ? id.slice(-8).toUpperCase() : 'N/A'} • ${new Date(date).toLocaleDateString()}</div>
            </div>
        ` : `
            <div class="header">
                <div class="store-title">${storeName}</div>
                <div>${storeAddr}</div>
                <div>Phone: ${storePhone}</div>
                ${storeEmail ? `<div>${storeEmail}</div>` : ''}
                ${store.website ? `<div>${store.website}</div>` : ''}
                <div style="margin-top:5px; font-weight:bold;">GSTIN: ${store.gstin || 'N/A'}</div>
            </div>
            <div class="meta-box">
                <div>
                    <b>Bill To:</b><br/>
                    ${customerName}<br/>
                    ${paymentMode || 'Cash'}
                </div>
                <div class="text-right">
                    <b>Invoice Details:</b><br/>
                    No: #${id ? id.slice(-8).toUpperCase() : 'N/A'}<br/>
                    Date: ${new Date(date).toLocaleDateString()}
                </div>
            </div>
        `; // Classic

        content = `
            ${headerContent}
            ${template === 'Modern' ? `<div style="margin-bottom: 20px;"><b>Bill To:</b> ${customerName}</div>` : ''}
            ${template === 'Minimal' ? `<div style="margin-bottom: 40px; font-size: 1.1em;">Billed to <b>${customerName}</b></div>` : ''}

            <table>
                <thead>
                    <tr>
                        <th style="width: 5%">#</th>
                        <th>Item Description</th>
                        <th class="text-right">Qty</th>
                        <th class="text-right">Unit Price</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                ${commonItems}
            </table>

            <div class="totals">
                <div class="row"><span>Subtotal</span><span>${parseFloat(subtotal).toFixed(2)}</span></div>
                ${tax > 0 ? `<div class="row"><span>Tax</span><span>${parseFloat(tax).toFixed(2)}</span></div>` : ''}
                ${discount > 0 ? `<div class="row" style="color: red;"><span>Discount</span><span>-${parseFloat(discount).toFixed(2)}</span></div>` : ''}
                <div class="row grand-total"><span>Grand Total</span><span>${parseFloat(total).toFixed(2)}</span></div>
                <div style="margin-top: 10px; font-style: italic; color: #666; font-size: 0.9em;">
                    Amount in words: ${amountToWords(total)} Only
                </div>
            </div>

            <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 10px; font-size: 0.8em; color: #888;">
                <p><b>Terms:</b> Goods once sold will not be taken back.</p>
                <div class="text-center" style="margin-top: 20px;">${footerMsg}</div>
                <div class="text-center" style="font-size: 10px; margin-top: 5px;">Generated by KwiqBill</div>
            </div>
        `;
    }

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Print Invoice</title>
            <style>${getStyles()}</style>
        </head>
        <body>
            ${content}
            <script>
                window.onload = function() { window.print(); }
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
};

// Helper for A4/A5 visual polish
const amountToWords = (amount) => {
    // Simple mock for now, can use 'number-to-words' library if installed
    return "Rupees " + Math.round(amount) + "";
};
