package com.jobportal.service;

import com.jobportal.dto.ResumeResponse;
import com.jobportal.entity.Resume;
import com.jobportal.entity.User;
import com.jobportal.repository.ResumeRepository;
import com.jobportal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ResumeService {

    @Autowired
    private ResumeRepository resumeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ResumeTextExtractorService textExtractorService;

    @Value("${file.upload.dir:./uploads/resumes}")
    private String uploadDir;

    public ResumeResponse uploadResume(MultipartFile file, boolean isPrimary, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        validateFile(file);

        try {
            // Create upload directory if it doesn't exist
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate unique filename
            String originalFileName = file.getOriginalFilename();
            String fileExtension = getFileExtension(originalFileName);
            String uniqueFileName = UUID.randomUUID().toString() + "_" + originalFileName;
            Path filePath = uploadPath.resolve(uniqueFileName);

            // Copy file to upload directory
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // If setting as primary, unset other primary resumes
            if (isPrimary) {
                resumeRepository.findByUserUserId(user.getUserId())
                        .forEach(resume -> {
                            resume.setIsPrimary(false);
                            resumeRepository.save(resume);
                        });
            }

            // Create resume entity
            Resume resume = new Resume();
            resume.setFileName(originalFileName);
            resume.setFilePath(filePath.toString());
            resume.setFileSize(file.getSize());
            resume.setFileType(fileExtension);
            resume.setIsPrimary(isPrimary);
            resume.setUser(user);

            Resume savedResume = resumeRepository.save(resume);

            // Extract text asynchronously
            try {
                extractAndProcessResumeText(savedResume.getResumeId(), userEmail);
            } catch (Exception e) {
                System.err.println("Failed to extract text from resume: " + e.getMessage());
            }

            return convertToResumeResponse(savedResume);

        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + e.getMessage());
        }
    }

    public List<ResumeResponse> getUserResumes(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Resume> resumes = resumeRepository.findByUserIdOrderByUploadDateDesc(user.getUserId());
        return resumes.stream()
                .map(this::convertToResumeResponse)
                .collect(Collectors.toList());
    }

    public ResumeResponse getResumeById(Long id, String userEmail) {
        Resume resume = resumeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resume not found"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check access permissions
        boolean hasAccess = resume.getUser().getUserId().equals(user.getUserId()) ||
                           user.getRole().name().equals("RECRUITER") ||
                           user.getRole().name().equals("ADMIN");

        if (!hasAccess) {
            throw new RuntimeException("Access denied");
        }

        return convertToResumeResponse(resume);
    }

    public Resource downloadResume(Long id, String userEmail) {
        Resume resume = resumeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resume not found"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check access permissions
        boolean hasAccess = resume.getUser().getUserId().equals(user.getUserId()) ||
                           user.getRole().name().equals("RECRUITER") ||
                           user.getRole().name().equals("ADMIN");

        if (!hasAccess) {
            throw new RuntimeException("Access denied");
        }

        try {
            Path filePath = Paths.get(resume.getFilePath());
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("File not found or not readable");
            }
        } catch (Exception e) {
            throw new RuntimeException("Error downloading file: " + e.getMessage());
        }
    }

    public void setPrimaryResume(Long id, String userEmail) {
        Resume resume = resumeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resume not found"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!resume.getUser().getUserId().equals(user.getUserId())) {
            throw new RuntimeException("You can only modify your own resumes");
        }

        // Unset other primary resumes
        resumeRepository.findByUserUserId(user.getUserId())
                .forEach(r -> {
                    r.setIsPrimary(false);
                    resumeRepository.save(r);
                });

        // Set this resume as primary
        resume.setIsPrimary(true);
        resumeRepository.save(resume);
    }

    public void deleteResume(Long id, String userEmail) {
        Resume resume = resumeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resume not found"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!resume.getUser().getUserId().equals(user.getUserId())) {
            throw new RuntimeException("You can only delete your own resumes");
        }

        try {
            // Delete file from filesystem
            Path filePath = Paths.get(resume.getFilePath());
            Files.deleteIfExists(filePath);

            // Delete from database
            resumeRepository.delete(resume);

        } catch (IOException e) {
            throw new RuntimeException("Failed to delete file: " + e.getMessage());
        }
    }

    public void extractAndProcessResumeText(Long id, String userEmail) {
        Resume resume = resumeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resume not found"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!resume.getUser().getUserId().equals(user.getUserId())) {
            throw new RuntimeException("You can only process your own resumes");
        }

        try {
            String extractedText = textExtractorService.extractText(resume.getFilePath());
            String extractedSkills = textExtractorService.extractSkills(extractedText);
            String extractedExperience = textExtractorService.extractExperience(extractedText);
            String extractedEducation = textExtractorService.extractEducation(extractedText);

            resume.setExtractedText(extractedText);
            resume.setSkills(extractedSkills);
            resume.setExperience(extractedExperience);
            resume.setEducation(extractedEducation);

            resumeRepository.save(resume);

        } catch (Exception e) {
            throw new RuntimeException("Failed to extract text: " + e.getMessage());
        }
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }

        String fileName = file.getOriginalFilename();
        if (fileName == null) {
            throw new RuntimeException("File name is null");
        }

        String fileExtension = getFileExtension(fileName).toLowerCase();
        if (!isValidFileType(fileExtension)) {
            throw new RuntimeException("Invalid file type. Only PDF, DOC, and DOCX files are allowed");
        }

        // Check file size (max 10MB)
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new RuntimeException("File size too large. Maximum size is 10MB");
        }
    }

    private String getFileExtension(String fileName) {
        int lastDotIndex = fileName.lastIndexOf('.');
        return lastDotIndex > 0 ? fileName.substring(lastDotIndex + 1) : "";
    }

    private boolean isValidFileType(String fileExtension) {
        return fileExtension.equals("pdf") || 
               fileExtension.equals("doc") || 
               fileExtension.equals("docx");
    }

    private ResumeResponse convertToResumeResponse(Resume resume) {
        ResumeResponse response = new ResumeResponse();
        response.setResumeId(resume.getResumeId());
        response.setFileName(resume.getFileName());
        response.setFileSize(resume.getFileSize());
        response.setFileType(resume.getFileType());
        response.setIsPrimary(resume.getIsPrimary());
        response.setUploadDate(resume.getUploadDate());
        response.setExtractedText(resume.getExtractedText());
        response.setSkills(resume.getSkills());
        response.setExperience(resume.getExperience());
        response.setEducation(resume.getEducation());
        response.setUserId(resume.getUser().getUserId());
        response.setUserName(resume.getUser().getName());
        return response;
    }
}