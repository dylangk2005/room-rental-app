const ROUTES = {
    // Public
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    CHANGE_PASSWORD: '/change-password',

    // User
    POSTS: '/posts',
    POST_PRICING: '/bang-gia-tin-dang',
    POST_DETAIL: '/posts/:id',
    CREATE_POST: '/posts/create',
    EDIT_POST: '/posts/:id/edit',
    PROFILE: '/user/profile',
    WALLET: '/user/wallet',
    USER_DEPOSIT: '/user/deposit',
    PAYMENT_RESULT: '/payment-result',
    USER_TRANSACTIONS: '/user/wallet?tab=deposits',
    MY_POSTS: '/user/posts',
    DRAFTS: '/user/drafts',
    BOOST_POSTS: '/user/boost-posts',
    EXTEND_POSTS: '/user/extend-posts',
    FAVORITES: '/user/favorites',
    USER_MEMBERSHIP: '/user/membership',
    INTERNAL_PROFILE: '/internal/profile',

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
    MANAGER_MODERATION_LOGS: '/manager/moderation-logs',
    MANAGER_PRICING: '/manager/pricing',
    MANAGER_MEMBERSHIP: '/manager/membership',

    // Moderator
    MODERATOR_HOME: '/moderator',
    MODERATOR_MODERATION_POSTS: '/moderator/moderation/posts',
    MODERATOR_REPORTS: '/moderator/reports',
    MODERATOR_USERS: '/moderator/users',
    MODERATOR_MY_LOGS: '/moderator/my-logs',
}

export default ROUTES
