package com.stoasis.backend.domains.board.application

import com.stoasis.backend.domains.board.api.BoardElementsDto
import com.stoasis.backend.domains.board.api.ConnectorThreadDto
import com.stoasis.backend.domains.board.api.CreateConnectorRequest
import com.stoasis.backend.domains.board.api.CreateFloatingLabelRequest
import com.stoasis.backend.domains.board.api.CreateSoftZoneRequest
import com.stoasis.backend.domains.board.api.CreateStackRequest
import com.stoasis.backend.domains.board.api.CreateStickerRequest
import com.stoasis.backend.domains.board.api.FloatingLabelDto
import com.stoasis.backend.domains.board.api.ReleaseStackChildRequest
import com.stoasis.backend.domains.board.api.SoftZoneDto
import com.stoasis.backend.domains.board.api.StackBlockDto
import com.stoasis.backend.domains.board.api.StickerElementDto
import com.stoasis.backend.domains.board.api.UpdateFloatingLabelRequest
import com.stoasis.backend.domains.board.api.UpdateSoftZoneRequest
import com.stoasis.backend.domains.board.api.UpdateStackRequest
import com.stoasis.backend.domains.board.api.UpdateStickerRequest
import com.stoasis.backend.domains.board.data.BoardConnectorEntity
import com.stoasis.backend.domains.board.data.BoardConnectorRepository
import com.stoasis.backend.domains.board.data.FloatingLabelEntity
import com.stoasis.backend.domains.board.data.FloatingLabelRepository
import com.stoasis.backend.domains.board.data.PinStackChildEntity
import com.stoasis.backend.domains.board.data.PinStackChildRepository
import com.stoasis.backend.domains.board.data.PinStackEntity
import com.stoasis.backend.domains.board.data.PinStackRepository
import com.stoasis.backend.domains.board.data.SoftZoneEntity
import com.stoasis.backend.domains.board.data.SoftZoneRepository
import com.stoasis.backend.domains.board.data.StickerEntity
import com.stoasis.backend.domains.board.data.StickerRepository
import com.stoasis.backend.domains.collection.application.CollectionService
import com.stoasis.backend.domains.collection.data.CollectionEntity
import com.stoasis.backend.domains.pin.application.PinService.Companion.BOARD_HEIGHT_CLIPS
import com.stoasis.backend.domains.pin.application.PinService.Companion.BOARD_WIDTH_CLIPS
import com.stoasis.backend.domains.pin.application.PinService.Companion.CARD_WIDTH_CLIPS
import com.stoasis.backend.domains.pin.data.PinEntity
import com.stoasis.backend.domains.pin.data.PinRepository
import com.stoasis.backend.shared.web.ApiException
import java.time.Instant
import java.util.UUID
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class BoardElementService(
    private val collections: CollectionService,
    private val pins: PinRepository,
    private val stacks: PinStackRepository,
    private val stackChildren: PinStackChildRepository,
    private val connectors: BoardConnectorRepository,
    private val zones: SoftZoneRepository,
    private val labels: FloatingLabelRepository,
    private val stickers: StickerRepository,
) {
    companion object {
        const val CLIP_SIZE_PX = 14.0
        private val COLORS = setOf("accent", "sage", "clay", "ink", "amber")
        private val STICKER_MOTIFS = setOf(
            "circle",
            "triangle",
            "moon",
            "blob",
            "star",
            "wave",
            "arrow",
            "leaf",
            "cloud",
            "drop",
            "compass",
            "suitcase",
            "camera",
        )
    }

    @Transactional(readOnly = true)
    fun list(collectionId: String, userId: String): BoardElementsDto {
        val collection = collections.get(collectionId)
        collections.requireView(collection, userId)
        return snapshot(collectionId)
    }

    @Transactional
    fun createStack(collectionId: String, userId: String, request: CreateStackRequest): StackBlockDto {
        val collection = editableCollection(collectionId, userId)
        if (request.sourcePinId == request.targetPinId) badRequest("Eine Karte kann nicht mit sich selbst gestapelt werden.")
        val source = getPin(collectionId, request.sourcePinId)
        val target = getPin(collectionId, request.targetPinId)
        requireSolo(source.id)
        requireSolo(target.id)
        val height = maxOf(source.heightClips, target.heightClips)
        requireNewStackPositionAllowed(collectionId, target.gridX, target.gridY, height, setOf(source.id, target.id))

        val stack = PinStackEntity(
            id = id("stack"),
            collection = collection,
            gridX = target.gridX,
            gridY = target.gridY,
            heightClips = height,
            layer = maxLayer(collectionId) + 1,
        )
        stack.children.add(child(stack, target, 0))
        stack.children.add(child(stack, source, 1))
        touch(collection)
        return toDto(stacks.save(stack))
    }

    @Transactional
    fun addStackChild(collectionId: String, stackId: String, pinId: String, userId: String): StackBlockDto {
        val collection = editableCollection(collectionId, userId)
        val stack = getStack(collectionId, stackId)
        val pin = getPin(collectionId, pinId)
        requireSolo(pin.id)
        val proposedHeight = maxOf(stack.heightClips, pin.heightClips)
        requireStackPositionAllowed(collectionId, stack.id, stack.gridX, stack.gridY, proposedHeight)
        stack.children.add(child(stack, pin, stack.children.size))
        stack.heightClips = proposedHeight
        stack.layer = maxLayer(collectionId) + 1
        touch(collection)
        return toDto(stack)
    }

    @Transactional
    fun updateStack(
        collectionId: String,
        stackId: String,
        userId: String,
        request: UpdateStackRequest,
    ): StackBlockDto {
        val collection = editableCollection(collectionId, userId)
        val stack = getStack(collectionId, stackId)
        val x = request.x ?: stack.gridX
        val y = request.y ?: stack.gridY
        requireGridBounds(x, y, stack.heightClips, CARD_WIDTH_CLIPS)
        if (x != stack.gridX || y != stack.gridY) {
            requireStackPositionAllowed(collectionId, stack.id, x, y, stack.heightClips)
        }
        stack.gridX = x
        stack.gridY = y
        request.layer?.let {
            if (it < 0) badRequest("Ungültige Kartenebene.")
            stack.layer = it
        }
        request.expanded?.let { stack.expanded = it }
        touch(collection)
        return toDto(stack)
    }

    @Transactional
    fun releaseStackChild(
        collectionId: String,
        stackId: String,
        userId: String,
        request: ReleaseStackChildRequest,
    ): BoardElementsDto {
        val collection = editableCollection(collectionId, userId)
        val stack = getStack(collectionId, stackId)
        val child = stack.children.firstOrNull { it.pin?.id == request.pinId }
            ?: throw ApiException(HttpStatus.NOT_FOUND, "Karte ist nicht Teil dieses Stacks.")
        val pin = child.pin ?: throw ApiException(HttpStatus.NOT_FOUND, "Karte nicht gefunden.")
        requireGridBounds(request.x, request.y, pin.heightClips, CARD_WIDTH_CLIPS)
        requirePinPositionAllowed(collectionId, pin.id, stack.id, request.x, request.y, pin.heightClips)

        pin.gridX = request.x
        pin.gridY = request.y
        pin.layer = request.layer.coerceAtLeast(0)
        stack.children.remove(child)
        normalizeOrDissolve(stack)
        touch(collection)
        return snapshot(collectionId)
    }

    @Transactional
    fun dissolveStack(collectionId: String, stackId: String, userId: String): BoardElementsDto {
        val collection = editableCollection(collectionId, userId)
        val stack = getStack(collectionId, stackId)
        restoreChildren(stack)
        stacks.delete(stack)
        touch(collection)
        return snapshot(collectionId)
    }

    @Transactional
    fun createConnector(
        collectionId: String,
        userId: String,
        request: CreateConnectorRequest,
    ): ConnectorThreadDto {
        val collection = editableCollection(collectionId, userId)
        if (request.sourcePinId == request.targetPinId) badRequest("Eine Verbindung braucht zwei Karten.")
        val source = getPin(collectionId, request.sourcePinId)
        val target = getPin(collectionId, request.targetPinId)
        val duplicate = connectors.existsByCollectionIdAndSourcePinIdAndTargetPinId(
            collectionId,
            source.id,
            target.id,
        ) || connectors.existsByCollectionIdAndSourcePinIdAndTargetPinId(collectionId, target.id, source.id)
        if (duplicate) throw ApiException(HttpStatus.CONFLICT, "Diese Karten sind bereits verbunden.")
        val connector = connectors.save(
            BoardConnectorEntity(
                id = id("thread"),
                collection = collection,
                sourcePin = source,
                targetPin = target,
                colorVariant = color(request.colorVariant),
            ),
        )
        touch(collection)
        return toDto(connector)
    }

    @Transactional
    fun deleteConnector(collectionId: String, connectorId: String, userId: String) {
        val collection = editableCollection(collectionId, userId)
        val connector = connectors.findByIdAndCollectionId(connectorId, collectionId)
            ?: throw ApiException(HttpStatus.NOT_FOUND, "Verbindung nicht gefunden.")
        connectors.delete(connector)
        touch(collection)
    }

    @Transactional
    fun createZone(collectionId: String, userId: String, request: CreateSoftZoneRequest): SoftZoneDto {
        val collection = editableCollection(collectionId, userId)
        requireZoneBounds(request.x, request.y, request.widthClips, request.heightClips)
        val zone = zones.save(
            SoftZoneEntity(
                id = id("zone"),
                collection = collection,
                gridX = request.x,
                gridY = request.y,
                widthClips = request.widthClips,
                heightClips = request.heightClips,
                colorVariant = color(request.colorVariant),
                label = cleanOptionalText(request.label, 80),
            ),
        )
        touch(collection)
        return toDto(zone)
    }

    @Transactional
    fun updateZone(
        collectionId: String,
        zoneId: String,
        userId: String,
        request: UpdateSoftZoneRequest,
    ): SoftZoneDto {
        val collection = editableCollection(collectionId, userId)
        val zone = zones.findByIdAndCollectionId(zoneId, collectionId)
            ?: throw ApiException(HttpStatus.NOT_FOUND, "Zone nicht gefunden.")
        val x = request.x ?: zone.gridX
        val y = request.y ?: zone.gridY
        val width = request.widthClips ?: zone.widthClips
        val height = request.heightClips ?: zone.heightClips
        requireZoneBounds(x, y, width, height)
        zone.gridX = x
        zone.gridY = y
        zone.widthClips = width
        zone.heightClips = height
        request.colorVariant?.let { zone.colorVariant = color(it) }
        request.label?.let { zone.label = cleanOptionalText(it, 80) }
        touch(collection)
        return toDto(zone)
    }

    @Transactional
    fun deleteZone(collectionId: String, zoneId: String, userId: String) {
        val collection = editableCollection(collectionId, userId)
        zones.delete(
            zones.findByIdAndCollectionId(zoneId, collectionId)
                ?: throw ApiException(HttpStatus.NOT_FOUND, "Zone nicht gefunden."),
        )
        touch(collection)
    }

    @Transactional
    fun createLabel(
        collectionId: String,
        userId: String,
        request: CreateFloatingLabelRequest,
    ): FloatingLabelDto {
        val collection = editableCollection(collectionId, userId)
        requireLabelBounds(request.x, request.y, request.widthClips)
        val label = labels.save(
            FloatingLabelEntity(
                id = id("label"),
                collection = collection,
                gridX = request.x,
                gridY = request.y,
                widthClips = request.widthClips,
                text = requiredText(request.text, 120),
                layer = request.layer.coerceAtLeast(0),
            ),
        )
        touch(collection)
        return toDto(label)
    }

    @Transactional
    fun updateLabel(
        collectionId: String,
        labelId: String,
        userId: String,
        request: UpdateFloatingLabelRequest,
    ): FloatingLabelDto {
        val collection = editableCollection(collectionId, userId)
        val label = labels.findByIdAndCollectionId(labelId, collectionId)
            ?: throw ApiException(HttpStatus.NOT_FOUND, "Annotation nicht gefunden.")
        val x = request.x ?: label.gridX
        val y = request.y ?: label.gridY
        val width = request.widthClips ?: label.widthClips
        requireLabelBounds(x, y, width)
        label.gridX = x
        label.gridY = y
        label.widthClips = width
        request.text?.let { label.text = requiredText(it, 120) }
        request.layer?.let { label.layer = it.coerceAtLeast(0) }
        touch(collection)
        return toDto(label)
    }

    @Transactional
    fun deleteLabel(collectionId: String, labelId: String, userId: String) {
        val collection = editableCollection(collectionId, userId)
        labels.delete(
            labels.findByIdAndCollectionId(labelId, collectionId)
                ?: throw ApiException(HttpStatus.NOT_FOUND, "Annotation nicht gefunden."),
        )
        touch(collection)
    }

    @Transactional
    fun createSticker(
        collectionId: String,
        userId: String,
        request: CreateStickerRequest,
    ): StickerElementDto {
        val collection = editableCollection(collectionId, userId)
        requireStickerGeometry(
            request.x,
            request.y,
            request.widthClips,
            request.heightClips,
            request.rotation,
        )
        val sticker = stickers.save(
            StickerEntity(
                id = id("sticker"),
                collection = collection,
                positionX = request.x,
                positionY = request.y,
                widthClips = request.widthClips,
                heightClips = request.heightClips,
                rotation = request.rotation,
                layer = request.layer.coerceAtLeast(0),
                motif = motif(request.motif),
                colorVariant = color(request.colorVariant),
            ),
        )
        touch(collection)
        return toDto(sticker)
    }

    @Transactional
    fun updateSticker(
        collectionId: String,
        stickerId: String,
        userId: String,
        request: UpdateStickerRequest,
    ): StickerElementDto {
        val collection = editableCollection(collectionId, userId)
        val sticker = stickers.findByIdAndCollectionId(stickerId, collectionId)
            ?: throw ApiException(HttpStatus.NOT_FOUND, "Sticker nicht gefunden.")
        val x = request.x ?: sticker.positionX
        val y = request.y ?: sticker.positionY
        val width = request.widthClips ?: sticker.widthClips
        val height = request.heightClips ?: sticker.heightClips
        val rotation = request.rotation ?: sticker.rotation
        requireStickerGeometry(x, y, width, height, rotation)
        sticker.positionX = x
        sticker.positionY = y
        sticker.widthClips = width
        sticker.heightClips = height
        sticker.rotation = rotation
        request.layer?.let { sticker.layer = it.coerceAtLeast(0) }
        request.motif?.let { sticker.motif = motif(it) }
        request.colorVariant?.let { sticker.colorVariant = color(it) }
        touch(collection)
        return toDto(sticker)
    }

    @Transactional
    fun deleteSticker(collectionId: String, stickerId: String, userId: String) {
        val collection = editableCollection(collectionId, userId)
        stickers.delete(
            stickers.findByIdAndCollectionId(stickerId, collectionId)
                ?: throw ApiException(HttpStatus.NOT_FOUND, "Sticker nicht gefunden."),
        )
        touch(collection)
    }

    private fun snapshot(collectionId: String) = BoardElementsDto(
        stacks = stacks.findAllByCollectionIdOrderByLayer(collectionId).map(::toDto),
        connectors = connectors.findAllByCollectionId(collectionId).map(::toDto),
        zones = zones.findAllByCollectionId(collectionId).map(::toDto),
        labels = labels.findAllByCollectionId(collectionId).map(::toDto),
        stickers = stickers.findAllByCollectionIdOrderByLayer(collectionId).map(::toDto),
    )

    private fun editableCollection(collectionId: String, userId: String): CollectionEntity =
        collections.get(collectionId).also { collections.requireEdit(it, userId) }

    private fun getPin(collectionId: String, pinId: String): PinEntity =
        pins.findDetailed(collectionId, pinId)
            ?: throw ApiException(HttpStatus.NOT_FOUND, "Pin nicht gefunden.")

    private fun getStack(collectionId: String, stackId: String): PinStackEntity =
        stacks.findDetailed(collectionId, stackId)
            ?: throw ApiException(HttpStatus.NOT_FOUND, "Stack nicht gefunden.")

    private fun requireSolo(pinId: String) {
        if (stackChildren.existsByPinId(pinId)) {
            throw ApiException(HttpStatus.CONFLICT, "Die Karte gehört bereits zu einem Stack.")
        }
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

    private fun requireStackPositionAllowed(
        collectionId: String,
        stackId: String,
        x: Int,
        y: Int,
        height: Int,
    ) {
        requireGridBounds(x, y, height, CARD_WIDTH_CLIPS)
        val candidate = Rect(x, y, CARD_WIDTH_CLIPS, height)
        val stackedIds = stacks.findAllByCollectionIdOrderByLayer(collectionId)
            .flatMap { it.children }
            .mapNotNull { it.pin?.id }
            .toSet()
        val invalidPin = pins.findAllByCollectionIdOrderBySortOrder(collectionId)
            .asSequence()
            .filter { it.id !in stackedIds }
            .map { Rect(it.gridX, it.gridY, CARD_WIDTH_CLIPS, it.heightClips) }
            .any { !overlapAllowed(candidate, it) }
        val invalidStack = stacks.findAllByCollectionIdOrderByLayer(collectionId)
            .asSequence()
            .filter { it.id != stackId }
            .map { Rect(it.gridX, it.gridY, CARD_WIDTH_CLIPS, it.heightClips) }
            .any { !overlapAllowed(candidate, it) }
        if (invalidPin || invalidStack) overlapError()
    }

    private fun requireNewStackPositionAllowed(
        collectionId: String,
        x: Int,
        y: Int,
        height: Int,
        childIds: Set<String>,
    ) {
        requireGridBounds(x, y, height, CARD_WIDTH_CLIPS)
        val candidate = Rect(x, y, CARD_WIDTH_CLIPS, height)
        val existingStacks = stacks.findAllByCollectionIdOrderByLayer(collectionId)
        val stackedIds = existingStacks.flatMap { it.children }.mapNotNull { it.pin?.id }.toSet()
        val invalidPin = pins.findAllByCollectionIdOrderBySortOrder(collectionId)
            .asSequence()
            .filter { it.id !in childIds && it.id !in stackedIds }
            .map { Rect(it.gridX, it.gridY, CARD_WIDTH_CLIPS, it.heightClips) }
            .any { !overlapAllowed(candidate, it) }
        val invalidStack = existingStacks
            .asSequence()
            .map { Rect(it.gridX, it.gridY, CARD_WIDTH_CLIPS, it.heightClips) }
            .any { !overlapAllowed(candidate, it) }
        if (invalidPin || invalidStack) overlapError()
    }

    private fun requirePinPositionAllowed(
        collectionId: String,
        pinId: String,
        sourceStackId: String,
        x: Int,
        y: Int,
        height: Int,
    ) {
        val candidate = Rect(x, y, CARD_WIDTH_CLIPS, height)
        val allStacks = stacks.findAllByCollectionIdOrderByLayer(collectionId)
        val stackedIds = allStacks.flatMap { it.children }.mapNotNull { it.pin?.id }.toSet()
        val invalidPin = pins.findAllByCollectionIdOrderBySortOrder(collectionId)
            .asSequence()
            .filter { it.id != pinId && it.id !in stackedIds }
            .map { Rect(it.gridX, it.gridY, CARD_WIDTH_CLIPS, it.heightClips) }
            .any { !overlapAllowed(candidate, it) }
        val invalidStack = allStacks
            .asSequence()
            .filter { it.id != sourceStackId }
            .map { Rect(it.gridX, it.gridY, CARD_WIDTH_CLIPS, it.heightClips) }
            .any { !overlapAllowed(candidate, it) }
        if (invalidPin || invalidStack) overlapError()
    }

    private fun requireGridBounds(x: Int, y: Int, height: Int, width: Int) {
        if (height !in 1..BOARD_HEIGHT_CLIPS || x !in 0..(BOARD_WIDTH_CLIPS - width) ||
            y !in 0..(BOARD_HEIGHT_CLIPS - height)
        ) {
            badRequest("Das Element liegt ausserhalb des Boards.")
        }
    }

    private fun requireZoneBounds(x: Int, y: Int, width: Int, height: Int) {
        if (width < 2 || height < 2 || x < 0 || y < 0 || x + width > BOARD_WIDTH_CLIPS ||
            y + height > BOARD_HEIGHT_CLIPS
        ) {
            badRequest("Ungültige Zonengrösse oder -position.")
        }
    }

    private fun requireLabelBounds(x: Int, y: Int, width: Int) {
        if (width !in 2..6 || x < 0 || y < 0 || x + width > BOARD_WIDTH_CLIPS || y >= BOARD_HEIGHT_CLIPS) {
            badRequest("Ungültige Annotation.")
        }
    }

    private fun requireStickerGeometry(x: Double, y: Double, width: Double, height: Double, rotation: Double) {
        val boardWidth = BOARD_WIDTH_CLIPS * CLIP_SIZE_PX
        val boardHeight = BOARD_HEIGHT_CLIPS * CLIP_SIZE_PX
        if (!x.isFinite() || !y.isFinite() || !width.isFinite() || !height.isFinite() || !rotation.isFinite() ||
            width !in 2.0..8.0 || height !in 2.0..8.0 || rotation !in -15.0..15.0 ||
            x < 0 || y < 0 || x + width * CLIP_SIZE_PX > boardWidth ||
            y + height * CLIP_SIZE_PX > boardHeight
        ) {
            badRequest("Ungültige Sticker-Geometrie.")
        }
    }

    private fun color(value: String): String = value.takeIf(COLORS::contains)
        ?: badRequest("Unbekannte Farbvariante.")

    private fun motif(value: String): String = value.takeIf(STICKER_MOTIFS::contains)
        ?: badRequest("Unbekanntes Sticker-Motiv.")

    private fun requiredText(value: String, maxLength: Int): String = value.trim().also {
        if (it.isBlank() || it.length > maxLength) badRequest("Text fehlt oder ist zu lang.")
    }

    private fun cleanOptionalText(value: String?, maxLength: Int): String? = value?.trim()?.takeIf(String::isNotBlank)?.also {
        if (it.length > maxLength) badRequest("Text ist zu lang.")
    }

    private fun maxLayer(collectionId: String): Int = maxOf(
        pins.findAllByCollectionIdOrderBySortOrder(collectionId).maxOfOrNull(PinEntity::layer) ?: 0,
        stacks.findAllByCollectionIdOrderByLayer(collectionId).maxOfOrNull(PinStackEntity::layer) ?: 0,
        labels.findAllByCollectionId(collectionId).maxOfOrNull(FloatingLabelEntity::layer) ?: 0,
        stickers.findAllByCollectionIdOrderByLayer(collectionId).maxOfOrNull(StickerEntity::layer) ?: 0,
    )

    private data class Rect(val x: Int, val y: Int, val width: Int, val height: Int)

    private fun overlapAllowed(a: Rect, b: Rect): Boolean {
        val width = (minOf(a.x + a.width, b.x + b.width) - maxOf(a.x, b.x)).coerceAtLeast(0)
        val height = (minOf(a.y + a.height, b.y + b.height) - maxOf(a.y, b.y)).coerceAtLeast(0)
        return width * height * 2 <= minOf(a.width * a.height, b.width * b.height)
    }

    private fun overlapError(): Nothing =
        throw ApiException(HttpStatus.CONFLICT, "Karten dürfen sich höchstens zur Hälfte überlagern.")

    private fun badRequest(message: String): Nothing = throw ApiException(HttpStatus.BAD_REQUEST, message)

    private fun id(prefix: String) = "$prefix-${UUID.randomUUID().toString().take(8)}"

    private fun touch(collection: CollectionEntity) {
        collection.updatedAt = Instant.now()
    }

    private fun toDto(stack: PinStackEntity) = StackBlockDto(
        id = stack.id,
        x = stack.gridX,
        y = stack.gridY,
        heightClips = stack.heightClips,
        layer = stack.layer,
        children = stack.children.mapNotNull { it.pin?.id },
        expanded = stack.expanded,
    )

    private fun toDto(connector: BoardConnectorEntity) = ConnectorThreadDto(
        id = connector.id,
        sourcePinId = connector.sourcePin?.id.orEmpty(),
        targetPinId = connector.targetPin?.id.orEmpty(),
        colorVariant = connector.colorVariant,
    )

    private fun toDto(zone: SoftZoneEntity) = SoftZoneDto(
        id = zone.id,
        x = zone.gridX,
        y = zone.gridY,
        widthClips = zone.widthClips,
        heightClips = zone.heightClips,
        colorVariant = zone.colorVariant,
        label = zone.label,
    )

    private fun toDto(label: FloatingLabelEntity) = FloatingLabelDto(
        id = label.id,
        x = label.gridX,
        y = label.gridY,
        widthClips = label.widthClips,
        text = label.text,
        layer = label.layer,
    )

    private fun toDto(sticker: StickerEntity) = StickerElementDto(
        id = sticker.id,
        motif = sticker.motif,
        colorVariant = sticker.colorVariant,
        x = sticker.positionX,
        y = sticker.positionY,
        widthClips = sticker.widthClips,
        heightClips = sticker.heightClips,
        rotation = sticker.rotation,
        layer = sticker.layer,
    )
}
