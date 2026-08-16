package com.stoasis.backend.domains.board.application

import com.stoasis.backend.domains.board.api.BoardElementsDto
import com.stoasis.backend.domains.board.data.BoardConnectorRepository
import com.stoasis.backend.domains.board.data.FloatingLabelRepository
import com.stoasis.backend.domains.board.data.PinStackRepository
import com.stoasis.backend.domains.board.data.SoftZoneRepository
import com.stoasis.backend.domains.board.data.StickerRepository
import com.stoasis.backend.domains.board.utils.toDto
import com.stoasis.backend.domains.collection.application.CollectionService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class BoardElementQueryService(
    private val collections: CollectionService,
    private val stacks: PinStackRepository,
    private val connectors: BoardConnectorRepository,
    private val zones: SoftZoneRepository,
    private val labels: FloatingLabelRepository,
    private val stickers: StickerRepository,
) {
    @Transactional(readOnly = true)
    fun list(collectionId: String, userId: String): BoardElementsDto {
        val collection = collections.get(collectionId)
        collections.requireView(collection, userId)
        return snapshot(collectionId)
    }

    fun snapshot(collectionId: String) = BoardElementsDto(
        stacks = stacks.findAllByCollectionIdOrderByLayer(collectionId).map { it.toDto() },
        connectors = connectors.findAllByCollectionId(collectionId).map { it.toDto() },
        zones = zones.findAllByCollectionId(collectionId).map { it.toDto() },
        labels = labels.findAllByCollectionId(collectionId).map { it.toDto() },
        stickers = stickers.findAllByCollectionIdOrderByLayer(collectionId).map { it.toDto() },
    )
}
