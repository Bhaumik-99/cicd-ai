package com.cicdai.gateway.config;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RouteConfig {

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                // Webhook Service
                .route("webhook-service", r -> r
                        .path("/api/webhooks/**")
                        .uri("http://webhook-service:8081"))

                // Pipeline Service
                .route("pipeline-service", r -> r
                        .path("/api/pipelines/**")
                        .uri("http://pipeline-service:8082"))

                // Build Worker
                .route("build-worker", r -> r
                        .path("/api/builds/**")
                        .uri("http://build-worker:8083"))

                // AI Analyzer
                .route("ai-analyzer", r -> r
                        .path("/api/analyses/**")
                        .uri("http://ai-analyzer:8084"))

                // Failure Service
                .route("failure-service", r -> r
                        .path("/api/failures/**")
                        .uri("http://failure-service:8085"))

                // Notification Service - REST
                .route("notification-service", r -> r
                        .path("/api/notifications/**")
                        .uri("http://notification-service:8086"))

                // Notification Service - WebSocket
                .route("notification-ws", r -> r
                        .path("/ws/**")
                        .uri("ws://notification-service:8086"))

                .build();
    }
}
