import { useAuth } from '../context/AuthContext';
import { ROLES, PERMISSIONS, hasPermission } from '../utils/constants';

export const usePermissions = () => {
    const { user } = useAuth();
    const userRole = user?.role;

    // Generic check function
    const can = (permission) => {
        return hasPermission(userRole, permission);
    };

    // Pre-calculated permissions for common tasks
    const permissions = {
        canManageUsers: can(PERMISSIONS.MANAGE_USERS),
        canViewUsers: can(PERMISSIONS.VIEW_USERS),
        canManageInventory: can(PERMISSIONS.MANAGE_INVENTORY),
        canViewInventory: can(PERMISSIONS.VIEW_INVENTORY),
        canCreateOrders: can(PERMISSIONS.CREATE_ORDERS),
        canManageOrders: can(PERMISSIONS.MANAGE_ORDERS),
        canViewOrders: can(PERMISSIONS.VIEW_ORDERS),
        canManageSettings: can(PERMISSIONS.MANAGE_SETTINGS),
        canViewReports: can(PERMISSIONS.VIEW_REPORTS),
    };

    // Role checks
    const is = {
        admin: userRole === ROLES.ADMIN,
        inventoryManager: userRole === ROLES.INVENTORY_MANAGER,
        sales: userRole === ROLES.SALES,
        viewer: userRole === ROLES.VIEWER,
    };

    return {
        can,
        user,
        ...permissions,
        is,
        role: userRole,
        ROLES,
        PERMISSIONS,
    };
};