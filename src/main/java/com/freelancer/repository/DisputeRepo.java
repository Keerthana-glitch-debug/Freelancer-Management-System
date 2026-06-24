package com.freelancer.repository;
import com.freelancer.entity.Dispute;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface DisputeRepo extends JpaRepository<Dispute, Long> {
    Optional<Dispute> findByProjectIdAndStatus(Long projectId, String status);
    List<Dispute> findByStatus(String status);
}
