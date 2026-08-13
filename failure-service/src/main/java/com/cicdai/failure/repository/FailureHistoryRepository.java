package com.cicdai.failure.repository;

import com.cicdai.failure.model.FailureHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FailureHistoryRepository extends JpaRepository<FailureHistory, UUID> {

    List<FailureHistory> findByFailureFingerprintOrderByCreatedAtDesc(String fingerprint);

    List<FailureHistory> findByRepositoryOrderByCreatedAtDesc(String repository);

    List<FailureHistory> findAllByOrderByCreatedAtDesc();
}
