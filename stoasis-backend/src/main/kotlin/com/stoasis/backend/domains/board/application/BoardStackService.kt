package com.stoasis.backend.domains.board.application

import com.stoasis.backend.domains.board.api.BoardElementsDto
import com.stoasis.backend.domains.board.api.CreateStackRequest
import com.stoasis.backend.domains.board.api.ReleaseStackChildRequest
import com.stoasis.backend.domains.board.api.StackBlockDto
import com.stoasis.backend.domains.board.api.UpdateStackRequest
import com.stoasis.backend.domains.board.data.PinStackChildEntity
import com.stoasis.backend.domains.board.data.PinStackEntity
import com.stoasis.backend.domains.board.data.PinStackRepository
import com.stoasis.backend.domains.board.utils.badRequest
import com.stoasis.backend.domains.board.utils.boardElementId
import com.stoasis.backend.domains.board.utils.requireGridBounds
import com.stoasis.backend.domains.board.utils.toDto
import com.stoasis.backend.domains.board.utils.touchCollection
import com.stoasis.backend.domains.pin.application.PinService.Companion.CARD_WIDTH_CLIPS
import com.stoasis.backend.domains.pin.data.PinEntity
import com.stoasis.backend.shared.web.ApiException
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class BoardStackService(
    private val support: BoardElementSupport,
    private val query: BoardElementQueryService,
    private val stacks: PinStackRepository,
) {
    @Transactional
    fun createStack(collectionId: String, userId: String, request: CreateStackRequest): StackBlockDto {
        val collection = support.editableCollection(collectionId, userId)
        if (request.sourcePinId == request.targetPinId) badRequest("Eine Karte kann nicht mit sich selbst gestapelt werden.")
        val source = support.getPin(collectionId, request.sourcePinId)
        val target = support.getPin(collectionId, request.targetPinId)
        support.requireSolo(source.id)
        support.requireSolo(target.id)
        val height = maxOf(source.heightClips, target.heightClips)
        support.requireNewStackPositionAllowed(collectionId, target.gridX, target.gridY, height, setOf(source.id, target.id))

        val stack = PinStackEntity(
            id = boardElementId("stack"),
            collection = collection,
            gridX = target.gridX,
            gridY = target.gridY,
            heightClips = height,
            layer = support.maxLayer(collectionId) + 1,
        )
        stack.children.add(child(stack, target, 0))
        stack.children.add(child(stack, source, 1))
        touchCollection(collection)
        return stacks.save(stack).toDto()
    }

    @Transactional
    fun addStackChild(collectionId: String, stackId: String, pinId: String, userId: String): StackBlockDto {
        val collection = support.editableCollection(collectionId, userId)
        val stack = support.getStack(collectionId, stackId)
        val pin = support.getPin(collectionId, pinId)
        support.requireSolo(pin.id)
        val proposedHeight = maxOf(stack.heightClips, pin.heightClips)
        support.requireStackPositionAllowed(collectionId, stack.id, stack.gridX, stack.gridY, proposedHeight)
        stack.children.add(child(stack, pin, stack.children.size))
        stack.heightClips = proposedHeight
        stack.layer = support.maxLayer(collectionId) + 1
        touchCollection(collection)
        return stack.toDto()
    }

    @Transactional
    fun updateStack(
        collectionId: String,
        stackId: String,
        userId: String,
        request: UpdateStackRequest,
    ): StackBlockDto {
        val collection = support.editableCollection(collectionId, userId)
        val stack = support.getStack(collectionId, stackId)
        val x = request.x ?: stack.gridX
        val y = request.y ?: stack.gridY
        requireGridBounds(x, y, stack.heightClips, CARD_WIDTH_CLIPS)
        if (x != stack.gridX || y != stack.gridY) {
            support.requireStackPositionAllowed(collectionId, stack.id, x, y, stack.heightClips)
        }
        stack.gridX = x
        stack.gridY = y
        request.layer?.let {
            if (it < 0) badRequest("Ungültige Kartenebene.")
            stack.layer = it
        }
        request.expanded?.let { stack.expanded = it }
        touchCollection(collection)
        return stack.toDto()
    }

    @Transactional
    fun releaseStackChild(
        collectionId: String,
        stackId: String,
        userId: String,
        request: ReleaseStackChildRequest,
    ): BoardElementsDto {
        val collection = support.editableCollection(collectionId, userId)
        val stack = support.getStack(collectionId, stackId)
        val child = stack.children.firstOrNull { it.pin?.id == request.pinId }
            ?: throw ApiException(HttpStatus.NOT_FOUND, "Karte ist nicht Teil dieses Stacks.")
        val pin = child.pin ?: throw ApiException(HttpStatus.NOT_FOUND, "Karte nicht gefunden.")
        requireGridBounds(request.x, request.y, pin.heightClips, CARD_WIDTH_CLIPS)
        support.requirePinPositionAllowed(collectionId, pin.id, stack.id, request.x, request.y, pin.heightClips)

        pin.gridX = request.x
        pin.gridY = request.y
        pin.layer = request.layer.coerceAtLeast(0)
        stack.children.remove(child)
        normalizeOrDissolve(stack)
        touchCollection(collection)
        return query.snapshot(collectionId)
    }

    @Transactional
    fun dissolveStack(collectionId: String, stackId: String, userId: String): BoardElementsDto {
        val collection = support.editableCollection(collectionId, userId)
        val stack = support.getStack(collectionId, stackId)
        restoreChildren(stack)
        stacks.delete(stack)
        touchCollection(collection)
        return query.snapshot(collectionId)
    }

    private fun child(stack: PinStackEntity, pin: PinEntity, position: Int) = PinStackChildEntity(
        stack = stack,
        pin = pin,
        position = position,
        originalX = pin.gridX,
        originalY = pin.gridY,
        originalLayer = pin.layer,
    )

    private fun normalizeOrDissolve(stack: PinStackEntity) {
        stack.children.forEachIndexed { index, child -> child.position = index }
        when (stack.children.size) {
            0 -> stacks.delete(stack)
            1 -> {
                val remaining = stack.children.single().pin
                if (remaining != null) {
                    remaining.gridX = stack.gridX
                    remaining.gridY = stack.gridY
                    remaining.layer = stack.layer
                }
                stack.children.clear()
                stacks.delete(stack)
            }
            else -> stack.heightClips = stack.children.maxOf { it.pin?.heightClips ?: 1 }
        }
    }

    private fun restoreChildren(stack: PinStackEntity) {
        stack.children.forEach { child ->
            child.pin?.let { pin ->
                pin.gridX = child.originalX
                pin.gridY = child.originalY
                pin.layer = child.originalLayer
            }
        }
        stack.children.clear()
    }
}
