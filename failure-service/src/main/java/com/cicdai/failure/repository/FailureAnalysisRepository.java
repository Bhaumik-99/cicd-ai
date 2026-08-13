package com.cicdai.failure.repository;

import com.cicdai.failure.model.FailureAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FailureAnalysisRepository extends JpaRepository<FailureAnalysis, UUID> {

    Optional<FailureAnalysis> findByPipelineId(UUID pipelineId);

    List<FailureAnalysis> findAllByOrderByCreatedAtDesc();

    List<FailureAnalysis> findByRepositoryOrderByCreatedAtDesc(String repository);

    List<FailureAnalysis> findBySeverityOrderByCreatedAtDesc(String severity);

    List<FailureAnalysis> findByFailureTypeOrderByCreatedAtDesc(String failureType);
}
