import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { WalletProvider } from './contexts/WalletContext'
import ROUTES from './constants/routes'
import ErrorBoundary from './components/common/ErrorBoundary'

import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import PostListPage from './pages/posts/PostListPage'
import LandingPage from './pages/LandingPage'
import PostDetailPage from './pages/posts/PostDetailPage'
import CreatePostPage from './pages/posts/CreatePostPage'
import PostPricingPage from './pages/posts/PostPricingPage'
import ProfilePage from './pages/user/ProfilePage'
import WalletPage from './pages/user/WalletPage'
import FavoritesPage from './pages/user/FavoritesPage'
import MyPostsPage from './pages/user/MyPostsPage'
import BoostPostsPage from './pages/user/BoostPostsPage'
import DashboardPage from './pages/admin/DashboardPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import InternalUsersPage from './pages/admin/InternalUsersPage'
import AuditLogsPage from './pages/admin/AuditLogsPage'
import BackupsPage from './pages/admin/BackupsPage'
import ManagerDashboardPage from './pages/manager/ManagerDashboardPage'
import ModerationPostsPage from './pages/manager/ModerationPostsPage'
import ReportsPage from './pages/manager/ReportsPage'
import ModerationLogsPage from './pages/manager/ModerationLogsPage'
import MyModerationLogsPage from './pages/manager/MyModerationLogsPage'
import ModeratorUsersPage from './pages/manager/ModeratorUsersPage'
import PricingPage from './pages/manager/PricingPage'
import MembershipPage from './pages/manager/MembershipPage'

const RoleRoute = ({ roles, children }) => {
    const { user } = useAuth()
    if (!user) return <Navigate to={ROUTES.LOGIN} replace />
    if (!roles.includes(user.role)) return <Navigate to={ROUTES.HOME} replace />
    return children
}

const ManagerHomeRedirect = () => {
    const { user } = useAuth()
    if (!user) return <Navigate to={ROUTES.LOGIN} replace />
    if (user.role === 'MODERATOR') return <Navigate to={ROUTES.MANAGER_MODERATION_POSTS} replace />
    if (user.role === 'MANAGER') return <Navigate to={ROUTES.MANAGER_DASHBOARD} replace />
    return <Navigate to={ROUTES.HOME} replace />
}

const AuthenticatedRoute = ({ children }) => {
    const { user } = useAuth()
    if (!user) return <Navigate to={ROUTES.LOGIN} replace />
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

                    <Route path={ROUTES.POSTS} element={<PostListPage />} />
                    <Route path={ROUTES.POST_PRICING} element={<PostPricingPage />} />
                    <Route path={ROUTES.POST_DETAIL} element={<PostDetailPage />} />
                    <Route path={ROUTES.CREATE_POST} element={<CreatePostPage />} />

                    <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
                    <Route path={ROUTES.WALLET} element={<WalletPage />} />
                    <Route path={ROUTES.MY_POSTS} element={<MyPostsPage />} />
                    <Route path={ROUTES.BOOST_POSTS} element={<BoostPostsPage />} />
                    <Route path={ROUTES.FAVORITES} element={<FavoritesPage />} />

                    <Route path={ROUTES.ADMIN} element={<Navigate to={ROUTES.ADMIN_DASHBOARD} replace />} />
                    <Route path={ROUTES.ADMIN_DASHBOARD} element={<RoleRoute roles={['ADMIN']}><DashboardPage /></RoleRoute>} />
                    <Route path={ROUTES.ADMIN_USERS} element={<RoleRoute roles={['ADMIN']}><AdminUsersPage /></RoleRoute>} />
                    <Route path={ROUTES.ADMIN_INTERNAL_USERS} element={<RoleRoute roles={['ADMIN']}><InternalUsersPage /></RoleRoute>} />
                    <Route path={ROUTES.ADMIN_AUDIT_LOGS} element={<RoleRoute roles={['ADMIN']}><AuditLogsPage /></RoleRoute>} />
                    <Route path={ROUTES.ADMIN_BACKUPS} element={<RoleRoute roles={['ADMIN']}><BackupsPage /></RoleRoute>} />

                    <Route path={ROUTES.MANAGER} element={<ManagerHomeRedirect />} />
                    <Route path={ROUTES.MANAGER_DASHBOARD} element={<RoleRoute roles={['MANAGER']}><ManagerDashboardPage /></RoleRoute>} />
                    <Route path={ROUTES.MANAGER_MODERATION_POSTS} element={<RoleRoute roles={['MODERATOR']}><ModerationPostsPage /></RoleRoute>} />
                    <Route path={ROUTES.MANAGER_REPORTS} element={<RoleRoute roles={['MODERATOR']}><ReportsPage /></RoleRoute>} />
                    <Route path={ROUTES.MANAGER_MODERATION_LOGS} element={<RoleRoute roles={['MANAGER']}><ModerationLogsPage /></RoleRoute>} />
                    <Route path={ROUTES.MODERATOR_USERS} element={<RoleRoute roles={['MODERATOR']}><ModeratorUsersPage /></RoleRoute>} />
                    <Route path={ROUTES.MODERATOR_MY_LOGS} element={<RoleRoute roles={['MODERATOR']}><MyModerationLogsPage /></RoleRoute>} />
                    <Route path={ROUTES.MANAGER_PRICING} element={<RoleRoute roles={['MANAGER']}><PricingPage /></RoleRoute>} />
                    <Route path={ROUTES.MANAGER_MEMBERSHIP} element={<RoleRoute roles={['MANAGER']}><MembershipPage /></RoleRoute>} />
                    </Routes>
                </BrowserRouter>
                </WalletProvider>
            </AuthProvider>
        </ErrorBoundary>
    )
}

export default App
