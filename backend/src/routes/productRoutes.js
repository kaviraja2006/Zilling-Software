const express = require('express');
const router = express.Router();
const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    restoreProduct,
    fixIndexes,
    getProductStats,
    getProductByVariantBarcode,
    bulkDeleteProducts
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');

// Temp route to fix indexes
router.get('/fix-indexes', fixIndexes);

router.route('/').get(protect, getProducts).post(protect, createProduct);
router.route('/bulk-delete').post(protect, bulkDeleteProducts);

router.get('/:id/stats', protect, getProductStats);
router.post('/:id/restore', protect, restoreProduct);
router.get('/barcode/:barcode/variant', protect, getProductByVariantBarcode);

router
    .route('/:id')
    .get(protect, getProductById)
    .put(protect, updateProduct)
    .delete(protect, deleteProduct);

module.exports = router;
