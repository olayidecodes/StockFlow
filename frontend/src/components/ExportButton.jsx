import { useState } from 'react';
import { FiDownload } from 'react-icons/fi';
import { downloadCSV, downloadExcel } from '../utils/exportUtils';

const ExportButton = ({ data, columns, filename = 'export', label = 'Export' }) => {
    const [showMenu, setShowMenu] = useState(false);

    const handleExport = (format) => {
        if (format === 'csv') {
            downloadCSV(data, columns, filename);
        } else if (format === 'excel') {
            downloadExcel(data, columns, filename);
        }
        setShowMenu(false);
    };

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="btn btn-secondary"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem'
                }}
            >
                <FiDownload size={16} />
                {label}
            </button>

            {showMenu && (
                <>
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 999
                        }}
                        onClick={() => setShowMenu(false)}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '0.25rem',
                            background: 'white',
                            border: '1px solid #E2E8F0',
                            borderRadius: '6px',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                            zIndex: 1000,
                            minWidth: '150px'
                        }}
                    >
                        <button
                            onClick={() => handleExport('csv')}
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                border: 'none',
                                background: 'transparent',
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                color: '#1E293B',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#F8FAFC'}
                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                        >
                            Download as CSV
                        </button>
                        <button
                            onClick={() => handleExport('excel')}
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                border: 'none',
                                background: 'transparent',
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                color: '#1E293B',
                                transition: 'background 0.2s',
                                borderTop: '1px solid #F1F5F9'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#F8FAFC'}
                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                        >
                            Download as Excel
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default ExportButton;
