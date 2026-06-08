import { useEffect, useState } from 'react'
import managerApi from '../../api/managerApi'
import postApi from '../../api/postApi'
import BackOfficeLayout from '../../components/BackOfficeLayout'
import { EmptyState, LoadingRows, Message } from '../../components/BackOfficeParts'
import { formatMoney, getErrorMessage } from '../../utils/backOfficeFormatters'

const PricingPage = () => {
    const [postTypes, setPostTypes] = useState([])
    const [form, setForm] = useState({ postTypeId: '', days: '', price: '' })
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const loadPostTypes = async () => {
        setLoading(true)
        setError('')
        try {
            const response = await postApi.getPostTypes()
            const data = response.data || []
            setPostTypes(data)
            if (!form.postTypeId && data[0]) {
                setForm((current) => ({ ...current, postTypeId: data[0].id }))
            }
        } catch (loadError) {
            setError(getErrorMessage(loadError, 'Không tải được bảng giá tin đăng.'))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadPostTypes()
    }, [])

    const updatePrice = async (event) => {
        event.preventDefault()
        setMessage('')
        setError('')
        try {
            await managerApi.updatePostTypePrice({
                postTypeId: Number(form.postTypeId),
                days: Number(form.days),
                price: Number(form.price),
            })
            setForm((current) => ({ ...current, days: '', price: '' }))
            setMessage('Cập nhật giá tin đăng thành công.')
            loadPostTypes()
        } catch (updateError) {
            setError(getErrorMessage(updateError, 'Không cập nhật được giá tin đăng.'))
        }
    }

    return (
        <BackOfficeLayout section="manager" title="Giá tin đăng" subtitle="Quản lý giá theo loại tin và số ngày hiển thị.">
            <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[220px_140px_180px_auto]" onSubmit={updatePrice}>
                <select className="h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold" value={form.postTypeId} onChange={(event) => setForm((current) => ({ ...current, postTypeId: event.target.value }))} required>
                    {postTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                </select>
                <input className="h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold" placeholder="Số ngày" type="number" min="1" value={form.days} onChange={(event) => setForm((current) => ({ ...current, days: event.target.value }))} required />
                <input className="h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold" placeholder="Giá" type="number" min="1" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} required />
                <button className="h-11 rounded-lg bg-emerald-600 px-5 text-sm font-black text-white" type="submit">Cập nhật</button>
            </form>

            <div className="mt-4 space-y-3">
                {message && <Message type="success">{message}</Message>}
                {error && <Message type="error">{error}</Message>}
            </div>

            <section className="mt-4 grid gap-4 lg:grid-cols-2">
                {loading ? (
                    <div className="lg:col-span-2"><LoadingRows /></div>
                ) : postTypes.length === 0 ? (
                    <div className="lg:col-span-2"><EmptyState message="Chưa có loại tin." /></div>
                ) : (
                    postTypes.map((type) => (
                        <article className="rounded-lg border border-slate-200 bg-white p-5" key={type.id}>
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-black text-slate-950">{type.name}</h2>
                                    <p className="mt-1 text-sm font-semibold text-slate-500">Priority {type.priority} | Push {formatMoney(type.pushPrice)}</p>
                                </div>
                                <span className="rounded-full px-3 py-1 text-xs font-black" style={{ color: type.titleColor || '#0f172a', border: `1px solid ${type.titleColor || '#cbd5e1'}` }}>
                                    {type.titleSize || 14}px
                                </span>
                            </div>
                            <div className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-100">
                                {(type.prices || []).map((price) => (
                                    <div className="flex items-center justify-between p-3 text-sm" key={`${type.id}-${price.days}`}>
                                        <span className="font-bold text-slate-700">{price.days} ngày</span>
                                        <strong>{formatMoney(price.price)}</strong>
                                    </div>
                                ))}
                            </div>
                        </article>
                    ))
                )}
            </section>
        </BackOfficeLayout>
    )
}

export default PricingPage
