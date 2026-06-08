import { useState } from 'react'
import adminApi from '../../api/adminApi'
import BackOfficeLayout from '../../components/BackOfficeLayout'
import { Message } from '../../components/BackOfficeParts'
import { formatDateTime, getErrorMessage } from '../../utils/backOfficeFormatters'

const BackupsPage = () => {
    const [backup, setBackup] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const runBackup = async () => {
        setLoading(true)
        setError('')
        try {
            const response = await adminApi.runBackup()
            setBackup(response.data)
        } catch (runError) {
            setError(getErrorMessage(runError, 'Không chạy được backup.'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <BackOfficeLayout
            title="Sao lưu dữ liệu"
            subtitle="Kích hoạt sao lưu dữ liệu thủ công và xem kết quả file backup gần nhất."
            actions={
                <button className="h-11 rounded-lg bg-emerald-600 px-4 text-sm font-black text-white disabled:opacity-60" type="button" onClick={runBackup} disabled={loading}>
                    {loading ? 'Đang backup...' : 'Chạy backup'}
                </button>
            }
        >
            {error && <Message type="error">{error}</Message>}
            {backup ? (
                <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
                    <h2 className="text-lg font-black text-emerald-900">Sao lưu thành công</h2>
                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                        <div><dt className="font-bold text-emerald-800">File</dt><dd className="mt-1 font-black text-slate-950">{backup.fileName}</dd></div>
                        <div><dt className="font-bold text-emerald-800">Dung lượng</dt><dd className="mt-1 font-black text-slate-950">{Number(backup.fileSize || 0).toLocaleString('vi-VN')} bytes</dd></div>
                        <div className="sm:col-span-2"><dt className="font-bold text-emerald-800">Đường dẫn</dt><dd className="mt-1 break-all font-black text-slate-950">{backup.filePath}</dd></div>
                        <div><dt className="font-bold text-emerald-800">Thời gian</dt><dd className="mt-1 font-black text-slate-950">{formatDateTime(backup.createdAt)}</dd></div>
                    </dl>
                </section>
            ) : (
                <section className="rounded-lg border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-600">
                    Chưa có kết quả backup trong phiên hiện tại.
                </section>
            )}
        </BackOfficeLayout>
    )
}

export default BackupsPage
