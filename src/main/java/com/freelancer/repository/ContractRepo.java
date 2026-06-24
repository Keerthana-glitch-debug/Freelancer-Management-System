package com.freelancer.repository;
import com.freelancer.entity.Contract;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface ContractRepo extends JpaRepository<Contract, Long> {
    Optional<Contract> findByProjectId(Long projectId);
    List<Contract> findByFreelancerId(Long freelancerId);
    List<Contract> findByClientId(Long clientId);
}
