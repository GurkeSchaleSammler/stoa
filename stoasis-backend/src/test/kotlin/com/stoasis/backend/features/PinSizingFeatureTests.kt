package com.stoasis.backend.features

import com.stoasis.backend.domains.pin.api.CreatePinRequest
import com.stoasis.backend.domains.pin.api.UpdateGridBlockRequest
import com.stoasis.backend.domains.pin.api.UpdatePinRequest
import com.stoasis.backend.domains.pin.application.PinService
import com.stoasis.backend.domains.collection.model.PinType
import com.stoasis.backend.shared.web.ApiException
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired

class PinSizingFeatureTests : FeatureTestSupport() {
    @Autowired private lateinit var service: PinService

    @Test
    fun `Markdown and manually resized dimensions survive saving and moving`() {
        val owner = user()
        val board = board(owner)
        val markdown = "# SSH\n\n- **Keys**\n- [x] Done\n\n```sh\nssh host\n```"
        val created = service.create(board, owner.id, CreatePinRequest(
            PinType.note, mapper.valueToTree(mapOf("content" to markdown)),
        ))
        val base = created.grid.heightClips
        val resized = service.update(board, created.id, owner.id, UpdatePinRequest(grid =
            UpdateGridBlockRequest(20, 20, base * 2, 1, width = 32, manualSize = true),
        ))
        assertEquals(32, resized.grid.width)
        assertEquals(base * 2, resized.grid.heightClips)
        assertEquals(base, resized.grid.baseHeightClips)
        assertTrue(resized.grid.manualSize)
        val moved = service.update(board, created.id, owner.id, UpdatePinRequest(grid =
            UpdateGridBlockRequest(30, 30, base * 2, 2),
        ))
        assertEquals(32, moved.grid.width)
        assertTrue(moved.grid.manualSize)
        assertEquals(markdown, pins.findById(created.id).orElseThrow().content)
        assertEquals(resized.grid.baseHeightClips, service.detail(board, created.id, owner.id).grid.baseHeightClips)
    }

    @Test
    fun `repeated resizing cannot increase the limit and automatic height measurement cannot erase it`() {
        val owner = user()
        val board = board(owner)
        val created = service.create(board, owner.id, CreatePinRequest(PinType.note, json("""{"content":"Note"}""")))
        val base = created.grid.heightClips
        service.update(board, created.id, owner.id, UpdatePinRequest(grid =
            UpdateGridBlockRequest(0, 0, base * 2, 1, 32, true),
        ))
        for (invalid in listOf(
            UpdateGridBlockRequest(0, 0, base * 2 + 1, 1, 32, true),
            UpdateGridBlockRequest(0, 0, base, 1, 33, true),
            UpdateGridBlockRequest(0, 0, base - 1, 1, 16, true),
            UpdateGridBlockRequest(129, 0, base, 1, 32, true),
            UpdateGridBlockRequest(0, 0, base, 1, 16, false),
        )) {
            assertFailsWith<ApiException> {
                service.update(board, created.id, owner.id, UpdatePinRequest(grid = invalid))
            }
        }
        val shrunk = service.update(board, created.id, owner.id, UpdatePinRequest(grid =
            UpdateGridBlockRequest(0, 0, base, 1, 16, true),
        ))
        assertEquals(base, shrunk.grid.baseHeightClips)
        assertEquals(base, shrunk.grid.heightClips)
    }

    @Test
    fun `automatic measurements establish the base height before manual sizing`() {
        val owner = user()
        val board = board(owner)
        val pin = service.create(board, owner.id, CreatePinRequest(PinType.note, json("""{"content":"Note"}""")))
        val measured = service.update(board, pin.id, owner.id, UpdatePinRequest(grid =
            UpdateGridBlockRequest(0, 0, 15, 1),
        ))
        assertEquals(15, measured.grid.baseHeightClips)
        val resized = service.update(board, pin.id, owner.id, UpdatePinRequest(grid =
            UpdateGridBlockRequest(0, 0, 30, 1, 24, true),
        ))
        assertEquals(15, resized.grid.baseHeightClips)
        assertEquals(30, resized.grid.heightClips)
    }

    @Test
    fun `resizing respects overlaps with the full width of neighboring pins`() {
        val owner = user()
        val board = board(owner)
        val first = service.create(board, owner.id, CreatePinRequest(PinType.note, json("""{"content":"First"}""")))
        val second = service.create(board, owner.id, CreatePinRequest(PinType.note, json("""{"content":"Second"}""")))
        service.update(board, second.id, owner.id, UpdatePinRequest(grid =
            UpdateGridBlockRequest(16, 30, second.grid.heightClips, 1, 32, true),
        ))
        assertFailsWith<ApiException> {
            service.update(board, first.id, owner.id, UpdatePinRequest(grid =
                UpdateGridBlockRequest(8, 30, first.grid.heightClips, 1, 32, true),
            ))
        }
    }
}
