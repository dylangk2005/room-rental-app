package com.roomrental.api.manager.dto.request;

import java.time.LocalDate;
import lombok.Data;

@Data
public class PostListExportRequest {
    private String status;
    private Integer postTypeId;
    private Integer provinceId;
    private Integer districtId;
    private LocalDate from;
    private LocalDate to;
    private String keyword;
    private String exportedBy;
}
