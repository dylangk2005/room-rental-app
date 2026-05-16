package com.roomrental.api.repository;

import com.roomrental.api.entity.PostTypePrice;
import com.roomrental.api.entity.PostTypePriceId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PostTypePriceRepository extends JpaRepository<PostTypePrice, PostTypePriceId> {

}
