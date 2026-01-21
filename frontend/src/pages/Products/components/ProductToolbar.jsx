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
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg border border-slate-200">
            {/* Left: Search */}
            <div className="flex-1 w-full md:w-auto relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                    placeholder="Search by name, barcode, or SKU..."
                    className="pl-9 w-full md:max-w-md"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
                <p className="text-[10px] text-slate-400 mt-1 pl-1">
                    Tip: Use text to search name, or scan barcode directly.
                </p>
            </div>

            {/* Right: Filters & Density */}
            <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">

                {/* Category Filter */}
                <select
                    className="h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 min-w-[140px]"
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
                    className="h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 min-w-[140px]"
                    value={brandFilter || ''}
                    onChange={(e) => onBrandChange(e.target.value || null)}
                >
                    <option value="">All Brands</option>
                    {brands.map(b => (
                        <option key={b} value={b}>{b}</option>
                    ))}
                </select>

                {/* Density Toggle Removed */}
            </div>
        </div>
    );
};

export default ProductToolbar;
