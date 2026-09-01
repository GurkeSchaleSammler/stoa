package com.stoasis.backend.domains.board.application

import com.stoasis.backend.domains.board.api.ConnectorThreadDto
import com.stoasis.backend.domains.board.api.CreateConnectorRequest
import com.stoasis.backend.domains.board.api.UpdateConnectorRequest
import com.stoasis.backend.domains.board.data.BoardConnectorEntity
import com.stoasis.backend.domains.board.data.BoardConnectorRepository
import com.stoasis.backend.domains.board.utils.badRequest
import com.stoasis.backend.domains.board.utils.boardElementId
import com.stoasis.backend.domains.board.utils.toDto
import com.stoasis.backend.domains.board.utils.touchCollection
import com.stoasis.backend.domains.board.utils.validBoardColor
import com.stoasis.backend.shared.web.ApiException
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class BoardConnectorService(
    private val support: BoardElementSupport,
    private val connectors: BoardConnectorRepository,
) {
    @Transactional
    fun createConnector(
        collectionId: String,
        userId: String,
        request: CreateConnectorRequest,
    ): ConnectorThreadDto {
        val collection = support.editableCollection(collectionId, userId)
        if (request.sourcePinId == request.targetPinId) badRequest("Eine Verbindung braucht zwei Karten.")
        val source = support.getPin(collectionId, request.sourcePinId)
        val target = support.getPin(collectionId, request.targetPinId)
        val duplicate = connectors.existsByCollectionIdAndSourcePinIdAndTargetPinId(
            collectionId,
            source.id,
            target.id,
        ) || connectors.existsByCollectionIdAndSourcePinIdAndTargetPinId(collectionId, target.id, source.id)
        if (duplicate) throw ApiException(HttpStatus.CONFLICT, "Diese Karten sind bereits verbunden.")
        val connector = connectors.save(
            BoardConnectorEntity(
                id = boardElementId("thread"),
                collection = collection,
                sourcePin = source,
                targetPin = target,
                colorVariant = validBoardColor(request.colorVariant),
            ),
        )
        touchCollection(collection)
        return connector.toDto()
    }

    @Transactional
    fun updateConnector(
        collectionId: String,
        connectorId: String,
        userId: String,
        request: UpdateConnectorRequest,
    ): ConnectorThreadDto {
        val collection = support.editableCollection(collectionId, userId)
        val connector = connectors.findByIdAndCollectionId(connectorId, collectionId)
            ?: throw ApiException(HttpStatus.NOT_FOUND, "Verbindung nicht gefunden.")
        connector.colorVariant = validBoardColor(request.colorVariant)
        touchCollection(collection)
        return connector.toDto()
    }

    @Transactional
    fun deleteConnector(collectionId: String, connectorId: String, userId: String) {
        val collection = support.editableCollection(collectionId, userId)
        val connector = connectors.findByIdAndCollectionId(connectorId, collectionId)
            ?: throw ApiException(HttpStatus.NOT_FOUND, "Verbindung nicht gefunden.")
        connectors.delete(connector)
        touchCollection(collection)
    }

    @Transactional
    fun disconnectPins(collectionId: String, sourcePinId: String, targetPinId: String, userId: String): String {
        val collection = support.editableCollection(collectionId, userId)
        val connector = connectors.findByCollectionIdAndSourcePinIdAndTargetPinId(
            collectionId,
            sourcePinId,
            targetPinId,
        ) ?: connectors.findByCollectionIdAndSourcePinIdAndTargetPinId(
            collectionId,
            targetPinId,
            sourcePinId,
        ) ?: throw ApiException(HttpStatus.NOT_FOUND, "Verbindung nicht gefunden.")
        connectors.delete(connector)
        touchCollection(collection)
        return connector.id
    }
}
