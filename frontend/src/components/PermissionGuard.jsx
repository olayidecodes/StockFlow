import { usePermissions } from '../hooks/usePermissions';

const PermissionGuard = ({
    permission,
    requireAll = false,
    children,
    fallback = null
}) => {
    const { can } = usePermissions();

    if (!permission) return children;

    let hasAccess = false;

    if (Array.isArray(permission)) {
        if (requireAll) {
            hasAccess = permission.every(p => can(p));
        } else {
            hasAccess = permission.some(p => can(p));
        }
    } else {
        hasAccess = can(permission);
    }

    if (!hasAccess) {
        return fallback;
    }

    return children;
};

export default PermissionGuard;
