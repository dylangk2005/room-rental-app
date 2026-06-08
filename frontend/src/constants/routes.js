const ROUTES = {
    // Public
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',

    // User
    POSTS: '/posts',
    POST_PRICING: '/bang-gia-tin-dang',
    POST_DETAIL: '/posts/:id',
    CREATE_POST: '/posts/create',
    PROFILE: '/user/profile',
    WALLET: '/user/wallet',
    USER_DEPOSIT: '/user/wallet?tab=deposit',
    USER_TRANSACTIONS: '/user/wallet?tab=deposit-history',
    MY_POSTS: '/user/posts',
    BOOST_POSTS: '/user/boost-posts',
    FAVORITES: '/user/favorites',

    // Admin
    ADMIN: '/admin',
    ADMIN_DASHBOARD: '/admin/dashboard',
    ADMIN_USERS: '/admin/users',
    ADMIN_INTERNAL_USERS: '/admin/internal-users',
    ADMIN_AUDIT_LOGS: '/admin/audit-logs',
    ADMIN_BACKUPS: '/admin/backups',

    // Manager
    MANAGER: '/manager',
    MANAGER_DASHBOARD: '/manager/dashboard',
    MANAGER_MODERATION_POSTS: '/manager/moderation/posts',
    MANAGER_REPORTS: '/manager/reports',
    MANAGER_MODERATION_LOGS: '/manager/moderation-logs',
    MODERATOR_USERS: '/moderator/users',
    MODERATOR_MY_LOGS: '/moderator/my-logs',
    MANAGER_PRICING: '/manager/pricing',
    MANAGER_MEMBERSHIP: '/manager/membership',
}

export default ROUTES
