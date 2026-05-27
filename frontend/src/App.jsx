import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ROUTES from './constants/routes'

import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import PostListPage from './pages/posts/PostListPage'
import PostDetailPage from './pages/posts/PostDetailPage'
import CreatePostPage from './pages/posts/CreatePostPage'
import ProfilePage from './pages/user/ProfilePage'
import WalletPage from './pages/user/WalletPage'
import DashboardPage from './pages/admin/DashboardPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.HOME} element={<PostListPage />} />

        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />

        <Route path={ROUTES.POSTS} element={<PostListPage />} />
        <Route path={ROUTES.POST_DETAIL} element={<PostDetailPage />} />
        <Route path={ROUTES.CREATE_POST} element={<CreatePostPage />} />

        <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
        <Route path={ROUTES.WALLET} element={<WalletPage />} />

        <Route path={ROUTES.ADMIN_DASHBOARD} element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
