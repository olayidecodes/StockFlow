// Roles
export const ROLES = {
    ADMIN: 'ADMIN',
    INVENTORY_MANAGER: 'INVENTORY_MANAGER',
    SALES: 'SALES',
    VIEWER: 'VIEWER',
};

// Permissions/Capabilities
export const PERMISSIONS = {
    // User Management
    MANAGE_USERS: 'MANAGE_USERS',
    VIEW_USERS: 'VIEW_USERS',

    // Inventory Management
    MANAGE_INVENTORY: 'MANAGE_INVENTORY',
    VIEW_INVENTORY: 'VIEW_INVENTORY',

    // Order Management
    CREATE_ORDERS: 'CREATE_ORDERS',
    MANAGE_ORDERS: 'MANAGE_ORDERS',
    VIEW_ORDERS: 'VIEW_ORDERS',

    // Settings
    MANAGE_SETTINGS: 'MANAGE_SETTINGS',

    // Reports
    VIEW_REPORTS: 'VIEW_REPORTS',
};

// Role-Permission Mapping
export const ROLE_PERMISSIONS = {
    [ROLES.ADMIN]: [
        // Admin has all permissions
        PERMISSIONS.MANAGE_USERS,
        PERMISSIONS.VIEW_USERS,
        PERMISSIONS.MANAGE_INVENTORY,
        PERMISSIONS.VIEW_INVENTORY,
        PERMISSIONS.CREATE_ORDERS,
        PERMISSIONS.MANAGE_ORDERS,
        PERMISSIONS.VIEW_ORDERS,
        PERMISSIONS.MANAGE_SETTINGS,
        PERMISSIONS.VIEW_REPORTS,
    ],

    [ROLES.INVENTORY_MANAGER]: [
        PERMISSIONS.VIEW_USERS,
        PERMISSIONS.MANAGE_INVENTORY,
        PERMISSIONS.VIEW_INVENTORY,
        PERMISSIONS.VIEW_ORDERS,
        PERMISSIONS.VIEW_REPORTS,
    ],

    [ROLES.SALES]: [
        PERMISSIONS.VIEW_INVENTORY,
        PERMISSIONS.CREATE_ORDERS,
        PERMISSIONS.VIEW_ORDERS,
    ],

    [ROLES.VIEWER]: [
        PERMISSIONS.VIEW_USERS,
        PERMISSIONS.VIEW_INVENTORY,
        PERMISSIONS.VIEW_ORDERS,
        PERMISSIONS.VIEW_REPORTS,
    ],
};

// Helper function to check if a role has a specific permission
export const hasPermission = (userRole, permission) => {
    if (!userRole) return false;
    const permissions = ROLE_PERMISSIONS[userRole] || [];
    return permissions.includes(permission);
};
