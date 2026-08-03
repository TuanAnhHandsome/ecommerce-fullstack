package com.ecommerce.service;

import com.ecommerce.dto.request.LoginRequest;
import com.ecommerce.dto.response.AuthResponse;
import com.ecommerce.entity.RefreshToken;
import com.ecommerce.entity.User;
import com.ecommerce.enums.Role;
import com.ecommerce.exception.BusinessException;
import com.ecommerce.repository.RefreshTokenRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.security.JwtService;
import com.ecommerce.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private UserDetailsService userDetailsService;
    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @InjectMocks
    private AuthServiceImpl authService;

    private User sampleUser;
    private UserDetails userDetails;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .fullName("Nguyen Van A")
                .email("test@ecommerce.com")
                .password("encoded_password")
                .role(Role.USER)
                .enabled(true)
                .build();

        userDetails = mock(UserDetails.class);
    }

    @Test
    @DisplayName("Login - Thành công trả về AuthResponse chứa AccessToken và RefreshToken")
    void login_Success() {
        // Given
        LoginRequest request = new LoginRequest("test@ecommerce.com", "password123");

        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(sampleUser));
        when(userDetailsService.loadUserByUsername(request.getEmail())).thenReturn(userDetails);
        when(jwtService.generateAccessToken(userDetails)).thenReturn("mock_access_token");
        when(jwtService.generateRefreshToken(userDetails)).thenReturn("mock_refresh_token");
        when(jwtService.getRefreshTokenExpirationMs()).thenReturn(604800000L);

        // When
        AuthResponse response = authService.login(request);

        // Then
        assertNotNull(response);
        assertEquals("mock_access_token", response.getAccessToken());
        assertEquals("mock_refresh_token", response.getRefreshToken());
        assertEquals("test@ecommerce.com", response.getUser().getEmail());

        verify(authenticationManager, times(1)).authenticate(any());
        verify(refreshTokenRepository, times(1)).save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("Login - Thất bại khi không tìm thấy email")
    void login_UserNotFound() {
        // Given
        LoginRequest request = new LoginRequest("notfound@ecommerce.com", "password123");
        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.empty());

        // When & Then
        BusinessException exception = assertThrows(BusinessException.class, () -> authService.login(request));
        assertEquals("Không tìm thấy tài khoản", exception.getMessage());
        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    @DisplayName("RefreshToken - Thành công với Token Rotation")
    void refreshToken_Success() {
        // Given
        String oldToken = "old_valid_refresh_token";
        String email = "test@ecommerce.com";

        RefreshToken storedToken = RefreshToken.builder()
                .id(10L)
                .token(oldToken)
                .user(sampleUser)
                .expiresAt(LocalDateTime.now().plusDays(1))
                .revoked(false)
                .build();

        when(jwtService.extractUsername(oldToken)).thenReturn(email);
        when(userDetailsService.loadUserByUsername(email)).thenReturn(userDetails);
        when(jwtService.isTokenValid(oldToken, userDetails)).thenReturn(true);
        when(refreshTokenRepository.findByTokenAndRevokedFalse(oldToken)).thenReturn(Optional.of(storedToken));
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(sampleUser));
        when(jwtService.generateAccessToken(userDetails)).thenReturn("new_access_token");
        when(jwtService.generateRefreshToken(userDetails)).thenReturn("new_refresh_token");

        // When
        AuthResponse response = authService.refreshToken(oldToken);

        // Then
        assertNotNull(response);
        assertEquals("new_access_token", response.getAccessToken());
        assertEquals("new_refresh_token", response.getRefreshToken());

        // Verify Token Rotation: Phải xóa token cũ, flush DB và tạo token mới
        verify(refreshTokenRepository, times(1)).deleteByToken(oldToken);
        verify(refreshTokenRepository, times(1)).flush();
        verify(refreshTokenRepository, times(1)).save(any(RefreshToken.class));
    }
}