package com.stoasis.backend

import org.flywaydb.core.Flyway
import org.flywaydb.core.api.MigrationVersion
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.jdbc.datasource.DriverManagerDataSource
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers

@Testcontainers
class PostgresMigrationTests {
    @Test
    fun `production migrations preserve existing data and create the current schema on PostgreSQL`() {
        val dataSource = DriverManagerDataSource(postgres.jdbcUrl, postgres.username, postgres.password)
        val jdbc = JdbcTemplate(dataSource)
        val flywayToPreviousRelease = Flyway.configure()
            .dataSource(postgres.jdbcUrl, postgres.username, postgres.password)
            .locations("classpath:db/migration")
            .target(MigrationVersion.fromVersion("15"))
            .load()
        flywayToPreviousRelease.migrate()

        jdbc.update(
            "INSERT INTO users (id, email, name, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
            "user-preserved",
            "preserved@example.test",
            "Preserved User",
        )
        val result = Flyway.configure()
            .dataSource(dataSource)
            .locations("classpath:db/migration")
            .load()
            .migrate()
        val latestVersion = jdbc.queryForObject(
            "SELECT version FROM flyway_schema_history WHERE success = true ORDER BY installed_rank DESC LIMIT 1",
            String::class.java,
        )
        val foreignKeyCount = jdbc.queryForObject(
            "SELECT COUNT(*) FROM information_schema.table_constraints " +
                "WHERE table_schema = 'public' AND constraint_type = 'FOREIGN KEY'",
            Int::class.java,
        )

        val sessionTableCount = jdbc.queryForObject(
            "SELECT COUNT(*) FROM information_schema.tables " +
                "WHERE table_schema = 'public' AND table_name IN ('spring_session', 'spring_session_attributes')",
            Int::class.java,
        )
        val preservedUsers = jdbc.queryForObject(
            "SELECT COUNT(*) FROM users WHERE id = 'user-preserved' AND email = 'preserved@example.test'",
            Int::class.java,
        )

        assertEquals("17", latestVersion)
        assertEquals(2, result.migrationsExecuted)
        assertTrue(foreignKeyCount != null && foreignKeyCount > 0, "Expected relational integrity constraints")
        assertEquals(2, sessionTableCount)
        assertEquals(1, preservedUsers)
        val flagSql = "INSERT INTO user_flags (user_id, flag_key, outcome, seen_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING"
        jdbc.update(flagSql, "user-preserved", "tutorial.test.v1", "skipped")
        jdbc.update(flagSql, "user-preserved", "tutorial.test.v1", "completed")
        assertEquals("skipped", jdbc.queryForObject("SELECT outcome FROM user_flags WHERE user_id = 'user-preserved'", String::class.java))
        jdbc.update("DELETE FROM users WHERE id = 'user-preserved'")
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM user_flags", Int::class.java))
    }

    companion object {
        @Container
        @JvmStatic
        val postgres = PostgreSQLContainer<Nothing>("postgres:16-alpine")
    }
}
