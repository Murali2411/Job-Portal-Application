package com.jobportal.service;

import com.jobportal.dto.JobResponse;
import com.jobportal.dto.UserResponse;
import com.jobportal.entity.Job;
import com.jobportal.entity.User;
import com.jobportal.enums.JobStatus;
import com.jobportal.enums.UserRole;
import com.jobportal.repository.JobRepository;
import com.jobportal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class AdminService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private EmailService emailService;

    public Page<UserResponse> getAllUsers(String role, String keyword, Pageable pageable) {
        Page<User> users;
        
        if (role != null && !role.isEmpty()) {
            UserRole userRole = UserRole.valueOf(role.toUpperCase());
            users = userRepository.findByRoleAndIsActive(userRole, true, pageable);
        } else if (keyword != null && !keyword.isEmpty()) {
            users = userRepository.searchCandidates(keyword, pageable);
        } else {
            users = userRepository.findAll(pageable);
        }
        
        return users.map(this::convertToUserResponse);
    }

    public void toggleUserStatus(Long userId, boolean isActive) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setIsActive(isActive);
        userRepository.save(user);
        
        // Send notification email
        String status = isActive ? "activated" : "deactivated";
        try {
            emailService.sendAccountStatusUpdate(user.getEmail(), status);
        } catch (Exception e) {
            System.err.println("Failed to send status update email: " + e.getMessage());
        }
    }

    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Note: In a real application, you might want to soft delete or archive user data
        // instead of hard delete to maintain data integrity
        userRepository.delete(user);
    }

    public Page<JobResponse> getPendingJobs(Pageable pageable) {
        Page<Job> jobs = jobRepository.findByStatus(JobStatus.PENDING, pageable);
        return jobs.map(this::convertToJobResponse);
    }

    public void approveJob(Long jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));
        
        job.setStatus(JobStatus.APPROVED);
        jobRepository.save(job);
        
        // Send approval notification to recruiter
        try {
            emailService.sendJobApprovalNotification(
                job.getRecruiter().getEmail(), 
                job.getTitle(), 
                "approved"
            );
        } catch (Exception e) {
            System.err.println("Failed to send approval notification: " + e.getMessage());
        }
    }

    public void rejectJob(Long jobId, String reason) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));
        
        job.setStatus(JobStatus.REJECTED);
        jobRepository.save(job);
        
        // Send rejection notification to recruiter
        try {
            emailService.sendJobRejectionNotification(
                job.getRecruiter().getEmail(), 
                job.getTitle(), 
                reason
            );
        } catch (Exception e) {
            System.err.println("Failed to send rejection notification: " + e.getMessage());
        }
    }

    private UserResponse convertToUserResponse(User user) {
        UserResponse response = new UserResponse();
        response.setUserId(user.getUserId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole());
        response.setPhone(user.getPhone());
        response.setLocation(user.getLocation());
        response.setBio(user.getBio());
        response.setSkills(user.getSkills());
        response.setExperience(user.getExperience());
        response.setEducation(user.getEducation());
        response.setIsActive(user.getIsActive());
        response.setEmailVerified(user.getEmailVerified());
        response.setCreatedAt(user.getCreatedAt());
        return response;
    }

    private JobResponse convertToJobResponse(Job job) {
        JobResponse response = new JobResponse();
        response.setJobId(job.getJobId());
        response.setTitle(job.getTitle());
        response.setDescription(job.getDescription());
        response.setCompany(job.getCompany());
        response.setLocation(job.getLocation());
        response.setJobType(job.getJobType());
        response.setMinSalary(job.getMinSalary());
        response.setMaxSalary(job.getMaxSalary());
        response.setRequirements(job.getRequirements());
        response.setBenefits(job.getBenefits());
        response.setSkills(job.getSkills());
        response.setExperience(job.getExperience());
        response.setEducation(job.getEducation());
        response.setApplicationDeadline(job.getApplicationDeadline());
        response.setStatus(job.getStatus());
        response.setCreatedAt(job.getCreatedAt());
        response.setRecruiterName(job.getRecruiter().getName());
        response.setRecruiterEmail(job.getRecruiter().getEmail());
        return response;
    }
}