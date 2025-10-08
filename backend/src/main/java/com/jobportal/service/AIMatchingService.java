package com.jobportal.service;

import com.jobportal.dto.JobResponse;
import com.jobportal.entity.Job;
import com.jobportal.entity.User;
import com.jobportal.entity.Resume;
import com.jobportal.repository.JobRepository;
import com.jobportal.repository.ResumeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AIMatchingService {

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private ResumeRepository resumeRepository;

    public Page<JobResponse> getJobRecommendations(User candidate, Pageable pageable) {
        // Get candidate's skills and experience
        String candidateSkills = candidate.getSkills();
        String candidateExperience = candidate.getExperience();
        String candidateLocation = candidate.getLocation();

        // Get candidate's resume data
        Optional<Resume> primaryResume = resumeRepository.findByUserUserIdAndIsPrimaryTrue(candidate.getUserId());
        if (primaryResume.isPresent()) {
            candidateSkills = combineSkills(candidateSkills, primaryResume.get().getSkills());
            candidateExperience = combineExperience(candidateExperience, primaryResume.get().getExperience());
        }

        // Get all approved jobs
        List<Job> allJobs = jobRepository.findByStatus(com.jobportal.enums.JobStatus.APPROVED, Pageable.unpaged()).getContent();

        // Calculate match scores
        List<JobWithScore> jobsWithScores = new ArrayList<>();
        for (Job job : allJobs) {
            double score = calculateMatchScore(candidateSkills, candidateExperience, candidateLocation, job);
            jobsWithScores.add(new JobWithScore(job, score));
        }

        // Sort by match score
        jobsWithScores.sort((a, b) -> Double.compare(b.getScore(), a.getScore()));

        // Convert to JobResponse and apply pagination
        List<JobResponse> jobResponses = jobsWithScores.stream()
                .map(jws -> convertToJobResponseWithScore(jws.getJob(), jws.getScore()))
                .collect(Collectors.toList());

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), jobResponses.size());
        List<JobResponse> pageContent = jobResponses.subList(start, end);

        return new PageImpl<>(pageContent, pageable, jobResponses.size());
    }

    public double calculateMatchScore(String candidateSkills, String candidateExperience, 
                                    String candidateLocation, Job job) {
        double score = 0.0;
        
        // Skills matching (40% weight)
        if (candidateSkills != null && job.getSkills() != null) {
            score += calculateSkillsMatch(candidateSkills, job.getSkills()) * 0.4;
        }

        // Experience matching (30% weight)
        if (candidateExperience != null && job.getExperience() != null) {
            score += calculateExperienceMatch(candidateExperience, job.getExperience()) * 0.3;
        }

        // Location matching (20% weight)
        if (candidateLocation != null && job.getLocation() != null) {
            score += calculateLocationMatch(candidateLocation, job.getLocation()) * 0.2;
        }

        // Job freshness (10% weight)
        score += calculateFreshnessScore(job) * 0.1;

        return Math.min(score, 1.0); // Cap at 1.0
    }

    private double calculateSkillsMatch(String candidateSkills, String jobSkills) {
        Set<String> candidateSkillSet = extractSkills(candidateSkills.toLowerCase());
        Set<String> jobSkillSet = extractSkills(jobSkills.toLowerCase());

        if (jobSkillSet.isEmpty()) return 0.5; // Neutral score if no job skills specified

        int matches = 0;
        for (String jobSkill : jobSkillSet) {
            if (candidateSkillSet.contains(jobSkill)) {
                matches++;
            }
        }

        return (double) matches / jobSkillSet.size();
    }

    private double calculateExperienceMatch(String candidateExp, String jobExp) {
        // Simple experience level matching
        int candidateYears = extractExperienceYears(candidateExp);
        int requiredYears = extractExperienceYears(jobExp);

        if (requiredYears == 0) return 0.8; // Good match if no specific requirement

        if (candidateYears >= requiredYears) {
            return 1.0; // Perfect match
        } else if (candidateYears >= requiredYears * 0.7) {
            return 0.8; // Close match
        } else if (candidateYears >= requiredYears * 0.5) {
            return 0.6; // Partial match
        } else {
            return 0.3; // Low match
        }
    }

    private double calculateLocationMatch(String candidateLocation, String jobLocation) {
        if (jobLocation.toLowerCase().contains("remote")) {
            return 1.0; // Perfect match for remote jobs
        }

        String candLoc = candidateLocation.toLowerCase();
        String jobLoc = jobLocation.toLowerCase();

        if (candLoc.equals(jobLoc)) {
            return 1.0; // Exact match
        } else if (candLoc.contains(jobLoc) || jobLoc.contains(candLoc)) {
            return 0.8; // Partial match
        } else {
            return 0.3; // Different locations
        }
    }

    private double calculateFreshnessScore(Job job) {
        long daysSincePosted = java.time.temporal.ChronoUnit.DAYS.between(
            job.getCreatedAt().toLocalDate(), 
            java.time.LocalDate.now()
        );

        if (daysSincePosted <= 7) return 1.0;
        else if (daysSincePosted <= 30) return 0.8;
        else if (daysSincePosted <= 60) return 0.6;
        else return 0.4;
    }

    private Set<String> extractSkills(String skillsText) {
        if (skillsText == null) return new HashSet<>();
        
        return Arrays.stream(skillsText.split("[,;\\n]"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
    }

    private int extractExperienceYears(String experienceText) {
        if (experienceText == null) return 0;
        
        // Simple regex to extract years of experience
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("(\\d+)\\s*(?:years?|yrs?)");
        java.util.regex.Matcher matcher = pattern.matcher(experienceText.toLowerCase());
        
        if (matcher.find()) {
            return Integer.parseInt(matcher.group(1));
        }
        
        // Handle ranges like "3-5 years"
        pattern = java.util.regex.Pattern.compile("(\\d+)\\s*-\\s*(\\d+)\\s*(?:years?|yrs?)");
        matcher = pattern.matcher(experienceText.toLowerCase());
        
        if (matcher.find()) {
            int min = Integer.parseInt(matcher.group(1));
            int max = Integer.parseInt(matcher.group(2));
            return (min + max) / 2; // Return average
        }
        
        return 0;
    }

    private String combineSkills(String skills1, String skills2) {
        if (skills1 == null) return skills2;
        if (skills2 == null) return skills1;
        return skills1 + ", " + skills2;
    }

    private String combineExperience(String exp1, String exp2) {
        if (exp1 == null) return exp2;
        if (exp2 == null) return exp1;
        return exp1 + " " + exp2;
    }

    private JobResponse convertToJobResponseWithScore(Job job, double score) {
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
        response.setMatchScore(score);
        return response;
    }

    // Helper class for job with score
    private static class JobWithScore {
        private final Job job;
        private final double score;

        public JobWithScore(Job job, double score) {
            this.job = job;
            this.score = score;
        }

        public Job getJob() { return job; }
        public double getScore() { return score; }
    }
}