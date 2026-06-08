import { useEffect, useState } from 'react'
import managerApi from '../../api/managerApi'
import membershipApi from '../../api/membershipApi'
import BackOfficeLayout from '../../components/BackOfficeLayout'
import { EmptyState, LoadingRows, Message } from '../../components/BackOfficeParts'
import { formatMoney, getErrorMessage } from '../../utils/backOfficeFormatters'

const MembershipPage = () => {
    const [levels, setLevels] = useState([])
    const [editing, setEditing] = useState(null)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const loadLevels = async () => {
        setLoading(true)
        setError('')
        try {
            const response = await membershipApi.getLevels()
            setLevels(response.data || [])
        } catch (loadError) {
            setError(getErrorMessage(loadError, 'Không tải được hạng thành viên.'))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadLevels()
    }, [])

    const updateLevel = async (event) => {
        event.preventDefault()
        setMessage('')
        setError('')
        try {
            await managerApi.updateMembershipLevel(editing.id, {
                minSpent: Number(editing.minSpent),
                discountPercent: Number(editing.discountPercent),
            })
            setEditing(null)
            setMessage('Cập nhật hạng thành viên thành công.')
            loadLevels()
        } catch (updateError) {
            setError(getErrorMessage(updateError, 'Không cập nhật được hạng thành viên.'))
        }
    }

    return (
        <BackOfficeLayout section="manager" title="Hạng thành viên" subtitle="Quản lý ngưỡng chi tiêu và ưu đãi của từng hạng.">
            <div className="space-y-3">
                {message && <Message type="success">{message}</Message>}
                {error && <Message type="error">{error}</Message>}
            </div>

            <section className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
                {loading ? (
                    <div className="p-4"><LoadingRows /></div>
                ) : levels.length === 0 ? (
                    <EmptyState message="Chưa có hạng thành viên." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Hạng</th>
                                    <th className="px-4 py-3">Min spent</th>
                                    <th className="px-4 py-3">Discount</th>
                                    <th className="px-4 py-3">Thao tac</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {levels.map((level) => (
                                    <tr key={level.id}>
                                        <td className="px-4 py-3 font-black text-slate-950">{level.name}</td>
                                        <td className="px-4 py-3 font-bold">{formatMoney(level.minSpent)}</td>
                                        <td className="px-4 py-3 font-bold">{level.discountPercent}%</td>
                                        <td className="px-4 py-3">
                                            <button className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-black text-slate-700" type="button" onClick={() => setEditing(level)}>
                                                Sửa
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {editing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
                    <form className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl" onSubmit={updateLevel}>
                        <h2 className="text-xl font-black text-slate-950">Sửa hạng {editing.name}</h2>
                        <label className="mt-4 block text-sm font-black text-slate-700" htmlFor="minSpent">Min spent</label>
                        <input id="minSpent" className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-semibold" type="number" min="0" value={editing.minSpent} onChange={(event) => setEditing((current) => ({ ...current, minSpent: event.target.value }))} required />
                        <label className="mt-4 block text-sm font-black text-slate-700" htmlFor="discountPercent">Discount percent</label>
                        <input id="discountPercent" className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-semibold" type="number" min="0" max="100" value={editing.discountPercent} onChange={(event) => setEditing((current) => ({ ...current, discountPercent: event.target.value }))} required />
                        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-black text-slate-700" type="button" onClick={() => setEditing(null)}>Đóng</button>
                            <button className="h-10 rounded-lg bg-emerald-600 px-4 text-sm font-black text-white" type="submit">Lưu</button>
                        </div>
                    </form>
                </div>
            )}
        </BackOfficeLayout>
    )
}

export default MembershipPage
