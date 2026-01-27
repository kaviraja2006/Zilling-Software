const mongoose = require('mongoose');
require('dotenv').config();

async function dropVariantIndexes() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Get the products collection
        const db = mongoose.connection.db;
        const collection = db.collection('products');

        // List all indexes
        console.log('\n📋 Current indexes:');
        const indexes = await collection.indexes();
        indexes.forEach(index => {
            console.log(`  - ${index.name}:`, JSON.stringify(index.key));
        });

        // Drop the problematic variant indexes
        const indexesToDrop = [
            'variants.sku_1_userId_1',
            'variants.barcode_1_userId_1'
        ];

        console.log('\n🗑️  Dropping variant indexes...');
        for (const indexName of indexesToDrop) {
            try {
                await collection.dropIndex(indexName);
                console.log(`  ✅ Dropped index: ${indexName}`);
            } catch (error) {
                if (error.code === 27) {
                    console.log(`  ⚠️  Index not found: ${indexName} (already dropped or never existed)`);
                } else {
                    console.log(`  ❌ Error dropping ${indexName}:`, error.message);
                }
            }
        }

        // List indexes after dropping
        console.log('\n📋 Remaining indexes:');
        const remainingIndexes = await collection.indexes();
        remainingIndexes.forEach(index => {
            console.log(`  - ${index.name}:`, JSON.stringify(index.key));
        });

        console.log('\n✅ Done!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

dropVariantIndexes();
