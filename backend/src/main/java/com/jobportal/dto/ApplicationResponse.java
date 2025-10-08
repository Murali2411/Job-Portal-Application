package com.jobportal.dto;

import com.jobportal.enums.ApplicationStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ApplicationResponse {
    private Long applicationId;
    private String coverLetter;
    private ApplicationStatus status;
    private String recruiterNotes;
    private Double aiMatchScore;
    private LocalDateTime appliedAt;
    
    // Job details
    private Long jobId;
    private String jobTitle;
    private String company;
    private String jobLocation;
    
    // Candidate details
    private Long candidateId;
    private String candidateName;
    private String candidateEmail;
    
    // Resume details
    private Long resumeId;
    private String resumeFileName;
}