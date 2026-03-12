package com.bloodconnect.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    @Value("${allowed.origins:http://localhost:5173,http://localhost:3000}")
    private String allowedOrigins;

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        // Allow credentials (cookies, auth headers)
        config.setAllowCredentials(true);

        // Read allowed origins from environment variable — supports comma-separated list
        // e.g. ALLOWED_ORIGINS=https://bloodconnect.vercel.app,http://localhost:5173
        config.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));

        // Allow all standard headers
        config.setAllowedHeaders(List.of("*"));

        // Expose the Authorization header to browser JS
        config.setExposedHeaders(List.of("Authorization", "Content-Type"));

        // Allow all HTTP methods
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

        // Cache preflight response for 1 hour
        config.setMaxAge(3600L);

        // Apply to all endpoints
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }
}

