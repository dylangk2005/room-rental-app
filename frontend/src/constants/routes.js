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
}

export default ROUTES
