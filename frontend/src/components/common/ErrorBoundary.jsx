import { Component } from 'react'

/**
 * Bắt lỗi runtime của React component tree phía dưới nó.
 * Trước đây app không có Error Boundary nào — nếu 1 component con throw lỗi
 * (vd. dữ liệu API trả về thiếu field, lỗi render...), cả trang sẽ trắng xoá
 * thay vì hiển thị fallback UI thân thiện.
 *
 * Lưu ý: Error Boundary KHÔNG bắt được lỗi trong event handler (onClick, onChange...),
 * lỗi async (setTimeout, promise), hay lỗi ở chính nó / SSR. Đó là giới hạn của React,
 * không phải thiếu sót khi implement.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // TODO: gửi lỗi này lên dịch vụ giám sát (Sentry, LogRocket...) khi có
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo)
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <i className="fa-solid fa-triangle-exclamation text-2xl text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">
              Đã có lỗi xảy ra
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Rất tiếc, ứng dụng gặp sự cố ngoài ý muốn. Vui lòng thử tải lại trang.
              Nếu lỗi vẫn tiếp diễn, hãy liên hệ bộ phận hỗ trợ.
            </p>
            <button
              onClick={this.handleReload}
              className="btn-primary px-6 py-2.5"
            >
              <i className="fa-solid fa-house mr-2" />
              Về trang chủ
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
