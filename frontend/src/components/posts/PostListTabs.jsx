import { useMemo, useState } from 'react'
import PostCard from '../PostCard'
import PostCardFeatured from './PostCardFeatured'
import PostCardNormal from './PostCardNormal'
import {
    getCategoryPriority,
    getPostTypeCategory,
    POST_TYPE_CATEGORIES,
} from '../../utils/postTypeStyles'

const TABS = [
    { id: 'featured', label: 'Đề xuất', icon: 'sparkle' },
    { id: 'latest', label: 'Mới đăng', icon: 'clock' },
]

const SparkleIcon = ({ className = 'h-4 w-4' }) => (
    <svg aria-hidden="true" className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2 14 8.5 21 10.5 15.5 14 17 21 12 17 7 21 8.5 14 3 10.5 10 8.5 12 2Z" />
    </svg>
)

const ClockIcon = ({ className = 'h-4 w-4' }) => (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
        <path
            d="M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
        />
    </svg>
)

const TabIcon = ({ id, className }) => (id === 'sparkle' ? <SparkleIcon className={className} /> : <ClockIcon className={className} />)

const sortByPriorityThenDate = (list) =>
    [...list].sort((a, b) => {
        const pa = getCategoryPriority(getPostTypeCategory(a.postTypeName, a.postTypePriority))
        const pb = getCategoryPriority(getPostTypeCategory(b.postTypeName, b.postTypePriority))
        if (pa !== pb) return pa - pb
        const da = a.pushTime ? new Date(a.pushTime).getTime() : 0
        const db = b.pushTime ? new Date(b.pushTime).getTime() : 0
        return db - da
    })

const sortByLatest = (list) =>
    [...list].sort((a, b) => {
        const da = a.pushTime ? new Date(a.pushTime).getTime() : 0
        const db = b.pushTime ? new Date(b.pushTime).getTime() : 0
        return db - da
    })

const isVipCategory = (category) =>
    category === POST_TYPE_CATEGORIES.HOT_VIP ||
    category === POST_TYPE_CATEGORIES.VIP1 ||
    category === POST_TYPE_CATEGORIES.VIP2

const FeaturedList = ({ vipPosts, normalPosts, favoritedIds, onToggleFavorite, onRequireAuth }) => {
    if (vipPosts.length === 0 && normalPosts.length === 0) return null

    const renderCard = (post, index) => {
        const isVip = isVipCategory(getPostTypeCategory(post.postTypeName, post.postTypePriority))
        const Card = isVip ? PostCardFeatured : PostCardNormal
        return (
            <Card
                key={post.id}
                post={post}
                index={index}
                isFavorited={favoritedIds.has(post.id)}
                onToggleFavorite={onToggleFavorite}
                onRequireAuth={onRequireAuth}
            />
        )
    }

    return (
        <div className="flex flex-col gap-5">
            {vipPosts.map((post, index) => renderCard(post, index))}
            {normalPosts.map((post, index) => renderCard(post, vipPosts.length + index))}
        </div>
    )
}

const PostListTabs = ({ posts, isAuthenticated, favoritedIds, onToggleFavorite, onRequireAuth, onOpenLogin }) => {
    const [activeTab, setActiveTab] = useState('featured')

    const handleRequireAuth = () => {
        if (isAuthenticated) return true
        onRequireAuth?.() || onOpenLogin?.()
        return false
    }

    const { vipPosts, normalPosts, latestPosts } = useMemo(() => {
        const safePosts = Array.isArray(posts) ? posts : []
        const decorated = safePosts.map((post) => ({
            post,
            category: getPostTypeCategory(post.postTypeName, post.postTypePriority),
        }))

        const vip = sortByPriorityThenDate(decorated.filter((p) => isVipCategory(p.category)).map((p) => p.post))
        const normal = sortByLatest(decorated.filter((p) => p.category === POST_TYPE_CATEGORIES.NORMAL).map((p) => p.post))
        const latest = sortByLatest(safePosts)

        return { vipPosts: vip, normalPosts: normal, latestPosts: latest }
    }, [posts])

    return (
        <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between gap-3">
                <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                aria-pressed={isActive}
                                className={`group relative inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-black transition-all duration-200 ${
                                    isActive
                                        ? tab.id === 'featured'
                                            ? 'bg-gradient-to-r from-red-500 via-pink-500 to-red-500 text-white shadow-md shadow-red-200/60'
                                            : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-200/60'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:scale-95'
                                }`}
                            >
                                <TabIcon id={tab.icon} className={`h-4 w-4 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                                <span>{tab.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {activeTab === 'featured' ? (
                <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                    <FeaturedList
                        vipPosts={vipPosts}
                        normalPosts={normalPosts}
                        favoritedIds={favoritedIds}
                        onToggleFavorite={onToggleFavorite}
                        onRequireAuth={handleRequireAuth}
                    />
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                    {latestPosts.length > 0 ? (
                        <div className="flex flex-col gap-5">
                            {latestPosts.map((post, index) => {
                                const isVip = isVipCategory(getPostTypeCategory(post.postTypeName, post.postTypePriority))
                                const Card = isVip ? PostCardFeatured : PostCardNormal
                                return (
                                    <Card
                                        key={post.id}
                                        post={post}
                                        index={index}
                                        isFavorited={favoritedIds.has(post.id)}
                                        onToggleFavorite={onToggleFavorite}
                                        onRequireAuth={handleRequireAuth}
                                    />
                                )
                            })}
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    )
}

export default PostListTabs
