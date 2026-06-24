package com.freelancer.repository;

import com.freelancer.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface UserRepo extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);
    List<User> findByRole(String role);
}
