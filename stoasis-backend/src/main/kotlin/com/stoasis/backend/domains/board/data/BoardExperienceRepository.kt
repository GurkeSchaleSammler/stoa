package com.stoasis.backend.domains.board.data

import com.stoasis.backend.domains.board.api.*
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Repository
import java.time.LocalDate

/** Relational path steps and dates cascade with their board and pins. */
@Repository
class BoardExperienceRepository(private val jdbc: JdbcTemplate) {
    fun paths(boardId: String): List<PresentationPathDto> {
        val steps = jdbc.query(
            "SELECT s.path_id, s.pin_id FROM board_presentation_steps s JOIN board_presentation_paths p ON p.id = s.path_id WHERE p.collection_id = ? ORDER BY s.step_order",
            { rs, _ -> rs.getString("path_id") to rs.getString("pin_id") }, boardId,
        ).groupBy({ it.first }, { it.second })
        return jdbc.query("SELECT id, name FROM board_presentation_paths WHERE collection_id = ? ORDER BY name, id",
            { rs, _ -> PresentationPathDto(rs.getString("id"), rs.getString("name"), steps[rs.getString("id")] ?: emptyList()) }, boardId)
    }
    fun count(boardId: String): Long = jdbc.queryForObject(
        "SELECT COUNT(*) FROM board_presentation_paths WHERE collection_id = ?", Long::class.java, boardId,
    )!!
    fun exists(boardId: String, id: String): Boolean = jdbc.queryForObject(
        "SELECT COUNT(*) FROM board_presentation_paths WHERE collection_id = ? AND id = ?", Long::class.java, boardId, id,
    )!! > 0
    fun savePath(boardId: String, path: PresentationPathDto, create: Boolean) {
        if (create) jdbc.update("INSERT INTO board_presentation_paths (id, collection_id, name) VALUES (?, ?, ?)", path.id, boardId, path.name)
        else jdbc.update("UPDATE board_presentation_paths SET name = ? WHERE id = ? AND collection_id = ?", path.name, path.id, boardId)
        jdbc.update("DELETE FROM board_presentation_steps WHERE path_id = ?", path.id)
        jdbc.batchUpdate("INSERT INTO board_presentation_steps (path_id, pin_id, step_order) VALUES (?, ?, ?)", path.pinIds.withIndex().toList(), 500) { statement, step ->
            statement.setString(1, path.id)
            statement.setString(2, step.value)
            statement.setInt(3, step.index)
        }
    }
    fun deletePath(boardId: String, id: String) { jdbc.update("DELETE FROM board_presentation_paths WHERE collection_id = ? AND id = ?", boardId, id) }
    fun dates(boardId: String): List<PinDateDto> = jdbc.query(
        "SELECT pin_id, start_date, end_date FROM board_pin_dates WHERE collection_id = ? ORDER BY start_date, pin_id",
        { rs, _ -> PinDateDto(rs.getString("pin_id"), rs.getObject("start_date", LocalDate::class.java), rs.getObject("end_date", LocalDate::class.java)) }, boardId,
    )
    fun saveDate(boardId: String, pinId: String, request: SavePinDateRequest) {
        jdbc.update("DELETE FROM board_pin_dates WHERE collection_id = ? AND pin_id = ?", boardId, pinId)
        if (request.startDate != null) jdbc.update("INSERT INTO board_pin_dates (pin_id, collection_id, start_date, end_date) VALUES (?, ?, ?, ?)", pinId, boardId, request.startDate, request.endDate)
    }
}
