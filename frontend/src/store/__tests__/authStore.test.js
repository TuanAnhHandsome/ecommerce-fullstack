import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore } from '../authStore'
import { authAPI } from '../../services/api'

vi.mock('../../services/api', () => ({
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    sendOtp: vi.fn(),
    verifyOtp: vi.fn(),
  },
}))

const resetStore = () => {
  useAuthStore.setState({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isBootstrapping: true,
  })
}

describe('authStore', () => {
  beforeEach(() => {
    resetStore()
    vi.clearAllMocks()
  })

  it('login lưu user + accessToken (RAM) và set isAuthenticated = true', async () => {
    // Lưu ý: response KHÔNG còn field refreshToken nữa — nó nằm trong cookie httpOnly
    // do backend set qua header Set-Cookie, JS không thấy được giá trị này.
    authAPI.login.mockResolvedValue({
      data: { user: { id: 1, email: 'user@ecommerce.vn', role: 'USER' }, accessToken: 'access-abc' },
    })

    const user = await useAuthStore.getState().login('user@ecommerce.vn', 'User@123')

    const state = useAuthStore.getState()
    expect(user.email).toBe('user@ecommerce.vn')
    expect(state.accessToken).toBe('access-abc')
    expect(state.isAuthenticated).toBe(true)
    expect(state).not.toHaveProperty('refreshToken')
  })

  it('logout gọi API backend (để revoke refresh token + xoá cookie) rồi mới xoá state local', async () => {
    useAuthStore.setState({ user: { id: 1 }, accessToken: 't', isAuthenticated: true })
    authAPI.logout.mockResolvedValue({ data: { message: 'ok' } })

    await useAuthStore.getState().logout()

    expect(authAPI.logout).toHaveBeenCalledTimes(1)
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.accessToken).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('logout vẫn xoá state local dù API logout lỗi (vd. mất mạng) — không để UI kẹt ở trạng thái đăng nhập giả', async () => {
    useAuthStore.setState({ user: { id: 1 }, accessToken: 't', isAuthenticated: true })
    authAPI.logout.mockRejectedValue(new Error('Network error'))

    await useAuthStore.getState().logout()

    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('isAdmin() trả về true chỉ khi role === ADMIN', () => {
    useAuthStore.setState({ user: { role: 'ADMIN' } })
    expect(useAuthStore.getState().isAdmin()).toBe(true)

    useAuthStore.setState({ user: { role: 'USER' } })
    expect(useAuthStore.getState().isAdmin()).toBe(false)
  })

  describe('bootstrapSession (khôi phục phiên đăng nhập khi mở app)', () => {
    it('luôn gọi /auth/refresh (cookie httpOnly được browser tự gửi kèm) và set lại session nếu thành công', async () => {
      authAPI.refresh.mockResolvedValue({
        data: { user: { id: 1, role: 'USER' }, accessToken: 'new-access-token' },
      })

      await useAuthStore.getState().bootstrapSession()

      const state = useAuthStore.getState()
      expect(authAPI.refresh).toHaveBeenCalledWith()
      expect(state.accessToken).toBe('new-access-token')
      expect(state.user).toEqual({ id: 1, role: 'USER' })
      expect(state.isAuthenticated).toBe(true)
      expect(state.isBootstrapping).toBe(false)
    })

    it('coi như chưa đăng nhập nếu không có cookie refreshToken hợp lệ (khách mới/đã hết hạn)', async () => {
      authAPI.refresh.mockRejectedValue({ response: { status: 401 } })

      await useAuthStore.getState().bootstrapSession()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.accessToken).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isBootstrapping).toBe(false)
    })
  })
})
