import { useState, useCallback } from 'react';

const useCustomerForm = (initialCustomer = null) => {
    const [formData, setFormData] = useState({
        fullName: initialCustomer?.fullName || '',
        phone: initialCustomer?.phone || '',
        email: initialCustomer?.email || '',
        customerType: initialCustomer?.customerType || 'Individual',
        gstin: initialCustomer?.gstin || '',
        address: initialCustomer?.address || {
            street: '',
            area: '',
            city: '',
            pincode: '',
            state: ''
        },
        source: initialCustomer?.source || 'Walk-in',
        tags: initialCustomer?.tags || [],
        loyaltyPoints: initialCustomer?.loyaltyPoints || 0,
        notes: initialCustomer?.notes || ''
    });

    const [validation, setValidation] = useState({});
    const [touched, setTouched] = useState({});

    const validateField = useCallback((name, value, currentFormData) => {
        const newValidation = { ...validation };

        switch (name) {
            case 'fullName':
                if (!value.trim()) {
                    newValidation.fullName = { valid: false, message: 'Name is required' };
                } else {
                    newValidation.fullName = { valid: true };
                }
                break;
            case 'phone':
                if (!value.trim()) {
                    newValidation.phone = { valid: false, message: 'Phone is required' };
                } else if (!/^\+?[\d\s-]{10,}$/.test(value)) {
                    newValidation.phone = { valid: false, message: 'Invalid phone format' };
                } else {
                    newValidation.phone = { valid: true };
                }
                break;
            case 'email':
                if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    newValidation.email = { valid: false, message: 'Invalid email format' };
                } else {
                    newValidation.email = { valid: true };
                }
                break;
            case 'gstin':
                if (currentFormData.customerType === 'Business' && !value) {
                    newValidation.gstin = { valid: false, message: 'GSTIN is required for business' };
                } else if (value && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(value)) {
                    newValidation.gstin = { valid: false, message: 'Invalid GSTIN format' };
                } else {
                    newValidation.gstin = { valid: true };
                }
                break;
            default:
                break;
        }

        setValidation(newValidation);
    }, [validation]);

    const handleChange = (name, value) => {
        if (name.startsWith('address.')) {
            const addressField = name.split('.')[1];
            setFormData(prev => {
                const newData = {
                    ...prev,
                    address: { ...prev.address, [addressField]: value }
                };
                return newData;
            });
        } else {
            setFormData(prev => {
                const newData = { ...prev, [name]: value };
                validateField(name, value, newData);
                return newData;
            });
        }
        setTouched(prev => ({ ...prev, [name]: true }));
    };

    const handleTagToggle = (tag) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.includes(tag)
                ? prev.tags.filter(t => t !== tag)
                : [...prev.tags, tag]
        }));
    };

    const resetForm = useCallback((newInitial = null) => {
        setFormData({
            fullName: newInitial?.fullName || '',
            phone: newInitial?.phone || '',
            email: newInitial?.email || '',
            customerType: newInitial?.customerType || 'Individual',
            gstin: newInitial?.gstin || '',
            address: newInitial?.address || {
                street: '',
                area: '',
                city: '',
                pincode: '',
                state: ''
            },
            source: newInitial?.source || 'Walk-in',
            tags: newInitial?.tags || [],
            loyaltyPoints: newInitial?.loyaltyPoints || 0,
            notes: newInitial?.notes || ''
        });
        setValidation({});
        setTouched({});
    }, []);

    const isFormValid = () => {
        return formData.fullName && formData.phone && 
               (formData.customerType !== 'Business' || formData.gstin) &&
               !Object.values(validation).some(v => v && !v.valid);
    };

    return {
        formData,
        setFormData,
        validation,
        touched,
        handleChange,
        handleTagToggle,
        resetForm,
        isFormValid
    };
};

export default useCustomerForm;
