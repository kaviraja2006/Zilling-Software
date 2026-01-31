import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';

import {
    LayoutDashboard,
    Receipt,
    Package,
    Users,
    FileText,
    BarChart3,
    Wallet,
    Settings,
    ScanBarcode,
    Menu,
    LogOut,
    X
} from 'lucide-react';

const Sidebar = ({ isOpen = true, toggleSidebar, isMobile, onCloseMobile }) => {
    const navItems = [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
        { label: 'Billing', icon: Receipt, path: '/billing' },
        { label: 'Products', icon: Package, path: '/products' },
        { label: 'Customers', icon: Users, path: '/customers' },
        { label: 'Invoices', icon: FileText, path: '/invoices' },
        { label: 'Reports', icon: BarChart3, path: '/reports' },
        { label: 'Expenses', icon: Wallet, path: '/expenses' },
        { label: 'Settings', icon: Settings, path: '/settings' },
        { label: 'Barcode', icon: ScanBarcode, path: '/barcode' },
    ];



    return (
        <div className="flex h-full w-full flex-col border-r border-theme bg-card shadow-sm">
            {/* Logo Area */}
            {/* Logo Area */}
            <div className={cn("flex h-16 items-center border-b border-theme transition-all", isOpen ? "justify-between px-4" : "justify-center px-0")}>
                <div
                    className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={toggleSidebar}
                    aria-label="Toggle sidebar"
                >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-main text-white shadow-sm">
                        <Receipt size={20} strokeWidth={2.5} />
                    </div>
                    {isOpen && (
                        <span className="text-xl font-bold text-body-primary tracking-tight">KWIQBILL</span>
                    )}
                </div>
                {/* Mobile Close Toggle */}
                <div className="flex items-center gap-2">
                    {onCloseMobile && (
                        <button
                            onClick={onCloseMobile}
                            className="md:hidden p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-body-primary transition-colors"
                            aria-label="Close menu"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-all duration-200",
                                isOpen ? "px-3" : "justify-center px-0",
                                isActive
                                    ? "bg-slate-100 text-primary-main shadow-sm"
                                    : "text-body-secondary hover:bg-slate-50 hover:text-body-primary"
                            )
                        }
                        title={!isOpen ? item.label : undefined}
                        onClick={() => onCloseMobile && onCloseMobile()}
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon
                                    size={20}
                                    className={cn("transition-colors flex-shrink-0", isActive ? "text-primary-main" : "text-slate-400 group-hover:text-slate-600")}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                {isOpen && <span>{item.label}</span>}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

        </div >
    );
};

export default Sidebar;
