import React from 'react';
import { CircleLoader } from 'react-spinners';

/**
 * Reusable Spinner component using react-spinners
 * @param {number} size - Size in pixels (default: 40)
 * @param {boolean} fullPage - If true, centers spinner in a full-height container
 * @param {string} color - Optional color override (default: var(--color-sidebar-active))
 */
const Spinner = ({ size, fullPage = false, color }) => {
    // Default sizes based on project scale (sm, md, lg logic or just pixel values)
    const spinnerSize = size || (fullPage ? 50 : 24);
    const spinnerColor = color || '#d4e157'; // var(--color-sidebar-active) value

    const spinnerElement = (
        <div className="spinner-wrapper" role="status">
            <CircleLoader
                size={spinnerSize}
                color={spinnerColor}
                loading={true}
            />
            <span className="sr-only">Loading...</span>
        </div>
    );

    if (fullPage) {
        return (
            <div className="loading-container full-page">
                {spinnerElement}
            </div>
        );
    }

    return spinnerElement;
};

export default Spinner;
