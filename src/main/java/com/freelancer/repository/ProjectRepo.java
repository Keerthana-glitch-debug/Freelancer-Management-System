package com.freelancer.repository;

import com.freelancer.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface ProjectRepo extends JpaRepository<Project, Long> {
    List<Project> findByStatus(String status);
    List<Project> findByClientId(Long clientId);
    List<Project> findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String t, String d);
    List<Project> findByBudgetBetween(double min, double max);
}
