package com.roomrental.api.repository;

import com.roomrental.api.entity.PostType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostTypeRepository extends JpaRepository<PostType, Integer> {
    PostType findTopByOrderByPriorityAsc();
    List<PostType> findAllByOrderByPriorityAsc();
}
