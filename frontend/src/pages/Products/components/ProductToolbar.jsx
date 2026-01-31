import React from 'react';
import { Search, Filter, LayoutList, AlignJustify, SlidersHorizontal } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

const ProductToolbar = ({
    searchTerm,
    onSearchChange,
    categoryFilter,
    onCategoryChange,
    brandFilter,
    onBrandChange,
    categories = [],
    brands = [],
    viewMode,
    onViewModeChange
}) => {
    return (
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            {/* Left: Search */}
            <div className="flex-1 w-full lg:w-auto relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                    placeholder="Search by name, barcode, or SKU..."
                    className="pl-9 w-full lg:max-w-md h-10 text-sm"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            {/* Right: Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                    {/* Category Filter */}
                    <select
                        className="h-10 px-3 flex-1 sm:flex-none rounded-lg border border-slate-200 bg-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 min-w-[120px] sm:min-w-[150px]"
                        value={categoryFilter || ''}
                        onChange={(e) => onCategoryChange(e.target.value || null)}
                    >
                        <option value="">All Categories</option>
                        {categories.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>

                    {/* Brand Filter */}
                    <select
                        className="h-10 px-3 flex-1 sm:flex-none rounded-lg border border-slate-200 bg-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 min-w-[120px] sm:min-w-[150px]"
                        value={brandFilter || ''}
                        onChange={(e) => onBrandChange(e.target.value || null)}
                    >
                        <option value="">All Brands</option>
                        {brands.map(b => (
                            <option key={b} value={b}>{b}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};

export default ProductToolbar;
