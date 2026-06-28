import { useState } from 'react'
import adminApi from '../../api/adminApi'
import BackOfficeLayout from '../../components/BackOfficeLayout'
import { Message, Toast } from '../../components/BackOfficeParts'
import { formatDateTime, formatMoney, getErrorMessage } from '../../utils/backOfficeFormatters'

const BackupsPage = () => {
    const [backup, setBackup] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [toast, setToast] = useState(null)

    const showToast = (type, message) => {
        setToast({ type, message })
        setTimeout(() => setToast(null), 4000)
    }

    const runBackup = async () => {
        setLoading(true)
        setError('')
        try {
            const response = await adminApi.runBackup()
            setBackup(response.data)
            showToast('success', `Sao lưu thành công! File: ${response.data.fileName}`)
        } catch (runError) {
            const msg = getErrorMessage(runError, 'Không chạy được backup.')
            setError(msg)
            showToast('error', msg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <BackOfficeLayout
            title="Sao lưu dữ liệu"
            subtitle="Kích hoạt sao lưu dữ liệu thủ công và xem kết quả file backup gần nhất."
            actions={
                <button
                    className="inline-flex items-center gap-2 h-11 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white transition-all duration-200 hover:scale-[1.03] hover:bg-emerald-700 hover:shadow-lg active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100"
                    type="button"
                    onClick={runBackup}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Đang sao lưu...
                        </>
                    ) : (
                        <>
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            Chạy sao lưu
                        </>
                    )}
                </button>
            }
        >
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            {error && !toast && <Message type="error">{error}</Message>}

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100">
                        <svg className="h-7 w-7 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-lg font-black text-slate-950">Sao lưu dữ liệu</h2>
                        <p className="mt-1 text-sm font-semibold text-slate-500">Tạo bản sao lưu cơ sở dữ liệu để đảm bảo an toàn thông tin. File backup được lưu trữ tại thư mục cấu hình trên máy chủ.</p>
                    </div>
                </div>
            </section>

            {backup && (
                <section className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 transition-all duration-300">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                            <svg className="h-5 w-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-base font-black text-emerald-800">Sao lưu thành công</h3>
                            <p className="text-xs font-semibold text-emerald-600">File đã được tạo và lưu trên máy chủ</p>
                        </div>
                    </div>
                    <div className="grid gap-4 rounded-xl bg-white/80 p-4 sm:grid-cols-2">
                        <div className="group">
                            <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">File</p>
                            <p className="mt-1 font-black text-slate-950 break-all">{backup.fileName}</p>
                        </div>
                        <div className="group">
                            <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">Dung lượng</p>
                            <p className="mt-1 font-black text-slate-950">{Number(backup.fileSize || 0).toLocaleString('vi-VN')} bytes</p>
                        </div>
                        <div className="group sm:col-span-2">
                            <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">Đường dẫn</p>
                            <p className="mt-1 font-black text-slate-950 break-all">{backup.filePath}</p>
                        </div>
                        <div className="group">
                            <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">Thời gian tạo</p>
                            <p className="mt-1 font-black text-slate-950">{formatDateTime(backup.createdAt)}</p>
                        </div>
                    </div>
                </section>
            )}

            {!backup && !loading && (
                <section className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-10 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                        <svg className="h-8 w-8 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                    </div>
                    <p className="text-sm font-semibold text-slate-500">Chưa có bản sao lưu trong phiên hiện tại.</p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">Nhấn "Chạy sao lưu" để tạo bản sao lưu mới.</p>
                </section>
            )}
        </BackOfficeLayout>
    )
}

export default BackupsPage
