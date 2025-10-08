package com.jobportal.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ResumeResponse {
    private Long resumeId;
    private String fileName;
    private Long fileSize;
    private String fileType;
    private Boolean isPrimary;
    private LocalDateTime uploadDate;
    private String extractedText;
    private String skills;
    private String experience;
    private String education;
    private Long userId;
    private String userName;
}