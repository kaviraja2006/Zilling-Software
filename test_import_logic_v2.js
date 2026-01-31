// Standalone test script - no dependencies needed

const parseProductDataCurrent = (rawP) => {
    // Current Logic in ProductContext.jsx
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

    const price = parseFloat(getVal(['price', 'mrp', 'rate', 'amount', 'selling price', 'sp', 'unit price'])) || 0;
    const costPrice = parseFloat(getVal(['cost price', 'cp', 'buying price', 'purchase price', 'cost'])) || 0;

    return { price, costPrice };
};

const parseProductDataRobust = (rawP) => {
    // Proposed Robust Logic
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

    const parseMoney = (val) => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
            // Remove currency symbols, spaces, commas, etc. Keep digits and dots.
            const cleaned = val.replace(/[^0-9.-]/g, '');
            return parseFloat(cleaned) || 0;
        }
        return 0;
    };

    const price = parseMoney(getVal(['price', 'mrp', 'rate', 'amount', 'selling price', 'sp', 'unit price']));
    const costPrice = parseMoney(getVal(['cost price', 'cp', 'buying price', 'purchase price', 'cost']));

    return { price, costPrice };
};

// Test Cases
const testCases = [
    { "NAME": "Normal", "COST PRICE": 50, "PRICE": 100 },
    { "NAME": "Strings", "Cost Price": "60", "Price": "120" },
    { "NAME": "Short Keys", "CP": 70, "SP": 140 },
    { "NAME": "Currency Symbol", "COST PRICE": "₹ 80.50", "PRICE": "₹ 160.00" },
    { "NAME": "Missing", "COST PRICE": undefined, "PRICE": undefined },
    { "NAME": "Extra Spaces", " cost price ": 90, " PRICE ": 180 },
    { "NAME": "Commas", "COST PRICE": "1,200.50", "PRICE": "2,400.00" }
];

console.log("Running Import Parsing Tests...\n");

testCases.forEach((t, i) => {
    console.log(`Test Case ${i + 1} (${t.NAME}):`, JSON.stringify(t));

    // Simulate current behavior
    const current = parseProductDataCurrent(t);
    console.log("  [Current] Result:", JSON.stringify(current));

    // Simulate robust behavior
    const robust = parseProductDataRobust(t);
    console.log("  [Robust]  Result:", JSON.stringify(robust));

    if (current.costPrice !== robust.costPrice) {
        console.log("  *** IMPROVEMENT DETECTED ***");
    }
    console.log("");
});
