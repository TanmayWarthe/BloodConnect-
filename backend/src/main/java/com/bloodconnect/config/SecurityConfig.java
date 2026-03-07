package com.bloodconnect.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Spring Security configuration.
 * Authentication is handled by Firebase on the client side.
 * The backend trusts the Firebase UID passed in requests.
 * In production, add a Firebase token validation filter.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF since we use stateless JWT/Firebase auth
            .csrf(csrf -> csrf.disable())

            // Allow all API requests — Firebase auth is validated per request in services
            .authorizeHttpRequests(auth -> auth
                .anyRequest().permitAll()
            )

            // Stateless session — no server-side sessions
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // Disable HTTP Basic auth popup
            .httpBasic(basic -> basic.disable())

            // Disable form login
            .formLogin(form -> form.disable());

        return http.build();
    }
}
