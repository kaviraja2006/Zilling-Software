const asyncHandler = require('express-async-handler');
const Expense = require('../models/expenseModel');
const Joi = require('joi');
const path = require('path');
const fs = require('fs');
const { cloudinary } = require('../config/cloudinary');

// @desc    Get all expenses
// @route   GET /expenses
// @access  Private
const getExpenses = asyncHandler(async (req, res) => {
    // Filter expenses by authenticated user's ID
    const expenses = await Expense.find({ userId: req.user._id }).sort({ date: -1 });
    const response = expenses.map(e => ({
        id: e._id,
        title: e.title,
        amount: e.amount,
        date: e.date,
        category: e.category,
        description: e.description,
        paymentMethod: e.paymentMethod,
        reference: e.reference,
        tags: e.tags,
        isRecurring: e.isRecurring,
        frequency: e.frequency,
        nextDueDate: e.nextDueDate,
        receiptUrl: e.receiptUrl
    }));
    res.json(response);
});

// @desc    Create an expense
// @route   POST /expenses
// @access  Private
const createExpense = asyncHandler(async (req, res) => {
    const schema = Joi.object({
        title: Joi.string().required(),
        amount: Joi.number().required(),
        category: Joi.string().required(),
        date: Joi.date().required(),
        description: Joi.string().allow('').optional(),
        paymentMethod: Joi.string().valid('Cash', 'Credit Card', 'Debit Card', 'UPI', 'Bank Transfer', 'Cheque', 'Other').optional(),
        reference: Joi.string().allow('').optional(),
        tags: Joi.array().items(Joi.string()).optional(),
        isRecurring: Joi.boolean().optional(),
        frequency: Joi.string().valid('one-time', 'weekly', 'monthly', 'quarterly', 'yearly').optional(),
        nextDueDate: Joi.date().allow('', null).optional(),
        receiptUrl: Joi.string().allow('').optional(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
        res.status(400);
        throw new Error(error.details[0].message);
    }

    const {
        title, amount, category, date, description,
        paymentMethod, reference, tags, isRecurring,
        frequency, nextDueDate, receiptUrl
    } = req.body;

    // Attach authenticated user's ID to the expense
    const expense = await Expense.create({
        title,
        amount,
        category,
        date,
        description,
        paymentMethod,
        reference,
        tags,
        isRecurring,
        frequency,
        nextDueDate,
        receiptUrl,
        userId: req.user._id
    });

    res.status(201).json({
        id: expense._id,
        title: expense.title,
        amount: expense.amount,
        category: expense.category,
        date: expense.date,
        description: expense.description,
        paymentMethod: expense.paymentMethod,
        reference: expense.reference,
        tags: expense.tags,
        isRecurring: expense.isRecurring,
        frequency: expense.frequency,
        nextDueDate: expense.nextDueDate,
        receiptUrl: expense.receiptUrl
    });
});

// @desc    Update an expense
// @route   PUT /expenses/:id
// @access  Private
const updateExpense = asyncHandler(async (req, res) => {
    const schema = Joi.object({
        title: Joi.string().optional(),
        amount: Joi.number().optional(),
        category: Joi.string().optional(),
        date: Joi.date().optional(),
        description: Joi.string().allow('').optional(),
        paymentMethod: Joi.string().valid('Cash', 'Credit Card', 'Debit Card', 'UPI', 'Bank Transfer', 'Cheque', 'Other').optional(),
        reference: Joi.string().allow('').optional(),
        tags: Joi.array().items(Joi.string()).optional(),
        isRecurring: Joi.boolean().optional(),
        frequency: Joi.string().valid('one-time', 'weekly', 'monthly', 'quarterly', 'yearly').optional(),
        nextDueDate: Joi.date().allow('', null).optional(),
        receiptUrl: Joi.string().allow('').optional(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
        res.status(400);
        throw new Error(error.details[0].message);
    }

    // Verify ownership: find expense by ID AND userId
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id });

    if (!expense) {
        res.status(404);
        throw new Error('Expense not found or unauthorized');
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
        expense[key] = req.body[key];
    });

    await expense.save();

    res.json({
        id: expense._id,
        title: expense.title,
        amount: expense.amount,
        category: expense.category,
        date: expense.date,
        description: expense.description,
        paymentMethod: expense.paymentMethod,
        reference: expense.reference,
        tags: expense.tags,
        isRecurring: expense.isRecurring,
        frequency: expense.frequency,
        nextDueDate: expense.nextDueDate,
        receiptUrl: expense.receiptUrl
    });
});

// @desc    Delete an expense (soft delete)
// @route   DELETE /expenses/:id
// @access  Private
const deleteExpense = asyncHandler(async (req, res) => {
    // Verify ownership: find expense by ID AND userId
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id });

    if (expense) {
        // Soft delete: mark as deleted instead of removing
        // Note: Receipt file is retained for recovery purposes
        expense.isDeleted = true;
        expense.deletedAt = new Date();
        await expense.save();
        res.json({ message: 'Expense deleted successfully' });
    } else {
        res.status(404);
        throw new Error('Expense not found or unauthorized');
    }
});

// @desc    Bulk update expenses
// @route   POST /expenses/bulk-update
// @access  Private
const bulkUpdateExpenses = asyncHandler(async (req, res) => {
    const schema = Joi.object({
        ids: Joi.array().items(Joi.string()).required(),
        updates: Joi.object({
            category: Joi.string().optional(),
            isRecurring: Joi.boolean().optional(),
            frequency: Joi.string().valid('one-time', 'weekly', 'monthly', 'quarterly', 'yearly').optional(),
            tags: Joi.array().items(Joi.string()).optional(),
        }).required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        res.status(400);
        throw new Error(error.details[0].message);
    }

    const { ids, updates } = req.body;

    // Update only expenses owned by the user
    const result = await Expense.updateMany(
        { _id: { $in: ids }, userId: req.user._id },
        { $set: updates }
    );

    res.json({
        message: 'Expenses updated successfully',
        modifiedCount: result.modifiedCount
    });
});

// @desc    Bulk delete expenses (soft delete)
// @route   POST /expenses/bulk-delete
// @access  Private
const bulkDeleteExpenses = asyncHandler(async (req, res) => {
    const schema = Joi.object({
        ids: Joi.array().items(Joi.string()).required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        res.status(400);
        throw new Error(error.details[0].message);
    }

    const { ids } = req.body;

    // Soft delete: update only expenses owned by the user
    const result = await Expense.updateMany(
        { _id: { $in: ids }, userId: req.user._id },
        { 
            $set: { 
                isDeleted: true, 
                deletedAt: new Date() 
            } 
        }
    );

    res.json({
        message: 'Expenses deleted successfully',
        deletedCount: result.modifiedCount
    });
});

// @desc    Restore a soft-deleted expense
// @route   POST /expenses/:id/restore
// @access  Private
const restoreExpense = asyncHandler(async (req, res) => {
    // Find expense including deleted ones
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id, isDeleted: true });

    if (expense) {
        expense.isDeleted = false;
        expense.deletedAt = null;
        await expense.save();
        res.json({ 
            message: 'Expense restored successfully',
            expense: {
                id: expense._id,
                title: expense.title,
                amount: expense.amount,
                category: expense.category,
                date: expense.date
            }
        });
    } else {
        res.status(404);
        throw new Error('Deleted expense not found or unauthorized');
    }
});

// @desc    Export expenses to CSV
// @route   GET /expenses/export/csv
// @access  Private
const exportExpensesToCSV = asyncHandler(async (req, res) => {
    const expenses = await Expense.find({ userId: req.user._id }).sort({ date: -1 });

    // CSV header
    const header = 'Title,Amount,Category,Date,Payment Method,Reference,Tags,Recurring,Frequency,Next Due Date,Notes\n';

    // CSV rows
    const rows = expenses.map(e => {
        const tags = e.tags ? e.tags.join(';') : '';
        const recurring = e.isRecurring ? 'Yes' : 'No';
        const nextDue = e.nextDueDate ? new Date(e.nextDueDate).toLocaleDateString() : '';
        const date = new Date(e.date).toLocaleDateString();

        return [
            `"${e.title}"`,
            e.amount,
            `"${e.category}"`,
            date,
            `"${e.paymentMethod || ''}"`,
            `"${e.reference || ''}"`,
            `"${tags}"`,
            recurring,
            `"${e.frequency || ''}"`,
            nextDue,
            `"${e.description || ''}"`
        ].join(',');
    }).join('\n');

    const csv = header + rows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=expenses-${Date.now()}.csv`);
    res.send(csv);
});

// @desc    Upload receipt for expense
// @route   POST /expenses/:id/receipt
// @access  Private
const uploadReceipt = asyncHandler(async (req, res) => {
    const { uploadToCloudinary, cloudinary } = require('../config/cloudinary');
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id });

    if (!expense) {
        res.status(404);
        throw new Error('Expense not found or unauthorized');
    }

    if (!req.file) {
        res.status(400);
        throw new Error('No file uploaded');
    }

    // Delete old receipt if exists
    if (expense.receiptUrl) {
        // Check if it's a local file
        if (expense.receiptUrl.startsWith('/uploads')) {
            const oldFilePath = path.join(__dirname, '../../', expense.receiptUrl);
            if (fs.existsSync(oldFilePath)) {
                fs.unlink(oldFilePath, (err) => {
                    if (err) console.error('Failed to delete local file:', err);
                });
            }
        }
        // Check if it's a Cloudinary URL
        else if (expense.receiptUrl.includes('cloudinary.com')) {
            const urlParts = expense.receiptUrl.split('/');
            const filenameWithExt = urlParts[urlParts.length - 1];
            // If it was a PDF/Raw file, the ID might include extension or be different. try best guess
            // Standard ID heuristic: folder/filename (without ext usually for images, with ext for raw)
            // But here we set public_id manually for raw files previously. 
            // Better strategy: try to delete as image first, if fails try raw? 
            // Or just try both.
            // Simplified: extract public_id from known structure 'expense-receipts/filename'

            // To be safe, we let Cloudinary handle deletion roughly or ignore error for now as improper deletion isn't critical blocker.
            // But let's try to do it right.
            const publicId = `expense-receipts/${filenameWithExt.split('.')[0]}`; // Image default
            const publicIdRaw = `expense-receipts/${filenameWithExt}`; // Raw default

            // Try destroying as image (default)
            cloudinary.uploader.destroy(publicId, (err, res) => { });
            // Try destroying as raw (for PDFs)
            cloudinary.uploader.destroy(publicIdRaw, { resource_type: 'raw' }, (err, res) => { });
        }
    }

    // Upload New File
    // Using resource_type: 'auto' allows Cloudinary to detect PDF and serve it as a document/image
    // which is better for inline browser viewing than 'raw'.
    const uploadOptions = {
        folder: 'expense-receipts',
        resource_type: 'auto',
    };

    try {
        const result = await uploadToCloudinary(req.file.buffer, uploadOptions);
        // Save secure URL
        expense.receiptUrl = result.secure_url;
        await expense.save();

        res.json({
            message: 'Receipt uploaded successfully',
            receiptUrl: expense.receiptUrl
        });
    } catch (uploadError) {
        console.error('Cloudinary Upload Error:', uploadError);
        res.status(500).json({ message: 'Failed to upload receipt to Cloudinary' });
    }
});

module.exports = {
    getExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    restoreExpense,
    bulkUpdateExpenses,
    bulkDeleteExpenses,
    exportExpensesToCSV,
    uploadReceipt,
};
