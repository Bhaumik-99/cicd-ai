package com.cicdai.pipeline.repository;

import com.cicdai.pipeline.model.Pipeline;
import com.cicdai.pipeline.model.PipelineStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PipelineRepository extends JpaRepository<Pipeline, UUID> {

    List<Pipeline> findByRepositoryOrderByCreatedAtDesc(String repository);

    List<Pipeline> findByStatusOrderByCreatedAtDesc(PipelineStatus status);

    List<Pipeline> findAllByOrderByCreatedAtDesc();

    @Query("SELECT COUNT(p) FROM Pipeline p WHERE p.status = :status")
    long countByStatus(PipelineStatus status);

    @Query("SELECT AVG(p.durationMs) FROM Pipeline p WHERE p.durationMs IS NOT NULL")
    Double averageDurationMs();
}
