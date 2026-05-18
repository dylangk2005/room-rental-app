package com.roomrental.api.service.impl;

import com.roomrental.api.service.BackupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;

@Component
@RequiredArgsConstructor
@Slf4j
public class ScheduledBackupJob {

    private final BackupService backupService;

    @Value("${backup.enabled:true}")
    private boolean backupEnabled;

    @Value("${backup.directory:backups}")
    private String backupDirectory;

    @Value("${backup.retention-count:31}")
    private int retentionCount;

    @Scheduled(cron = "${backup.cron:0 0 2 * * *}")
    public void runScheduledBackup() {
        if (!backupEnabled) {
            return;
        }

        try {
            backupService.runBackup(null);
            cleanupOldBackups();
        } catch (Exception exception) {
            log.error("Sao lưu database định kỳ thất bại", exception);
        }
    }

    private void cleanupOldBackups() {
        try {
            Path directory = Path.of(backupDirectory);

            if (!Files.exists(directory)) {
                return;
            }

            var backups = Files.list(directory)
                    .filter(path -> path.getFileName().toString().endsWith(".sql"))
                    .sorted(Comparator.comparing(this::getLastModifiedTime).reversed())
                    .toList();

            for (int i = retentionCount; i < backups.size(); i++) {
                Files.deleteIfExists(backups.get(i));
            }
        } catch (Exception exception) {
            log.error("Xóa file backup cũ thất bại", exception);
        }
    }

    private long getLastModifiedTime(Path path) {
        try {
            return Files.getLastModifiedTime(path).toMillis();
        } catch (Exception exception) {
            return 0;
        }
    }
}