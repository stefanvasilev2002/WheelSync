package com.wheelsync.repository;

import com.wheelsync.entity.ServiceDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceDocumentRepository extends JpaRepository<ServiceDocument, Long> {
    List<ServiceDocument> findByServiceRecordId(Long serviceRecordId);
}
