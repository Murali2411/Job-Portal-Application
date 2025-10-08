package com.jobportal.service;

import com.jobportal.dto.RegisterRequest;
import com.jobportal.entity.User;
import com.jobportal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    public User register(RegisterRequest request) throws Exception {
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new Exception("Email already exists");
        }

        // Create new user
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setPhone(request.getPhone());
        user.setLocation(request.getLocation());
        user.setBio(request.getBio());
        user.setSkills(request.getSkills());
        user.setExperience(request.getExperience());
        user.setEducation(request.getEducation());
        user.setIsActive(true);
        user.setEmailVerified(false);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        return userRepository.save(user);
    }

    public User authenticate(String email, String password) throws Exception {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new Exception("Invalid email or password"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new Exception("Invalid email or password");
        }

        if (!user.getIsActive()) {
            throw new Exception("Account is deactivated");
        }

        return user;
    }

    public void sendPasswordResetEmail(String email) throws Exception {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new Exception("User not found"));

        // For now, just log - implement email later
        System.out.println("Password reset requested for: " + email);
        // TODO: Implement actual email sending with token
    }

    public void resetPassword(String token, String newPassword) throws Exception {
        // TODO: Implement token validation and password reset
        throw new Exception("Password reset not yet implemented");
    }
}