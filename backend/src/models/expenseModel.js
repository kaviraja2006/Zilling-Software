const mongoose = require('mongoose');

const expenseSchema = mongoose.Schema(
    {
        title: { type: String, required: true },
        amount: { type: Number, required: true },
        date: { type: Date, required: true, default: Date.now },
        category: { type: String, required: true },
        description: { type: String },

        // Payment tracking
        paymentMethod: {
            type: String,
            enum: ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Bank Transfer', 'Cheque', 'Other'],
            default: 'Cash'
        },
        reference: { type: String }, // Bill number or transaction ID

        // Categorization
        tags: [{ type: String }],

        // Recurring expenses
        isRecurring: { type: Boolean, default: false },
        frequency: {
            type: String,
            enum: ['one-time', 'weekly', 'monthly', 'quarterly', 'yearly'],
            default: 'one-time'
        },
        nextDueDate: { type: Date },

        // Receipt attachment
        receiptUrl: { type: String },

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

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
