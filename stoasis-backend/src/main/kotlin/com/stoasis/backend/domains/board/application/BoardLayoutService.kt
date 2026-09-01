package com.stoasis.backend.domains.board.application

import com.stoasis.backend.domains.board.data.BoardConnectorRepository
import com.stoasis.backend.domains.board.data.PinStackChildRepository
import com.stoasis.backend.domains.collection.application.CollectionService
import com.stoasis.backend.domains.pin.api.PinDto
import com.stoasis.backend.domains.pin.application.PinService
import com.stoasis.backend.domains.pin.application.PinService.Companion.BOARD_HEIGHT_CLIPS
import com.stoasis.backend.domains.pin.application.PinService.Companion.BOARD_WIDTH_CLIPS
import com.stoasis.backend.domains.pin.application.PinService.Companion.CARD_WIDTH_CLIPS
import com.stoasis.backend.domains.pin.data.PinEntity
import com.stoasis.backend.domains.pin.data.PinRepository
import com.stoasis.backend.shared.web.ApiException
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

enum class BoardLayoutType { MINDMAP, TREE, GRID }

@Service
class BoardLayoutService(
    private val collections: CollectionService,
    private val pins: PinRepository,
    private val connectors: BoardConnectorRepository,
    private val stackChildren: PinStackChildRepository,
    private val pinService: PinService,
) {
    @Transactional
    fun layout(
        collectionId: String,
        userId: String,
        type: BoardLayoutType,
        rootPinId: String? = null,
    ): List<PinDto> {
        val collection = collections.get(collectionId)
        collections.requireEdit(collection, userId)
        val boardPins = pins.findAllByCollectionIdOrderBySortOrder(collectionId)
        if (boardPins.isEmpty()) return emptyList()

        val placements = when (type) {
            BoardLayoutType.GRID -> grid(boardPins)
            BoardLayoutType.TREE -> tree(boardPins, adjacency(collectionId), requiredRoot(boardPins, rootPinId))
            BoardLayoutType.MINDMAP -> mindmap(boardPins, adjacency(collectionId), requiredRoot(boardPins, rootPinId))
        }
        placements.forEach { placement ->
            if (stackChildren.existsByPinId(placement.pin.id)) {
                throw ApiException(HttpStatus.CONFLICT, "Karten in einem Stack können nicht automatisch angeordnet werden.")
            }
            placement.pin.gridX = placement.x
            placement.pin.gridY = placement.y
        }
        pins.saveAll(placements.map(Placement::pin))
        return placements.map { pinService.toDto(it.pin) }
    }

    private fun requiredRoot(boardPins: List<PinEntity>, rootPinId: String?): PinEntity {
        if (rootPinId == null) throw ApiException(HttpStatus.BAD_REQUEST, "Für dieses Layout fehlt der Start-Pin.")
        return boardPins.firstOrNull { it.id == rootPinId }
            ?: throw ApiException(HttpStatus.NOT_FOUND, "Start-Pin nicht gefunden.")
    }

    private fun adjacency(collectionId: String): Map<String, List<String>> {
        val graph = linkedMapOf<String, MutableList<String>>()
        connectors.findAllByCollectionId(collectionId).forEach { connector ->
            val source = connector.sourcePin?.id ?: return@forEach
            val target = connector.targetPin?.id ?: return@forEach
            graph.getOrPut(source, ::mutableListOf).add(target)
            graph.getOrPut(target, ::mutableListOf).add(source)
        }
        return graph.mapValues { (_, ids) -> ids.distinct().sorted() }
    }

    private fun grid(boardPins: List<PinEntity>): List<Placement> {
        val result = mutableListOf<Placement>()
        var x = 0
        var y = 0
        var rowHeight = 0
        boardPins.forEach { pin ->
            if (x + CARD_WIDTH_CLIPS > BOARD_WIDTH_CLIPS) {
                x = 0
                y += rowHeight + GAP
                rowHeight = 0
            }
            requireFits(x, y, pin.heightClips)
            result += Placement(pin, x, y)
            rowHeight = maxOf(rowHeight, pin.heightClips)
            x += CARD_WIDTH_CLIPS + GAP
        }
        return result
    }

    private fun tree(
        boardPins: List<PinEntity>,
        adjacency: Map<String, List<String>>,
        root: PinEntity,
    ): List<Placement> {
        val byId = boardPins.associateBy(PinEntity::id)
        val levels = breadthFirstLevels(root.id, adjacency)
        val result = mutableListOf<Placement>()
        var y = 0
        levels.forEach { level ->
            val levelPins = level.mapNotNull(byId::get)
            val totalWidth = levelPins.size * CARD_WIDTH_CLIPS + (levelPins.size - 1).coerceAtLeast(0) * GAP
            if (totalWidth > BOARD_WIDTH_CLIPS) outOfBounds()
            var x = (BOARD_WIDTH_CLIPS - totalWidth) / 2
            val rowHeight = levelPins.maxOfOrNull(PinEntity::heightClips) ?: 0
            levelPins.forEach { pin ->
                requireFits(x, y, pin.heightClips)
                result += Placement(pin, x, y)
                x += CARD_WIDTH_CLIPS + GAP
            }
            y += rowHeight + TREE_GAP
        }
        return result
    }

    private fun mindmap(
        boardPins: List<PinEntity>,
        adjacency: Map<String, List<String>>,
        root: PinEntity,
    ): List<Placement> {
        val byId = boardPins.associateBy(PinEntity::id)
        val levels = breadthFirstLevels(root.id, adjacency)
        val rootX = (BOARD_WIDTH_CLIPS - CARD_WIDTH_CLIPS) / 2
        val rootY = (BOARD_HEIGHT_CLIPS - root.heightClips) / 2
        val result = mutableListOf(Placement(root, rootX, rootY))

        levels.drop(1).forEachIndexed { depthIndex, level ->
            val distance = (depthIndex + 1) * (CARD_WIDTH_CLIPS + GAP)
            val levelPins = level.mapNotNull(byId::get)
            val right = levelPins.filterIndexed { index, _ -> index % 2 == 0 }
            val left = levelPins.filterIndexed { index, _ -> index % 2 == 1 }
            result += verticalColumn(right, rootX + distance)
            result += verticalColumn(left, rootX - distance)
        }
        return result
    }

    private fun verticalColumn(columnPins: List<PinEntity>, x: Int): List<Placement> {
        if (columnPins.isEmpty()) return emptyList()
        val totalHeight = columnPins.sumOf(PinEntity::heightClips) + (columnPins.size - 1) * GAP
        if (totalHeight > BOARD_HEIGHT_CLIPS) outOfBounds()
        var y = (BOARD_HEIGHT_CLIPS - totalHeight) / 2
        return columnPins.map { pin ->
            requireFits(x, y, pin.heightClips)
            Placement(pin, x, y).also { y += pin.heightClips + GAP }
        }
    }

    private fun breadthFirstLevels(rootId: String, adjacency: Map<String, List<String>>): List<List<String>> {
        val seen = linkedSetOf(rootId)
        var frontier = listOf(rootId)
        val levels = mutableListOf<List<String>>()
        var depth = 0
        while (frontier.isNotEmpty()) {
            if (depth > MAX_GRAPH_DEPTH) {
                throw ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "Die maximale Graph-Tiefe wurde überschritten.")
            }
            levels += frontier
            frontier = frontier.flatMap { adjacency[it].orEmpty() }
                .filter(seen::add)
                .sorted()
            depth += 1
        }
        return levels
    }

    private fun requireFits(x: Int, y: Int, height: Int) {
        if (x < 0 || y < 0 || x + CARD_WIDTH_CLIPS > BOARD_WIDTH_CLIPS || y + height > BOARD_HEIGHT_CLIPS) {
            outOfBounds()
        }
    }

    private fun outOfBounds(): Nothing = throw ApiException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        "Das Layout passt nicht vollständig auf das Board.",
    )

    private data class Placement(val pin: PinEntity, val x: Int, val y: Int)

    companion object {
        private const val GAP = 4
        private const val TREE_GAP = 8
        private const val MAX_GRAPH_DEPTH = 10
    }
}
