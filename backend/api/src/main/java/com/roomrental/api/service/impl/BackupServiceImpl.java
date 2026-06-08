package com.roomrental.api.service.impl;

import com.roomrental.api.dto.response.admin.BackupResponse;
import com.roomrental.api.entity.AuditLog;
import com.roomrental.api.exception.AppException;
import com.roomrental.api.service.AuditLogService;
import com.roomrental.api.service.BackupService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class BackupServiceImpl implements BackupService {

    private final AuditLogService auditLogService;

    @Value("${spring.datasource.url}")
    private String datasourceUrl;

    @Value("${spring.datasource.username}")
    private String datasourceUsername;

    @Value("${spring.datasource.password}")
    private String datasourcePassword;

    @Value("${backup.directory:backups}")
    private String backupDirectory;

    @Value("${backup.mysqldump-path:mysqldump}")
    private String mysqldumpPath;

    @Override
    public BackupResponse runBackup(Integer adminId) {
        try {
            LocalDateTime now = LocalDateTime.now();
            Files.createDirectories(Path.of(backupDirectory));

            DatabaseInfo databaseInfo = parseDatabaseInfo(datasourceUrl);
            String timestamp = now.format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String fileName = databaseInfo.databaseName() + "_backup_" + timestamp + ".sql";
            Path outputPath = Path.of(backupDirectory, fileName);

            ProcessBuilder processBuilder = new ProcessBuilder(
                    mysqldumpPath,
                    "-h", databaseInfo.host(),
                    "-P", databaseInfo.port(),
                    "-u", datasourceUsername,
                    "--password=" + datasourcePassword,
                    databaseInfo.databaseName()
            );

            processBuilder.redirectOutput(outputPath.toFile());
            processBuilder.redirectError(ProcessBuilder.Redirect.PIPE);

            Process process = processBuilder.start();
            int exitCode = process.waitFor();

            if (exitCode != 0) {
                String errorMessage = new String(process.getErrorStream().readAllBytes());
                Files.deleteIfExists(outputPath);
                throw AppException.badRequest("Sao lưu dữ liệu thất bại: " + errorMessage);
            }

            long fileSize = Files.size(outputPath);

            auditLogService.log(
                    adminId,
                    "RUN_DATABASE_BACKUP",
                    AuditLog.TargetType.SYSTEM,
                    null,
                    "Quản trị viên #" + adminId + " sao lưu cơ sở dữ liệu thành công: " + outputPath
            );

            return BackupResponse.builder()
                    .fileName(fileName)
                    .filePath(outputPath.toString())
                    .fileSize(fileSize)
                    .createdAt(now)
                    .build();
        } catch (AppException exception) {
            throw exception;
        } catch (Exception exception) {
            throw AppException.badRequest("Sao lưu dữ liệu thất bại: " + exception.getMessage());
        }
    }

    private DatabaseInfo parseDatabaseInfo(String jdbcUrl) {
        try {
            String normalizedUrl = jdbcUrl.replace("jdbc:", "");
            URI uri = URI.create(normalizedUrl);

            String databaseName = uri.getPath().replaceFirst("/", "");
            int queryIndex = databaseName.indexOf("?");
            if (queryIndex >= 0) {
                databaseName = databaseName.substring(0, queryIndex);
            }

            String host = uri.getHost() != null ? uri.getHost() : "localhost";
            String port = uri.getPort() > 0 ? String.valueOf(uri.getPort()) : "3306";

            return new DatabaseInfo(host, port, databaseName);
        } catch (Exception exception) {
            throw AppException.badRequest("Không đọc được cấu hình database từ spring.datasource.url");
        }
    }

    private record DatabaseInfo(String host, String port, String databaseName) {
    }
}
