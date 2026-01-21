const mongoose = require('mongoose');

const invoiceSchema = mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
            required: false, // Could be guest
        },
        customerName: {
            type: String,
            required: true,
        },
        date: {
            type: Date,
            required: true,
            default: Date.now,
        },
        type: {
            type: String,
            enum: ['Retail', 'Tax', 'Estimate'],
            default: 'Retail'
        },
        items: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true,
                },
                name: { type: String, required: true },
                quantity: { type: Number, required: true },
                price: { type: Number, required: true },
                total: { type: Number, required: true },
            },
        ],
        grossTotal: { type: Number },
        itemDiscount: { type: Number, default: 0 },
        subtotal: { type: Number, required: true },
        tax: { type: Number, required: true, default: 0 },
        discount: { type: Number, required: true, default: 0 },
        additionalCharges: { type: Number, default: 0 },
        roundOff: { type: Number, default: 0 },
        total: { type: Number, required: true },
        status: {
            type: String,
            required: true,
            default: 'Paid',
            enum: ['Paid', 'Partially Paid', 'Unpaid', 'Refunded', 'Cancelled', 'Voided']
        },
        paymentStatus: { // Redundant but explicit for filtering
            type: String,
            enum: ['Paid', 'Partially Paid', 'Unpaid', 'Refunded', 'Cancelled'],
            default: 'Paid'
        },
        paymentMethod: { type: String, default: 'Cash' },
        balance: { type: Number, default: 0 },
        internalNotes: { type: String, default: '' },
        isLocked: { type: Boolean, default: false },
        payments: [{
            amount: Number,
            method: String,
            date: { type: Date, default: Date.now },
            note: String
        }],
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
    },
    {
        timestamps: true,
    }
);

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
