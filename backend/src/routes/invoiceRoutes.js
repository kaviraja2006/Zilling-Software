const express = require('express');
const router = express.Router();
const {
    getInvoices,
    getInvoiceById,
    createInvoice,
    deleteInvoice,
    getInvoiceStats,
    updateInvoice,
    bulkDeleteInvoices
} = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getInvoices).post(protect, createInvoice);
router.route('/bulk-delete').post(protect, bulkDeleteInvoices);
router.route('/stats').get(protect, getInvoiceStats);
router.route('/:id').get(protect, getInvoiceById).put(protect, updateInvoice).delete(protect, deleteInvoice);

module.exports = router;
