import { Component } from 'react'

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { error: null, info: null, stack: '' }
    }

    static getDerivedStateFromError(error) {
        return { error }
    }

    componentDidCatch(error, info) {
        // eslint-disable-next-line no-console
        console.error('[ErrorBoundary] Caught error:', error, info)
        // eslint-disable-next-line no-console
        console.error('[ErrorBoundary] Stack:', error?.stack)
        this.setState({ info, stack: error?.stack || '' })
    }

    handleReset = () => {
        this.setState({ error: null, info: null })
        if (this.props.onReset) this.props.onReset()
    }

    render() {
        if (this.state.error) {
            const { fallback } = this.props
            if (fallback) return fallback(this.state.error, this.handleReset)
            return (
                <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950">
                    <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700 shadow-sm">
                        <h1 className="text-2xl font-black">Đã xảy ra lỗi khi hiển thị trang</h1>
                    <p className="mt-3 text-sm break-words">
                        {String(this.state.error?.message || this.state.error)}
                    </p>
                    {this.state.stack && (
                        <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-900 p-3 text-left text-[11px] text-slate-100">
                            {this.state.stack}
                        </pre>
                    )}
                        <button
                            type="button"
                            onClick={this.handleReset}
                            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-black text-white shadow-lg shadow-red-600/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-700 active:scale-[0.98]"
                        >
                            Tải lại trang
                        </button>
                    </div>
                </main>
            )
        }
        return this.props.children
    }
}
