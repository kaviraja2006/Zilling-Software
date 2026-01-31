const xlsx = require('./frontend/node_modules/xlsx');
const path = require('path');

const userFile = String.raw`c:\Users\kaviraja\Downloads\Product_Import_Template (3).xlsx`;

console.log(`Reading file: ${userFile}`);

try {
    const wb = xlsx.readFile(userFile);
    const wsname = wb.SheetNames[0];
    const ws = wb.Sheets[wsname];

    // 1. Inspect Raw Data (First 5 rows)
    const rawData = xlsx.utils.sheet_to_json(ws, { header: 1 });
    console.log("\n--- Raw Data (First 5 rows) ---");
    console.log(JSON.stringify(rawData.slice(0, 5), null, 2));

    // 2. Simulate ProductsPage Header Detection
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(rawData.length, 20); i++) {
        const row = rawData[i];
        if (row && Array.isArray(row)) {
            const rowStr = row.map(c => String(c).toLowerCase());
            if (rowStr.includes('name') || rowStr.includes('product name') || rowStr.includes('sku')) {
                headerRowIndex = i;
                break;
            }
        }
    }
    console.log(`\n--- Detected Header Row Index: ${headerRowIndex} ---`);

    // 3. Simulate sheet_to_json with detected header
    const data = xlsx.utils.sheet_to_json(ws, { range: headerRowIndex });
    console.log(`\n--- Parsed Data (First 3 items) ---`);
    console.log(JSON.stringify(data.slice(0, 3), null, 2));

    // 4. Simulate ProductContext Key Normalization for the first item
    if (data.length > 0) {
        const rawP = data[0];
        const p = {};
        Object.keys(rawP).forEach(key => {
            p[key.trim().toLowerCase()] = rawP[key];
        });
        console.log(`\n--- Normalized First Item Keys ---`);
        console.log(Object.keys(p));
        console.log("Values:", p);
    }

} catch (err) {
    console.error("Error reading file:", err);
}
