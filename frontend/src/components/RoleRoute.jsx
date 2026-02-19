import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleRoute = ({ children, allowedRoles }) => {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!allowedRoles.includes(user.role)) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60vh',
                padding: '2rem',
                textAlign: 'center'
            }}>
                <div style={{
                    fontSize: '4rem',
                    marginBottom: '1rem',
                    color: '#E2E8F0'
                }}>
                    🔒
                </div>
                <h2 style={{ color: '#1E293B', marginBottom: '0.5rem' }}>Access Denied</h2>
                <p style={{ color: '#64748B', marginBottom: '1.5rem' }}>
                    You don't have permission to access this page.
                </p>
                <button 
                    onClick={() => window.history.back()}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: '#4880FF',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        fontWeight: 500
                    }}
                >
                    Go Back
                </button>
            </div>
        );
    }

    return children;
};

export default RoleRoute;
