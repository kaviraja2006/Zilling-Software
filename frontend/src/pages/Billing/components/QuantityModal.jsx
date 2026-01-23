import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Package } from 'lucide-react';

const QuantityModal = ({ isOpen, onClose, item, onApply }) => {
    const [quantity, setQuantity] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen && item) {
            setQuantity(item.quantity?.toString() || '');
            // Focus input when modal opens
            setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            }, 100);
        }
    }, [isOpen, item]);

    const handleSubmit = (e) => {
        e?.preventDefault();
        const qty = parseFloat(quantity);
        if (!isNaN(qty) && qty > 0) {
            onApply(qty);
            onClose();
        } else {
            alert('Please enter a valid quantity greater than 0');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSubmit(e);
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    const quickActions = ['+1', '+5', '+10', '×2', '÷2'];

    const handleQuickAction = (action) => {
        const currentQty = parseFloat(quantity) || 0;
        let newQty = currentQty;

        if (action === '+1') newQty = currentQty + 1;
        else if (action === '+5') newQty = currentQty + 5;
        else if (action === '+10') newQty = currentQty + 10;
        else if (action === '×2') newQty = currentQty * 2;
        else if (action === '÷2') newQty = currentQty / 2;

        setQuantity(Math.max(1, newQty).toString());
        inputRef.current?.focus();
    };

    if (!item) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Change Quantity"
        >
            <div className="space-y-4">
                {/* Item Info */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="p-2 bg-blue-100 rounded-md">
                        <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-slate-800">{item.name}</h4>
                        <p className="text-xs text-slate-500">
                            ₹{item.price || item.sellingPrice} × {item.quantity} = ₹{((item.price || item.sellingPrice) * item.quantity).toFixed(2)}
                        </p>
                    </div>
                </div>

                {/* Quantity Input */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                        New Quantity <span className="text-red-500">*</span>
                    </label>
                    <Input
                        ref={inputRef}
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter quantity..."
                        className="text-lg font-semibold text-center"
                    />
                    <p className="text-xs text-slate-500 text-center">
                        Press <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-slate-700 font-mono">Enter</kbd> to apply or <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-slate-700 font-mono">Esc</kbd> to cancel
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Quick Actions</label>
                    <div className="grid grid-cols-5 gap-2">
                        {quickActions.map(action => (
                            <Button
                                key={action}
                                type="button"
                                variant="outline"
                                onClick={() => handleQuickAction(action)}
                                className="text-sm font-semibold hover:bg-blue-50 hover:border-blue-300"
                            >
                                {action}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Apply Quantity
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default QuantityModal;
