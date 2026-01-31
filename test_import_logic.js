const xlsx = require('xlsx');

// Mock function representing the logic in ProductContext.jsx
const parseProductData = (rawP) => {
    // Normalize keys: trim and lowercase
    const p = {};
    Object.keys(rawP).forEach(key => {
        p[key.trim().toLowerCase()] = rawP[key];
    });

    const getVal = (keys) => {
        for (let k of keys) {
            if (p[k] !== undefined) return p[k];
        }
        return undefined;
    };

    const name = getVal(['name', 'product name', 'productname', 'item', 'item name', 'title']) || 'Imported Product';

    // Improved parsing logic to test (simulating potential fix)
    const parseMoney = (val) => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
            // Remove currency symbols and commas, then parse
            const cleaned = val.replace(/[^0-9.-]/g, '');
            return parseFloat(cleaned) || 0;
        }
        return 0;
    };

    const rawPrice = getVal(['price', 'mrp', 'rate', 'amount', 'selling price', 'sp', 'unit price']);
    const rawCostPrice = getVal(['cost price', 'cp', 'buying price', 'purchase price', 'cost']);

    const price = parseMoney(rawPrice);
    const costPrice = parseMoney(rawCostPrice);

    return {
        name,
        rawPrice,
        price,
        rawCostPrice,
        costPrice
    };
};

// Test Cases
const testCases = [
    { "NAME": "Test Item 1", "COST PRICE": 50, "PRICE": 100 },
    { "Name": "Test Item 2", "Cost Price": "60", "Price": "120" },
    { "PRODUCT NAME": "Test Item 3", "CP": 70, "SP": 140 },
    { "NAME": "Test Item 4", "COST PRICE": "₹ 80.50", "PRICE": "₹ 160.00" }, // Currency symbol
    { "NAME": "Test Item 5", "COST PRICE": undefined, "PRICE": undefined },
    { "NAME": "Test Item 6", "cost price ": 90, " PRICE ": 180 } // Extra spaces in keys
];

console.log("Running Import Parsing Tests...");
testCases.forEach((t, i) => {
    console.log(`\nTest Case ${i + 1}:`, JSON.stringify(t));
    const result = parseProductData(t);
    console.log("Result:", JSON.stringify(result));
});
