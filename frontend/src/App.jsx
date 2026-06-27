import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { WalletProvider } from './contexts/WalletContext'
import ROUTES from './constants/routes'
import ErrorBoundary from './components/common/ErrorBoundary'

import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ChangePasswordPage from './pages/auth/ChangePasswordPage'
import PostListPage from './pages/posts/PostListPage'
import LandingPage from './pages/LandingPage'
import PostDetailPage from './pages/posts/PostDetailPage'
import CreatePostPage from './pages/posts/CreatePostPage'
import EditPostPage from './pages/posts/EditPostPage'
import PostPricingPage from './pages/posts/PostPricingPage'
import ProfilePage from './pages/user/ProfilePage'
import DepositPage from './pages/user/DepositPage'
import PaymentResultPage from './pages/user/PaymentResultPage'
import WalletPage from './pages/user/WalletPage'
import FavoritesPage from './pages/user/FavoritesPage'
import MyPostsPage from './pages/user/MyPostsPage'
import DraftsPage from './pages/user/DraftsPage'
import BoostPostsPage from './pages/user/BoostPostsPage'
import ExtendPostPage from './pages/user/ExtendPostPage'
import UserMembershipPage from './pages/user/UserMembershipPage'
import InternalProfilePage from './pages/user/InternalProfilePage'
import DashboardPage from './pages/admin/DashboardPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import InternalUsersPage from './pages/admin/InternalUsersPage'
import AuditLogsPage from './pages/admin/AuditLogsPage'
import BackupsPage from './pages/admin/BackupsPage'
import ManagerDashboardPage from './pages/manager/ManagerDashboardPage'
import ModerationPostsPage from './pages/moderator/ModerationPostsPage'
import ReportsPage from './pages/moderator/ReportsPage'
import ModerationLogsPage from './pages/manager/ModerationLogsPage'
import MyModerationLogsPage from './pages/moderator/MyModerationLogsPage'
import ModeratorUsersPage from './pages/moderator/ModeratorUsersPage'
import PricingPage from './pages/manager/PricingPage'
import MembershipPage from './pages/manager/MembershipPage'

const INTERNAL_ROLES = new Set(['ADMIN', 'MANAGER', 'MODERATOR'])

const RoleRoute = ({ roles, children }) => {
    const { user } = useAuth()
    if (!user) return <Navigate to={ROUTES.LOGIN} replace />
    if (!roles.includes(user.role)) return <Navigate to={ROUTES.HOME} replace />
    return children
}

const UserRoute = ({ children }) => {
    const { user } = useAuth()
    if (!user) return <Navigate to={ROUTES.LOGIN} replace />
    if (INTERNAL_ROLES.has(user.role)) {
        const redirectTo = user.role === 'MODERATOR' ? ROUTES.MODERATOR_HOME
            : user.role === 'MANAGER' ? ROUTES.MANAGER_DASHBOARD
            : ROUTES.ADMIN_DASHBOARD
        return <Navigate to={redirectTo} replace />
    }
    return children
}

const ManagerHomeRedirect = () => {
    const { user } = useAuth()
    if (!user) return <Navigate to={ROUTES.LOGIN} replace />
    if (user.role === 'MODERATOR') return <Navigate to={ROUTES.MODERATOR_HOME} replace />
    if (user.role === 'MANAGER') return <Navigate to={ROUTES.MANAGER_DASHBOARD} replace />
    return <Navigate to={ROUTES.HOME} replace />
}

const AuthenticatedRoute = ({ children }) => {
    const { user } = useAuth()
    if (!user) return <Navigate to={ROUTES.LOGIN} replace />
    return children
}

const InternalProfileRoute = ({ children }) => {
    const { user } = useAuth()
    if (!user) return <Navigate to={ROUTES.LOGIN} replace />
    if (!INTERNAL_ROLES.has(user.role)) return <Navigate to={ROUTES.HOME} replace />
    return children
}

function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <WalletProvider>
                <BrowserRouter>
                    <Routes>
                    <Route path={ROUTES.HOME} element={<LandingPage />} />

                    <Route path={ROUTES.LOGIN} element={<LoginPage />} />
                    <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
                    <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
                    <Route path={ROUTES.CHANGE_PASSWORD} element={<AuthenticatedRoute><ChangePasswordPage /></AuthenticatedRoute>} />

                    <Route path={ROUTES.POSTS} element={<PostListPage />} />
                    <Route path={ROUTES.POST_PRICING} element={<UserRoute><PostPricingPage /></UserRoute>} />
                    <Route path={ROUTES.POST_DETAIL} element={<PostDetailPage />} />
                    <Route path={ROUTES.CREATE_POST} element={<UserRoute><CreatePostPage /></UserRoute>} />
                    <Route path={ROUTES.EDIT_POST} element={<EditPostPage />} />

                    <Route path={ROUTES.PROFILE} element={<UserRoute><ProfilePage /></UserRoute>} />
                    <Route path={ROUTES.USER_DEPOSIT} element={<UserRoute><DepositPage /></UserRoute>} />
                    <Route path={ROUTES.PAYMENT_RESULT} element={<UserRoute><PaymentResultPage /></UserRoute>} />
                    <Route path={ROUTES.WALLET} element={<UserRoute><WalletPage /></UserRoute>} />
                    <Route path={ROUTES.MY_POSTS} element={<UserRoute><MyPostsPage /></UserRoute>} />
                    <Route path={ROUTES.DRAFTS} element={<UserRoute><DraftsPage /></UserRoute>} />
                    <Route path={ROUTES.BOOST_POSTS} element={<UserRoute><BoostPostsPage /></UserRoute>} />
                    <Route path={ROUTES.EXTEND_POSTS} element={<UserRoute><ExtendPostPage /></UserRoute>} />
                    <Route path={ROUTES.FAVORITES} element={<UserRoute><FavoritesPage /></UserRoute>} />
                    <Route path={ROUTES.USER_MEMBERSHIP} element={<UserRoute><UserMembershipPage /></UserRoute>} />
                    <Route path={ROUTES.INTERNAL_PROFILE} element={<InternalProfileRoute><InternalProfilePage /></InternalProfileRoute>} />

                    <Route path={ROUTES.ADMIN} element={<Navigate to={ROUTES.ADMIN_DASHBOARD} replace />} />
                    <Route path={ROUTES.ADMIN_DASHBOARD} element={<RoleRoute roles={['ADMIN']}><DashboardPage /></RoleRoute>} />
                    <Route path={ROUTES.ADMIN_USERS} element={<RoleRoute roles={['ADMIN']}><AdminUsersPage /></RoleRoute>} />
                    <Route path={ROUTES.ADMIN_INTERNAL_USERS} element={<RoleRoute roles={['ADMIN']}><InternalUsersPage /></RoleRoute>} />
                    <Route path={ROUTES.ADMIN_AUDIT_LOGS} element={<RoleRoute roles={['ADMIN']}><AuditLogsPage /></RoleRoute>} />
                    <Route path={ROUTES.ADMIN_BACKUPS} element={<RoleRoute roles={['ADMIN']}><BackupsPage /></RoleRoute>} />

                    <Route path={ROUTES.MANAGER} element={<ManagerHomeRedirect />} />
                    <Route path={ROUTES.MANAGER_DASHBOARD} element={<RoleRoute roles={['MANAGER']}><ManagerDashboardPage /></RoleRoute>} />
                    <Route path={ROUTES.MANAGER_MODERATION_LOGS} element={<RoleRoute roles={['MANAGER']}><ModerationLogsPage /></RoleRoute>} />
                    <Route path={ROUTES.MANAGER_PRICING} element={<RoleRoute roles={['MANAGER']}><PricingPage /></RoleRoute>} />
                    <Route path={ROUTES.MANAGER_MEMBERSHIP} element={<RoleRoute roles={['MANAGER']}><MembershipPage /></RoleRoute>} />

                    <Route path={ROUTES.MODERATOR_HOME} element={<RoleRoute roles={['MODERATOR']}><ModerationPostsPage /></RoleRoute>} />
                    <Route path={ROUTES.MODERATOR_MODERATION_POSTS} element={<RoleRoute roles={['MODERATOR']}><ModerationPostsPage /></RoleRoute>} />
                    <Route path={ROUTES.MODERATOR_REPORTS} element={<RoleRoute roles={['MODERATOR']}><ReportsPage /></RoleRoute>} />
                    <Route path={ROUTES.MODERATOR_USERS} element={<RoleRoute roles={['MODERATOR']}><ModeratorUsersPage /></RoleRoute>} />
                    <Route path={ROUTES.MODERATOR_MY_LOGS} element={<RoleRoute roles={['MODERATOR']}><MyModerationLogsPage /></RoleRoute>} />
                    </Routes>
                </BrowserRouter>
                </WalletProvider>
            </AuthProvider>
        </ErrorBoundary>
    )
}

export default App
