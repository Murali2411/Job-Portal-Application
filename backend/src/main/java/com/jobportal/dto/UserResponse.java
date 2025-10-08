package com.jobportal.dto;

import com.jobportal.enums.UserRole;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserResponse {
    private Long userId;
    private String name;
    private String email;
    private UserRole role;
    private String phone;
    private String location;
    private String profilePicture;
    private String bio;
    private String skills;
    private String experience;
    private String education;
    private Boolean isActive;
    private Boolean emailVerified;
    private LocalDateTime createdAt;
}