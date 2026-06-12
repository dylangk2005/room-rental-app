package com.roomrental.api.pricing.repository;

import com.roomrental.api.pricing.entity.PostTypePrice;
import com.roomrental.api.pricing.entity.PostTypePriceId;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PostTypePriceRepository extends JpaRepository<PostTypePrice, PostTypePriceId> {
    List<PostTypePrice> findByPostType_IdOrderById_DayAsc(Integer postTypeId);
}