// Utility to generate and download a product Excel template for import
import { utils, writeFile } from 'xlsx';

export function downloadProductTemplate() {
  // Define the columns and example row
  const headers = [
    'NAME', 'SKU', 'BARCODE', 'CATEGORY', 'BRAND', 'COST PRICE', 'PRICE', 'STOCK', 'UNIT', 'TAX', 'STATUS'
  ];
  const exampleRow = [
    'Sample Product', 'SKU123', '1234567890123', 'Beverages', 'BrandX', 50, 100, 50, 'pc', 18, 'Active'
  ];
  // Note: Putting headers on the first row for better compatibility with import parsers

  // Sheet data: headers, example, empty row, then notes
  const data = [
    headers,
    exampleRow,
    ['', '', '', '', '', '', '', '', '', ''], // Empty row for user
  ];

  const ws = utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 30 }, // Name
    { wch: 15 }, // SKU
    { wch: 15 }, // Barcode
    { wch: 20 }, // Category
    { wch: 15 }, // Brand
    { wch: 10 }, // Cost Price
    { wch: 10 }, // Price
    { wch: 10 }, // Stock
    { wch: 10 }, // Unit
    { wch: 10 }, // Tax
    { wch: 10 }  // Status
  ];

  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Product Import Template');
  writeFile(wb, 'Product_Import_Template.xlsx');
}
