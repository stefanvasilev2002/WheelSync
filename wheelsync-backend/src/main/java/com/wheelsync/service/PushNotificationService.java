package com.wheelsync.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wheelsync.entity.PushSubscription;
import com.wheelsync.repository.PushSubscriptionRepository;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.security.Security;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class PushNotificationService {

    private final PushSubscriptionRepository subscriptionRepository;
    private final PushService pushService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    static {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
    }

    public PushNotificationService(
            PushSubscriptionRepository subscriptionRepository,
            @Value("${vapid.public-key}") String publicKey,
            @Value("${vapid.private-key}") String privateKey,
            @Value("${vapid.subject}") String subject) {
        this.subscriptionRepository = subscriptionRepository;
        try {
            this.pushService = new PushService(publicKey, privateKey, subject);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to initialise VAPID PushService", e);
        }
    }

    // ─── Send to a specific user ──────────────────────────────────────────────

    @Async
    public void sendToUser(Long userId, String title, String body, String url) {
        List<PushSubscription> subs = subscriptionRepository.findAllByUserId(userId);
        sendToSubscriptions(subs, title, body, url, "general");
    }

    // ─── Send to all fleet managers of a company ──────────────────────────────

    @Async
    public void sendToCompanyManagers(Long companyId, String title, String body, String url) {
        List<PushSubscription> subs = subscriptionRepository.findByCompanyManagers(companyId);
        sendToSubscriptions(subs, title, body, url, "reminder");
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    private void sendToSubscriptions(List<PushSubscription> subs,
                                     String title, String body, String url, String type) {
        if (subs.isEmpty()) return;

        String payload;
        try {
            payload = objectMapper.writeValueAsString(Map.of(
                    "title", title,
                    "body", body,
                    "url", url != null ? url : "/",
                    "type", type
            ));
        } catch (Exception e) {
            log.error("Failed to serialise push payload", e);
            return;
        }

        for (PushSubscription sub : subs) {
            try {
                Notification notification = new Notification(
                        sub.getEndpoint(),
                        sub.getP256dh(),
                        sub.getAuth(),
                        payload.getBytes()
                );
                pushService.send(notification);
                log.debug("Push notification sent to endpoint: {}", sub.getEndpoint());
            } catch (Exception e) {
                log.warn("Failed to send push to endpoint {}: {}", sub.getEndpoint(), e.getMessage());
                // Expired/invalid subscriptions are removed silently
                if (e.getMessage() != null && e.getMessage().contains("410")) {
                    subscriptionRepository.delete(sub);
                }
            }
        }
    }
}
