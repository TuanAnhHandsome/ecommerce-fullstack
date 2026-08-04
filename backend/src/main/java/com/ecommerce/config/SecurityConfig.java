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

        private static final String[] PUBLIC_ENDPOINTS = {
                        "/auth/**",
                        "/search/**",
                        "/files/**",
                        "/payment/vnpay-return",
                        "/payment/vnpay-ipn",
                        "/warranty/lookup/**"
        };

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                http
                                .csrf(AbstractHttpConfigurer::disable)
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(auth -> auth
                                                // Preflight CORS
                                                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                                                // ADMIN Endpoints - Cần khớp cả /api/...
                                                .requestMatchers("/api/admin/**", "/admin/**").hasRole("ADMIN")
                                                .requestMatchers("/api/warranty/admin/**", "/warranty/admin/**")
                                                .hasRole("ADMIN")
                                                .requestMatchers("/api/returns/admin/**", "/returns/admin/**")
                                                .hasRole("ADMIN")
                                                .requestMatchers("/api/products/import/**", "/products/import/**")
                                                .hasRole("ADMIN")

                                                // Categories
                                                .requestMatchers(HttpMethod.POST, "/api/categories/**",
                                                                "/categories/**")
                                                .hasRole("ADMIN")
                                                .requestMatchers(HttpMethod.PUT, "/api/categories/**", "/categories/**")
                                                .hasRole("ADMIN")
                                                .requestMatchers(HttpMethod.DELETE, "/api/categories/**",
                                                                "/categories/**")
                                                .hasRole("ADMIN")

                                                // Public GET
                                                .requestMatchers(HttpMethod.GET, "/api/categories/**", "/categories/**")
                                                .permitAll()
                                                .requestMatchers(HttpMethod.GET, "/api/products/**", "/products/**")
                                                .permitAll()

                                                // Public endpoints khác
                                                .requestMatchers("/api/auth/**", "/auth/**", "/api/files/**",
                                                                "/files/**")
                                                .permitAll()

                                                .anyRequest().authenticated())
                                .authenticationProvider(authenticationProvider)
                                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration config = new CorsConfiguration();

                config.setAllowedOrigins(List.of(
                                "http://localhost:3000",
                                "http://localhost:5173",
                                "https://ecommerce-fullstack-ashy.vercel.app"));

                config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
                config.setAllowedHeaders(List.of("*"));
                config.setAllowCredentials(true);
                config.setMaxAge(3600L);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", config);
                return source;
        }
}