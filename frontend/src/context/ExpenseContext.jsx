import React, { createContext, useState, useContext, useEffect } from 'react';
import services from '../services/api';
import { useAuth } from './AuthContext';

const ExpenseContext = createContext();

export const useExpenses = () => {
    const context = useContext(ExpenseContext);
    if (!context) {
        throw new Error('useExpenses must be used within a ExpenseProvider');
    }
    return context;
};

export const ExpenseProvider = ({ children }) => {
    const [expenses, setExpenses] = useState([]);
    const { user, isLoading: authLoading } = useAuth();

    const fetchExpenses = async () => {
        try {
            const response = await services.expenses.getAll();
            setExpenses(response.data);
        } catch (error) {
            console.error("Failed to fetch expenses", error);
            setExpenses([]);
        }
    };

    useEffect(() => {
        // Only fetch if user is authenticated and auth is not loading
        if (authLoading || !user) {
            if (!user) {
                setExpenses([]);
            }
            return;
        }

        fetchExpenses();
    }, [user, authLoading]);

    const addExpense = async (expenseData) => {
        try {
            const response = await services.expenses.create({
                ...expenseData,
                amount: parseFloat(expenseData.amount) || 0
            });
            const newExpense = response.data;
            setExpenses(prev => [newExpense, ...prev]);
            return newExpense;
        } catch (error) {
            console.error("Failed to add expense", error);
            throw error;
        }
    };

    const updateExpense = async (id, expenseData) => {
        try {
            const response = await services.expenses.update(id, {
                ...expenseData,
                amount: parseFloat(expenseData.amount) || 0
            });
            const updatedExpense = response.data;
            setExpenses(prev => prev.map(e => e.id === id ? updatedExpense : e));
            return updatedExpense;
        } catch (error) {
            console.error("Failed to update expense", error);
            throw error;
        }
    };

    const deleteExpense = async (id) => {
        try {
            await services.expenses.delete(id);
            setExpenses(prev => prev.filter(e => e.id !== id));
        } catch (error) {
            console.error("Failed to delete expense", error);
            throw error;
        }
    };

    const bulkUpdateExpenses = async (ids, updates) => {
        try {
            await services.expenses.bulkUpdate(ids, updates);
            // Refresh expenses after bulk update
            const response = await services.expenses.getAll();
            setExpenses(response.data);
        } catch (error) {
            console.error("Failed to bulk update expenses", error);
            throw error;
        }
    };

    const bulkDeleteExpenses = async (ids) => {
        try {
            await services.expenses.bulkDelete(ids);
            setExpenses(prev => prev.filter(e => !ids.includes(e.id)));
        } catch (error) {
            console.error("Failed to bulk delete expenses", error);
            throw error;
        }
    };

    const exportToCSV = async () => {
        try {
            const response = await services.expenses.exportCSV();
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `expenses-${Date.now()}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to export CSV", error);
            throw error;
        }
    };

    const uploadReceipt = async (id, file) => {
        try {
            const response = await services.expenses.uploadReceipt(id, file);
            // Update the expense with the new receipt URL
            setExpenses(prev => prev.map(e =>
                e.id === id ? { ...e, receiptUrl: response.data.receiptUrl } : e
            ));
            return response.data;
        } catch (error) {
            console.error("Failed to upload receipt", error);
            throw error;
        }
    };

    const stats = {
        totalExpenses: expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0),
        count: expenses.length
    };

    return (
        <ExpenseContext.Provider value={{
            expenses,
            addExpense,
            updateExpense,
            deleteExpense,
            bulkUpdateExpenses,
            bulkDeleteExpenses,
            exportToCSV,
            uploadReceipt,
            refreshExpenses: fetchExpenses,
            stats
        }}>
            {children}
        </ExpenseContext.Provider>
    );
};
