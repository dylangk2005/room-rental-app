package com.roomrental.api.pricing.repository;

import com.roomrental.api.pricing.entity.PostType;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PostTypeRepository extends JpaRepository<PostType, Integer> {
    PostType findTopByOrderByPriorityAsc();
    List<PostType> findAllByOrderByPriorityAsc();
}