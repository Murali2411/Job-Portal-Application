// Resume Repository
package com.jobportal.repository;

import com.jobportal.entity.Resume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResumeRepository extends JpaRepository<Resume, Long> {
    
    List<Resume> findByUserUserId(Long userId);
    
    Optional<Resume> findByUserUserIdAndIsPrimaryTrue(Long userId);
    
    @Query("SELECT r FROM Resume r WHERE r.user.userId = :userId ORDER BY r.uploadDate DESC")
    List<Resume> findByUserIdOrderByUploadDateDesc(@Param("userId") Long userId);
    
    @Query("SELECT r FROM Resume r WHERE " +
           "LOWER(r.extractedText) LIKE LOWER(CONCAT('%', :skill, '%')) OR " +
           "LOWER(r.skills) LIKE LOWER(CONCAT('%', :skill, '%'))")
    List<Resume> findBySkill(@Param("skill") String skill);
    
    boolean existsByUserUserIdAndFileName(Long userId, String fileName);
}