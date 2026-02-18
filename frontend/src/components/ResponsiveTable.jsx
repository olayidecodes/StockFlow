import React from 'react';

/**
 * ResponsiveTable - A wrapper component that makes tables responsive
 * On mobile, it converts table to card-based layout
 * 
 * Usage:
 * <ResponsiveTable>
 *   <table className="data-table">
 *     <thead>...</thead>
 *     <tbody>...</tbody>
 *   </table>
 * </ResponsiveTable>
 */
const ResponsiveTable = ({ children, className = '' }) => {
    return (
        <div className={`table-container ${className}`}>
            {children}
        </div>
    );
};

export default ResponsiveTable;
