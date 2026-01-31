const mongoose = require('mongoose');

const customerSchema = mongoose.Schema(
    {
        customerId: {
            type: String,
            unique: true,
            sparse: true // Allow null for existing records during migration
        },
        firstName: { type: String, required: [true, 'First name is required'] },
        lastName: { type: String, default: '' },
        customerType: {
            type: String,
            enum: ['Individual', 'Business'],
            default: 'Individual'
        },
        gstin: {
            type: String,
            validate: {
                validator: function (v) {
                    // GSTIN is required only for Business type
                    if (this.customerType === 'Business' && !v) {
                        return false;
                    }
                    // If GSTIN is provided, validate format (15 characters alphanumeric)
                    if (v && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v)) {
                        return false;
                    }
                    return true;
                },
                message: 'Invalid GSTIN format'
            }
        },
        email: { type: String },
        phone: { type: String, required: [true, 'Phone number is required'] },
        address: {
            street: { type: String, default: '' },
            area: { type: String, default: '' },
            city: { type: String, default: '' },
            pincode: { type: String, default: '' },
            state: { type: String, default: '' }
        },
        source: {
            type: String,
            enum: ['Walk-in', 'WhatsApp', 'Instagram', 'Referral', 'Other'],
            default: 'Walk-in'
        },
        tags: [{
            type: String,
            enum: ['VIP', 'Wholesale', 'Credit']
        }],
        loyaltyPoints: { type: Number, default: 0 },
        notes: { type: String, default: '' },
        totalVisits: { type: Number, default: 0 },
        totalSpent: { type: Number, default: 0 },
        due: { type: Number, default: 0 },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        // Soft delete fields
        isDeleted: {
            type: Boolean,
            default: false
        },
        deletedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true,
    }
);

// Virtual for full name
customerSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`.trim();
});

// Ensure virtuals are included in JSON
customerSchema.set('toJSON', { virtuals: true });
customerSchema.set('toObject', { virtuals: true });

// Indexes for fast duplicate detection
customerSchema.index({ phone: 1, userId: 1 });
customerSchema.index({ email: 1, userId: 1 });

// Query middleware to filter out soft-deleted records
customerSchema.pre('find', function() {
    this.where({ isDeleted: false });
});

customerSchema.pre('findOne', function() {
    this.where({ isDeleted: false });
});

customerSchema.pre('countDocuments', function() {
    this.where({ isDeleted: false });
});

// Pre-save hook to auto-generate customerId
customerSchema.pre('save', async function () {
    if (!this.customerId && this.isNew) {
        try {
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateStr = `${year}${month}${day}`;
            const prefix = `CUS-${dateStr}-`;

            // Use the native MongoDB collection to bypass all Mongoose middleware (soft-delete)
            // This is the most reliable way to ensure we see ALL records including deleted ones.
            const collection = mongoose.connection.db.collection('customers');
            const lastRecords = await collection.find({
                customerId: new RegExp(`^${prefix}`)
            })
            .sort({ customerId: -1 })
            .limit(1)
            .toArray();

            let sequence = 1;
            if (lastRecords && lastRecords.length > 0) {
                const lastId = lastRecords[0].customerId;
                if (lastId) {
                    const parts = lastId.split('-');
                    if (parts.length >= 3) {
                        const lastSeq = parseInt(parts[2]);
                        if (!isNaN(lastSeq)) {
                            sequence = lastSeq + 1;
                        }
                    }
                }
            }

            this.customerId = `${prefix}${sequence.toString().padStart(4, '0')}`;
        } catch (error) {
            console.error('CRITICAL ERROR during customerId generation:', error);
            // Default to a timestamp-based ID if the sequence logic fails, to prevent a 500 error
            this.customerId = `CUS-${Date.now()}`;
        }
    }
});

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
