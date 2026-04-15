package com.ecommerce.service;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class OtpStore {

    private record OtpEntry(String otp, Instant expiresAt) {}

    private final Map<String, OtpEntry> store = new ConcurrentHashMap<>();
    private final Set<String> verifiedEmails = ConcurrentHashMap.newKeySet();

    public void save(String email, String otp) {
        store.put(email.toLowerCase(), new OtpEntry(otp, Instant.now().plusSeconds(300)));
    }

    public boolean verify(String email, String otp) {
        OtpEntry entry = store.get(email.toLowerCase());
        if (entry == null) return false;
        if (Instant.now().isAfter(entry.expiresAt())) {
            store.remove(email.toLowerCase());
            return false;
        }
        boolean valid = entry.otp().equals(otp);
        if (valid) {
            store.remove(email.toLowerCase());
            markVerified(email);
        }
        return valid;
    }

    public boolean exists(String email) {
        OtpEntry entry = store.get(email.toLowerCase());
        if (entry == null) return false;
        if (Instant.now().isAfter(entry.expiresAt())) {
            store.remove(email.toLowerCase());
            return false;
        }
        return true;
    }

    public void markVerified(String email) {
        verifiedEmails.add(email.toLowerCase());
    }

    public boolean isVerified(String email) {
        return verifiedEmails.contains(email.toLowerCase());
    }

    public void clearVerified(String email) {
        verifiedEmails.remove(email.toLowerCase());
    }
}