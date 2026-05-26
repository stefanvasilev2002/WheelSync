package com.wheelsync.controller;

import com.wheelsync.dto.push.PushSubscriptionRequest;
import com.wheelsync.entity.PushSubscription;
import com.wheelsync.entity.User;
import com.wheelsync.exception.ResourceNotFoundException;
import com.wheelsync.repository.PushSubscriptionRepository;
import com.wheelsync.repository.UserRepository;
import com.wheelsync.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/push")
@RequiredArgsConstructor
public class PushSubscriptionController {

    private final PushSubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;

    /** Register or update a push subscription for the current user. */
    @PostMapping("/subscribe")
    public ResponseEntity<Void> subscribe(
            @Valid @RequestBody PushSubscriptionRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", principal.getId()));

        subscriptionRepository.findByUserIdAndEndpoint(user.getId(), req.getEndpoint())
                .ifPresentOrElse(
                        existing -> {
                            existing.setP256dh(req.getP256dh());
                            existing.setAuth(req.getAuth());
                            subscriptionRepository.save(existing);
                        },
                        () -> subscriptionRepository.save(
                                PushSubscription.builder()
                                        .user(user)
                                        .endpoint(req.getEndpoint())
                                        .p256dh(req.getP256dh())
                                        .auth(req.getAuth())
                                        .build()
                        )
                );

        return ResponseEntity.ok().build();
    }

    /** Remove a push subscription (e.g., when user logs out). */
    @DeleteMapping("/unsubscribe")
    public ResponseEntity<Void> unsubscribe(
            @Valid @RequestBody PushSubscriptionRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {

        subscriptionRepository.deleteByUserIdAndEndpoint(principal.getId(), req.getEndpoint());
        return ResponseEntity.noContent().build();
    }
}
