import React, { useState, useMemo } from 'react';
import { Button } from '../../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Search, Plus, Download, Upload, MoreHorizontal, Edit, Trash, Filter, ChevronDown, Copy, Eye, MoreVertical, ListChecks, Check } from 'lucide-react';
import { useProducts } from '../../context/ProductContext';
import { useSettings } from '../../context/SettingsContext';
import ProductDrawer from './ProductDrawer';

import ProductStats from './components/ProductStats';
import ProductToolbar from './components/ProductToolbar';
import ProductInsights from './components/ProductInsights';
import { read, utils, writeFile } from 'xlsx';

import ProductTemplateWizard from './ProductTemplateWizard';

const ProductsPage = () => {
    const { products, addProduct, addManyProducts, updateProduct, deleteProduct, bulkDeleteProducts, loading } = useProducts();
    const { settings } = useSettings();

    // UI State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null); // For Drawer (Edit)
    const [focusedProduct, setFocusedProduct] = useState(null);   // For Insights Panel
    const [isCategoryWizardOpen, setIsCategoryWizardOpen] = useState(false);
    const [viewMode, setViewMode] = useState('comfortable'); // 'compact' | 'comfortable'

    const [isSelectionMode, setIsSelectionMode] = useState(false);

    // Filter & Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        category: null,
        brand: null,
        status: 'all' // 'all', 'active', 'inactive', 'lowStock', 'outOfStock'
    });

    // Selection State
    const [selectedRows, setSelectedRows] = useState(new Set());

    // Extract Unique Categories & Brands (Memoized)
    const { uniqueCategories, uniqueBrands } = useMemo(() => {
        const categories = new Set();
        const brands = new Set();
        products.forEach(p => {
            categories.add(p.category || 'Uncategorized');
            if (p.brand) brands.add(p.brand);
        });
        return {
            uniqueCategories: [...categories].filter(Boolean).sort(),
            uniqueBrands: [...brands].sort()
        };
    }, [products]);

    // Filtering Logic
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            // Search
            const matchesSearch =
                (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (p.barcode && p.barcode.toString().includes(searchTerm)) ||
                (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));

            if (!matchesSearch) return false;

            // Category
            if (filters.category && p.category !== filters.category) return false;

            // Brand
            if (filters.brand && p.brand !== filters.brand) return false;

            // Status / Stock Filters
            if (filters.status === 'active' && !p.isActive) return false;
            if (filters.status === 'inactive' && p.isActive) return false;
            if (filters.status === 'lowStock' && (p.stock > (p.minStock || 10) || p.stock === 0)) return false;
            if (filters.status === 'outOfStock' && p.stock > 0) return false;

            return true;
        });
    }, [products, searchTerm, filters]);

    // Handlers
    const handleEdit = (product, e) => {
        e?.stopPropagation();
        setSelectedProduct(product);
        setIsDrawerOpen(true);
    };

    const handleAddNew = () => {
        setSelectedProduct(null);
        setIsDrawerOpen(true);
    };

    const handleDelete = async (id, e) => {
        e?.stopPropagation();
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await deleteProduct(id);
                if (focusedProduct?.id === id) setFocusedProduct(null);
            } catch (error) {
                alert('Failed to delete product');
            }
        }
    };

    const handleRowClick = (product) => {
        setFocusedProduct(product);
    };

    const handleSelectionChange = (id) => {
        const newSelected = new Set(selectedRows);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedRows(newSelected);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedRows(new Set(filteredProducts.map(p => p.id)));
        } else {
            setSelectedRows(new Set());
        }
    };

    const handleBulkDelete = async () => {
        if (window.confirm(`Are you sure you want to delete ${selectedRows.size} products?`)) {
            try {
                const ids = Array.from(selectedRows);
                await bulkDeleteProducts(ids);
                setSelectedRows(new Set());
            } catch (error) {
                alert('Failed to delete selected products');
            }
        }
    };

    const handleBulkStatusChange = async (isActive) => {
        // Sequential update
        for (const id of selectedRows) {
            const product = products.find(p => p.id === id);
            if (product) {
                await updateProduct(id, { ...product, isActive });
            }
        }
        setSelectedRows(new Set());
    };

    const handleBulkExport = async () => {
        const selectedProducts = products.filter(p => selectedRows.has(p.id));
        const now = new Date();

        // Prepare Metadata rows
        const metadata = [
            [settings.store.name || "Store Inventory"],
            [
                `${settings.store.address?.street || ''} ${settings.store.address?.area || ''}`,
                `${settings.store.address?.city || ''} ${settings.store.address?.state || ''} ${settings.store.address?.pincode || ''}`
            ].filter(s => s.trim()).join(', '),
            [`GSTIN: ${settings.store.gstin || 'N/A'}`, `FSSAI: ${settings.store.fssai || 'N/A'}`],
            [],
            ["EXPORT DETAILS"],
            ["Date:", now.toLocaleDateString()],
            ["Time:", now.toLocaleTimeString()],
            [],
            [] // Spacer
        ];

        // Prepare Data rows
        // Map the objects to arrays to maintain control over sequence and headers
        const dataHeaders = [
            "NAME", "SKU", "BARCODE", "CATEGORY", "BRAND", "COST PRICE", "PRICE", "STOCK", "UNIT", "STATUS", "CREATED AT"
        ];

        const dataRows = selectedProducts.map(p => [
            p.name,
            p.sku || '-',
            p.barcode || '-',
            p.category || 'Uncategorized',
            p.brand || '-',
            p.costPrice || 0,
            p.price,
            p.stock,
            p.unit || '-',
            p.isActive ? 'Active' : 'Inactive',
            new Date(p.createdAt).toLocaleString()
        ]);

        const ws = utils.aoa_to_sheet([...metadata, dataHeaders, ...dataRows]);

        // Add some basic styling or column widths if possible with xlsx (limited in free version)
        ws['!cols'] = [
            { wch: 30 }, // Name
            { wch: 15 }, // SKU
            { wch: 15 }, // Barcode
            { wch: 20 }, // Category
            { wch: 15 }, // Brand
            { wch: 10 }, // Cost Price
            { wch: 10 }, // Price
            { wch: 10 }, // Stock
            { wch: 10 }, // Unit
            { wch: 10 }, // Status
            { wch: 20 }  // Created At
        ];

        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Inventory");

        // Visual filename
        const filename = `Inventory_Export_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.xlsx`;
        writeFile(wb, filename);

        setSelectedRows(new Set());
    };

    // Import/Export Logic
    const handleFileUpload = (e) => { /* ... Reusing existing logic ... */
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const ab = evt.target.result;
                const wb = read(ab, { type: 'array' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];

                // 1. Read as array of arrays first to find the header row
                const rawData = utils.sheet_to_json(ws, { header: 1 });

                let headerRowIndex = 0;
                // Look for a row that contains our expected headers
                // 'name' is the most critical field
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

                // 2. Now read objects using the found range
                const range = utils.decode_range(ws['!ref']);
                range.s.r = headerRowIndex; // Move start row to header row
                const newRef = utils.encode_range(range);

                const data = utils.sheet_to_json(ws, { range: headerRowIndex });

                console.log("Import Debug: Found headers at row", headerRowIndex, "Data length:", data.length);

                if (data.length > 0) {
                    if (window.confirm(`Found ${data.length} rows. Import them?`)) {
                        const added = await addManyProducts(data);
                        if (added.length > 0) {
                            alert(`Successfully imported ${added.length} products! (Skipped ${data.length - added.length} duplicates or empty rows)`);
                        } else {
                            alert(`Failed to import products. They might be duplicates (SKU must be unique) or empty rows.`);
                        }
                    }
                }
            } catch (error) {
                console.error("Import Error:", error);
                alert('Error processing file: ' + error.message);
            }
        };
        reader.readAsArrayBuffer(file);
        e.target.value = null;
    };

    const handleSaveProduct = async (productData) => {
        try {
            if (selectedProduct) {
                await updateProduct(selectedProduct.id, productData);
            } else {
                await addProduct(productData);
            }
            setIsDrawerOpen(false);
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to save product';
            alert(msg);
            throw error; // Re-throw so ProductDrawer knows to stay open
        }
    };

    // Add Product Split Button Logic
    const [showAddMenu, setShowAddMenu] = useState(false);

    const handleToggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        if (isSelectionMode) {
            setSelectedRows(new Set()); // Clear selection when exiting mode
        }
    };

    // State for template wizard
    const [showTemplateWizard, setShowTemplateWizard] = useState(false);

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Header & Stats */}
                    <div className="space-y-6">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Products & Inventory</h1>

                            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                                {/* Import Button */}
                                <div className="relative flex-1 sm:flex-none">
                                    <input
                                        type="file"
                                        accept=".xlsx, .xls"
                                        onChange={handleFileUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        title="Import Products from Excel"
                                    />
                                    <Button variant="outline" className="w-full bg-white hover:bg-slate-50 border-slate-200 text-slate-600 shadow-sm text-xs sm:text-sm">
                                        <Upload className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Import
                                    </Button>
                                </div>

                                {/* Template Button */}
                                <Button
                                    variant="outline"
                                    className="flex-1 sm:flex-none bg-white hover:bg-slate-50 border-slate-200 text-slate-600 shadow-sm text-xs sm:text-sm"
                                    onClick={() => setShowTemplateWizard(true)}
                                    title="Show Excel Template for Product Import"
                                >
                                    <Download className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Template
                                </Button>
                                {/* Product Import Template Wizard Popup */}
                                <ProductTemplateWizard open={showTemplateWizard} onClose={() => setShowTemplateWizard(false)} />

                                {/* Selection/Export Toggle & Trigger */}
                                <Button
                                    variant={isSelectionMode ? "secondary" : "outline"}
                                    onClick={() => {
                                        if (isSelectionMode && selectedRows.size > 0) {
                                            handleBulkExport(); // Export if items selected
                                        } else {
                                            handleToggleSelectionMode(); // Toggle mode otherwise
                                        }
                                    }}
                                    className={`flex-1 sm:flex-none shadow-sm transition-all text-xs sm:text-sm ${isSelectionMode ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600'}`}
                                >
                                    {isSelectionMode ? (selectedRows.size > 0 ? <Download className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> : <ListChecks className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />) : <ListChecks className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />}
                                    {isSelectionMode ? (selectedRows.size > 0 ? `Export (${selectedRows.size})` : 'Done') : 'Select'}
                                </Button>

                                {selectedRows.size > 0 && (
                                    <Button
                                        variant="outline"
                                        onClick={handleBulkDelete}
                                        className="flex-1 sm:flex-none text-rose-600 border-rose-200 hover:bg-rose-50 shadow-sm text-xs sm:text-sm"
                                    >
                                        <Trash className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Delete ({selectedRows.size})
                                    </Button>
                                )}

                                {/* Professional Add Product Button */}
                                <Button
                                    onClick={handleAddNew}
                                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 text-xs sm:text-sm font-bold"
                                >
                                    <Plus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Add Product
                                </Button>
                            </div>
                        </div>

                        <ProductStats
                            products={products}
                            currentFilter={filters.status}
                            onFilterChange={(status) => setFilters(prev => ({ ...prev, status }))}
                        />
                    </div>

                    {/* Toolbar */}
                    <ProductToolbar
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        categoryFilter={filters.category}
                        onCategoryChange={(c) => setFilters(prev => ({ ...prev, category: c }))}
                        brandFilter={filters.brand}
                        onBrandChange={(b) => setFilters(prev => ({ ...prev, brand: b }))}
                        categories={uniqueCategories}
                        brands={uniqueBrands}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                    />

                    {/* Table Area (Desktop) */}
                    <div className="hidden md:block bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                                        {isSelectionMode && (
                                            <TableHead className="w-[40px]">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-slate-300"
                                                    checked={selectedRows.size === filteredProducts.length && filteredProducts.length > 0}
                                                    onChange={handleSelectAll}
                                                />
                                            </TableHead>
                                        )}
                                        <TableHead className="min-w-[250px]">Product</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Brand</TableHead>
                                        <TableHead>Cost Price</TableHead>
                                        <TableHead>Selling Price</TableHead>
                                        <TableHead>Stock</TableHead>
                                        <TableHead>Unit</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="w-[100px] text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={isSelectionMode ? 10 : 9} className="h-32 text-center text-slate-500">
                                                Loading inventory...
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredProducts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={isSelectionMode ? 10 : 9} className="h-32 text-center text-slate-500">
                                                No products found matching your filters.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredProducts.map((product) => {
                                            const isSelected = selectedRows.has(product.id);
                                            const isFocused = focusedProduct?.id === product.id;
                                            const stockStatus = product.stock === 0 ? 'Out of Stock' : product.stock <= (product.minStock ?? 10) ? 'Low Stock' : 'In Stock';
                                            const py = viewMode === 'compact' ? 'py-2' : 'py-4';

                                            return (
                                                <TableRow
                                                    key={product.id}
                                                    className={`
                                                        cursor-pointer transition-colors
                                                        ${isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50'}
                                                        ${isFocused ? 'bg-blue-50 border-l-2 border-l-blue-600' : ''}
                                                    `}
                                                    onClick={() => handleRowClick(product)}
                                                >
                                                    {isSelectionMode && (
                                                        <TableCell className={py}>
                                                            <input
                                                                type="checkbox"
                                                                className="rounded border-slate-300"
                                                                checked={isSelected}
                                                                onClick={(e) => e.stopPropagation()}
                                                                onChange={() => handleSelectionChange(product.id)}
                                                            />
                                                        </TableCell>
                                                    )}
                                                    <TableCell className={py}>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-slate-900">{product.name}</span>
                                                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                                                <span className="font-mono bg-slate-100 px-1 rounded">{product.sku || 'NO-SKU'}</span>
                                                                {product.barcode && <span>• {product.barcode}</span>}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className={py}>
                                                        <Badge variant="outline" className="font-normal">{product.category || 'Uncategorized'}</Badge>
                                                    </TableCell>
                                                    <TableCell className={py}>{product.brand || '-'}</TableCell>
                                                    <TableCell className={py}>
                                                        <span className="font-medium">₹{Number(product.costPrice || 0).toFixed(2)}</span>
                                                    </TableCell>
                                                    <TableCell className={py}>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">₹{Number(product.price || 0).toFixed(2)}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className={py}>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`font-medium ${product.stock === 0 ? 'text-rose-600' : ''}`}>
                                                                {product.stock}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className={py}>
                                                        {product.unit || '-'}
                                                    </TableCell>
                                                    <TableCell className={py}>
                                                        <Badge
                                                            variant="secondary"
                                                            className={`
                                                                ${product.isActive === false ? 'bg-slate-100 text-slate-500' :
                                                                    stockStatus === 'Out of Stock' ? 'bg-rose-100 text-rose-700' :
                                                                        stockStatus === 'Low Stock' ? 'bg-amber-100 text-amber-700' :
                                                                            'bg-green-100 text-green-700'}
                                                                border-transparent
                                                            `}
                                                        >
                                                            {product.isActive === false ? 'Inactive' : stockStatus}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className={py}>
                                                        <div className="flex justify-end items-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                                                                onClick={(e) => handleEdit(product, e)}
                                                                title="Edit Product"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 text-slate-500 hover:text-red-600 hover:bg-red-50"
                                                                onClick={(e) => handleDelete(product.id, e)}
                                                                title="Delete Product"
                                                            >
                                                                <Trash className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Mobile View (Cards) */}
                    <div className="md:hidden space-y-4">
                        {loading ? (
                            <div className="text-center py-10 text-slate-500">Loading inventory...</div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="text-center py-10 text-slate-500">No products found.</div>
                        ) : (
                            filteredProducts.map((product) => {
                                const stockStatus = product.stock === 0 ? 'Out of Stock' : product.stock <= (product.minStock ?? 10) ? 'Low Stock' : 'In Stock';
                                const isSelected = selectedRows.has(product.id);
                                return (
                                    <div
                                        key={product.id}
                                        className={`bg-white p-4 rounded-xl border transition-all ${isSelected ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 shadow-sm'} active:bg-slate-50`}
                                        onClick={() => isSelectionMode ? handleSelectionChange(product.id) : handleRowClick(product)}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                {isSelectionMode && (
                                                    <input
                                                        type="checkbox"
                                                        className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                        checked={isSelected}
                                                        onChange={() => handleSelectionChange(product.id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                )}
                                                <div>
                                                    <h3 className="font-bold text-slate-900">{product.name}</h3>
                                                    <p className="text-xs text-slate-500 font-mono mt-0.5">{product.sku || 'NO-SKU'}</p>
                                                </div>
                                            </div>
                                            <Badge
                                                variant="secondary"
                                                className={`text-[10px] px-2 py-0.5 ${product.isActive === false ? 'bg-slate-100 text-slate-500' :
                                                        stockStatus === 'Out of Stock' ? 'bg-rose-100 text-rose-700' :
                                                            stockStatus === 'Low Stock' ? 'bg-amber-100 text-amber-700' :
                                                                'bg-green-100 text-green-700'}`}
                                            >
                                                {product.isActive === false ? 'Inactive' : stockStatus}
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-4 ml-0">
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Price</p>
                                                <p className="font-bold text-blue-600">₹{Number(product.price || 0).toFixed(2)}</p>
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Stock</p>
                                                <p className={`font-bold ${product.stock === 0 ? 'text-rose-600' : 'text-slate-900'}`}>{product.stock} {product.unit}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                            <div className="flex gap-2 text-xs text-slate-500">
                                                <Badge variant="outline" className="font-normal text-[10px]">{product.category}</Badge>
                                            </div>
                                            {!isSelectionMode && (
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); handleEdit(product); }}>
                                                        <Edit size={14} />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-rose-600" onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }}>
                                                        <Trash size={14} />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                </div>

            </div>

            {/* Right Panel: Insights */}
            {focusedProduct && (
                <ProductInsights
                    product={focusedProduct}
                    onClose={() => setFocusedProduct(null)}
                />
            )}

            {/* Drawers & Modals */}
            <ProductDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                product={selectedProduct}
                onSave={handleSaveProduct}
                existingUnits={[...new Set([...products.map(p => p.unit), 'pc', 'kg', 'g', 'l', 'ml', 'box', 'pack', 'meter', 'dozen'])].filter(Boolean).sort()}
                existingCategories={uniqueCategories}
                existingBrands={uniqueBrands}
            />


        </div>
    );
};

export default ProductsPage;
