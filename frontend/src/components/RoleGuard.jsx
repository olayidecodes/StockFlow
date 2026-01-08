import { useAuth } from '../context/AuthContext';

const RoleGuard = ({ roles, children, fallback = null }) => {
    const { hasRole } = useAuth();

    if (!hasRole(roles)) {
        return fallback;
    }

    return children;
};

export default RoleGuard;
