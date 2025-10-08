package com.jobportal.controller;

import com.jobportal.dto.ResumeResponse;
import com.jobportal.service.ResumeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/resumes")
@CrossOrigin(origins = "*")
public class ResumeController {

    @Autowired
    private ResumeService resumeService;

    @PostMapping("/upload")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ResumeResponse> uploadResume(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "false") boolean isPrimary,
            Authentication auth) {
        
        ResumeResponse response = resumeService.uploadResume(file, isPrimary, auth.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-resumes")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<List<ResumeResponse>> getMyResumes(Authentication auth) {
        List<ResumeResponse> resumes = resumeService.getUserResumes(auth.getName());
        return ResponseEntity.ok(resumes);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('CANDIDATE') or hasRole('RECRUITER') or hasRole('ADMIN')")
    public ResponseEntity<ResumeResponse> getResumeById(@PathVariable Long id, Authentication auth) {
        ResumeResponse response = resumeService.getResumeById(id, auth.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/download")
    @PreAuthorize("hasRole('CANDIDATE') or hasRole('RECRUITER') or hasRole('ADMIN')")
    public ResponseEntity<Resource> downloadResume(@PathVariable Long id, Authentication auth) {
        Resource resource = resumeService.downloadResume(id, auth.getName());
        ResumeResponse resumeInfo = resumeService.getResumeById(id, auth.getName());
        
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, 
                       "attachment; filename=\"" + resumeInfo.getFileName() + "\"")
                .body(resource);
    }

    @PutMapping("/{id}/set-primary")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<?> setPrimaryResume(@PathVariable Long id, Authentication auth) {
        resumeService.setPrimaryResume(id, auth.getName());
        return ResponseEntity.ok("Primary resume updated successfully");
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<?> deleteResume(@PathVariable Long id, Authentication auth) {
        resumeService.deleteResume(id, auth.getName());
        return ResponseEntity.ok("Resume deleted successfully");
    }

    @PostMapping("/{id}/extract-text")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<?> extractResumeText(@PathVariable Long id, Authentication auth) {
        resumeService.extractAndProcessResumeText(id, auth.getName());
        return ResponseEntity.ok("Resume text extracted and processed");
    }
}