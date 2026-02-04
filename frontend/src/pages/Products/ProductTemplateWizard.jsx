import React from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { downloadProductTemplate } from '../../utils/downloadProductTemplate';

const headers = [
  'NAME', 'SKU', 'BARCODE', 'CATEGORY', 'BRAND', 'COST PRICE', 'PRICE', 'STOCK', 'UNIT', 'TAX', 'STATUS'
];
const exampleRow = [
  'Sample Product', 'SKU123', '1234567890123', 'Beverages', 'BrandX', 50, 100, 50, 'pc', 18, 'Active'
];

export default function ProductTemplateWizard({ open, onClose }) {
  return (
    <Modal isOpen={open} onClose={onClose} title="Product Import Template">
      <div className="space-y-4">
        <div className="text-slate-700 text-sm">
          <p>Fill in your product details in this format to import products. <b>Do not change column order or names.</b></p>
          <p><b>STATUS</b> should be <b>"Active"</b> or <b>"Inactive"</b>.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-slate-200 rounded-lg">
            <thead className="bg-slate-100">
              <tr>
                {headers.map(h => (
                  <th key={h} className="px-3 py-2 border-b border-slate-200 text-left text-xs font-semibold text-slate-700 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white">
                {exampleRow.map((cell, i) => (
                  <td key={i} className="px-3 py-2 border-b border-slate-100 text-slate-800 text-sm">{cell}</td>
                ))}
              </tr>
              <tr className="bg-slate-50">
                {headers.map((_, i) => (
                  <td key={i} className="px-3 py-2 text-slate-400 text-sm">(your data)</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <div className="flex justify-end space-x-2">
          <Button onClick={downloadProductTemplate} variant="primary">Download Excel</Button>
          <Button onClick={onClose} variant="outline">Close</Button>
        </div>
      </div>
    </Modal>
  );
}
