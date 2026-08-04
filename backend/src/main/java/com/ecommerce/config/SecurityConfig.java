package com.ecommerce.config;

import com.ecommerce.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

        private final JwtAuthenticationFilter jwtAuthFilter;
        private final AuthenticationProvider authenticationProvider;

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                http
                                .csrf(AbstractHttpConfigurer::disable)
                                // Kích hoạt CORS
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(auth -> auth
                                                // 1. Cho phép tất cả Preflight OPTIONS request
                                                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                                                // 2. Public GET
                                                .requestMatchers(HttpMethod.GET, "/categories/**", "/api/categories/**")
                                                .permitAll()
                                                .requestMatchers(HttpMethod.GET, "/products/**", "/api/products/**")
                                                .permitAll()

                                                // 3. Public Endpoints khác
                                                .requestMatchers(
                                                                "/auth/**", "/api/auth/**",
                                                                "/search/**", "/api/search/**",
                                                                "/files/**", "/api/files/**",
                                                                "/payment/**", "/api/payment/**",
                                                                "/warranty/lookup/**", "/api/warranty/lookup/**")
                                                .permitAll()

                                                // 4. Admin Endpoints
                                                .requestMatchers("/admin/**", "/api/admin/**").hasRole("ADMIN")
                                                .requestMatchers("/warranty/admin/**", "/api/warranty/admin/**")
                                                .hasRole("ADMIN")
                                                .requestMatchers("/returns/admin/**", "/api/returns/admin/**")
                                                .hasRole("ADMIN")
                                                .requestMatchers("/products/import/**", "/api/products/import/**")
                                                .hasRole("ADMIN")

                                                // 5. Admin Category Actions
                                                .requestMatchers(HttpMethod.POST, "/categories/**",
                                                                "/api/categories/**")
                                                .hasRole("ADMIN")
                                                .requestMatchers(HttpMethod.PUT, "/categories/**", "/api/categories/**")
                                                .hasRole("ADMIN")
                                                .requestMatchers(HttpMethod.DELETE, "/categories/**",
                                                                "/api/categories/**")
                                                .hasRole("ADMIN")

                                                .anyRequest().authenticated())
                                .authenticationProvider(authenticationProvider)
                                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration config = new CorsConfiguration();

                // Thêm domain Vercel + Localhost
                config.setAllowedOrigins(List.of(
                                "http://localhost:3000",
                                "http://localhost:5173",
                                "https://ecommerce-fullstack-ashy.vercel.app"));

                config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
                config.setAllowedHeaders(List.of("*"));
                config.setExposedHeaders(List.of("Authorization", "Content-Type"));
                config.setAllowCredentials(true);
                config.setMaxAge(3600L);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                // Đăng ký cho cả 2 kiểu pattern đường dẫn
                source.registerCorsConfiguration("/**", config);
                source.registerCorsConfiguration("/api/**", config);
                return source;
        }
}