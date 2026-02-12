import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api';
import Spinner from '../components/Spinner';

const VerifyEmail = () => {
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Auto-fill from URL if present ?token=...
    useState(() => {
        const queryToken = searchParams.get('token');
        if (queryToken) setToken(queryToken);
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/auth/verify', { token });
            if (res.data.success) {
                toast.success('Email verified successfully! You can now login.');
                navigate('/login');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>Verify Email</h1>
                    <p className="subtitle">Enter the token sent to your email (or check server console in Dev mode)</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label>Verification Token</label>
                        <input
                            type="text"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="Enter token string"
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? <Spinner size={20} color="#fff" /> : 'Verify Email'}
                    </button>
                </form>

                <div className="auth-footer">
                    <button onClick={() => navigate('/login')} className="btn-link">Back to Login</button>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
