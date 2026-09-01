package com.stoasis.backend.domains.stoaql.application

import com.stoasis.backend.domains.board.api.CreateConnectorRequest
import com.stoasis.backend.domains.board.application.BoardConnectorService
import com.stoasis.backend.domains.board.application.BoardElementQueryService
import com.stoasis.backend.domains.board.application.BoardLayoutService
import com.stoasis.backend.domains.board.application.BoardLayoutType
import com.stoasis.backend.domains.board.data.BoardConnectorRepository
import com.stoasis.backend.domains.collection.application.CollectionService
import com.stoasis.backend.domains.collection.model.PinType
import com.stoasis.backend.domains.pin.api.CreatePinRequest
import com.stoasis.backend.domains.pin.api.UpdateGridBlockRequest
import com.stoasis.backend.domains.pin.api.UpdatePinRequest
import com.stoasis.backend.domains.pin.application.PinService
import com.stoasis.backend.domains.pin.data.PinRepository
import com.stoasis.backend.domains.search.application.SearchService
import com.stoasis.backend.domains.stoaql.api.StoaQlException
import com.stoasis.backend.domains.stoaql.api.StoaQlOperation
import com.stoasis.backend.domains.stoaql.api.StoaQlQueryRequest
import com.stoasis.backend.domains.stoaql.api.StoaQlQueryResponse
import com.stoasis.backend.domains.stoaql.api.StoaQlResult
import com.stoasis.backend.domains.stoaql.data.StoaQlQueryRequestEntity
import com.stoasis.backend.domains.stoaql.data.StoaQlQueryRequestRepository
import com.stoasis.backend.domains.stoaql.language.AddStatement
import com.stoasis.backend.domains.stoaql.language.ConnectStatement
import com.stoasis.backend.domains.stoaql.language.DeleteStatement
import com.stoasis.backend.domains.stoaql.language.DisconnectStatement
import com.stoasis.backend.domains.stoaql.language.FindConnectedStatement
import com.stoasis.backend.domains.stoaql.language.FindTagStatement
import com.stoasis.backend.domains.stoaql.language.FindTextStatement
import com.stoasis.backend.domains.stoaql.language.GetBoardStatement
import com.stoasis.backend.domains.stoaql.language.GetPinStatement
import com.stoasis.backend.domains.stoaql.language.LayoutStatement
import com.stoasis.backend.domains.stoaql.language.LayoutType
import com.stoasis.backend.domains.stoaql.language.LinkStatement
import com.stoasis.backend.domains.stoaql.language.MoveStatement
import com.stoasis.backend.domains.stoaql.language.PinReference
import com.stoasis.backend.domains.stoaql.language.StoaQlLanguageException
import com.stoasis.backend.domains.stoaql.language.StoaQlParser
import com.stoasis.backend.domains.stoaql.language.StoaQlStatement
import com.stoasis.backend.domains.stoaql.language.UpdateField
import com.stoasis.backend.domains.stoaql.language.UpdateStatement
import com.stoasis.backend.domains.stoaql.language.UseStatement
import com.stoasis.backend.shared.web.ApiException
import java.net.URI
import java.security.MessageDigest
import java.time.Instant
import java.util.UUID
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.transaction.interceptor.TransactionAspectSupport
import tools.jackson.databind.ObjectMapper

@Service
class StoaQlQueryService(
    private val collections: CollectionService,
    private val pins: PinService,
    private val pinRepository: PinRepository,
    private val boardElements: BoardElementQueryService,
    private val connectorService: BoardConnectorService,
    private val connectorRepository: BoardConnectorRepository,
    private val layouts: BoardLayoutService,
    private val search: SearchService,
    private val idempotency: StoaQlQueryRequestRepository,
    private val objectMapper: ObjectMapper,
) {
    @Transactional(timeout = 5)
    fun execute(userId: String, request: StoaQlQueryRequest): StoaQlQueryResponse {
        validateRequest(request)
        val requestHash = request.idempotencyKey?.takeUnless { request.dryRun }?.let {
            requestFingerprint(request)
        }
        if (requestHash != null) {
            idempotency.findByUserIdAndIdempotencyKey(userId, request.idempotencyKey)?.let { stored ->
                if (stored.requestHash != requestHash) throw StoaQlException(
                    HttpStatus.CONFLICT,
                    "STOAQL_IDEMPOTENCY_CONFLICT",
                    "Der Idempotency-Key wurde bereits für eine andere Query verwendet.",
                    1,
                )
                return objectMapper.readValue(stored.responseJson, StoaQlQueryResponse::class.java)
            }
        }
        val started = System.nanoTime()
        val statements = try {
            StoaQlParser.parse(request.query)
        } catch (exception: StoaQlLanguageException) {
            throw StoaQlException(
                status = HttpStatus.BAD_REQUEST,
                code = exception.code,
                message = exception.message,
                column = exception.column,
                hint = exception.hint,
            )
        }

        val state = ExecutionState(
            currentBoardId = request.context?.collectionId?.let { reference ->
                translateDomainError(Source(statementColumn = 1, statementIndex = null)) {
                    collections.resolve(reference, userId).id
                }
            },
        )
        statements.forEachIndexed { index, statement ->
            try {
                executeStatement(userId, index, statement, state)
            } catch (exception: StoaQlException) {
                throw exception
            } catch (exception: ApiException) {
                throw domainException(exception, statement, index)
            }
        }
        if (request.dryRun) TransactionAspectSupport.currentTransactionStatus().setRollbackOnly()
        val response = StoaQlQueryResponse(
            queryId = "qry-${UUID.randomUUID().toString().take(8)}",
            languageVersion = request.languageVersion,
            dryRun = request.dryRun,
            operations = state.operations,
            results = state.results,
            aliases = state.aliases.toMap(),
            warnings = state.warnings,
            durationMs = (System.nanoTime() - started) / 1_000_000,
        )
        if (requestHash != null) {
            idempotency.save(
                StoaQlQueryRequestEntity(
                    id = "qryreq-${UUID.randomUUID().toString().take(12)}",
                    userId = userId,
                    idempotencyKey = request.idempotencyKey,
                    requestHash = requestHash,
                    responseJson = objectMapper.writeValueAsString(response),
                    createdAt = Instant.now(),
                ),
            )
        }
        return response
    }

    private fun executeStatement(
        userId: String,
        index: Int,
        statement: StoaQlStatement,
        state: ExecutionState,
    ) {
        when (statement) {
            is UseStatement -> {
                val board = collections.resolve(statement.board, userId)
                state.currentBoardId = board.id
                state.results += StoaQlResult(index, "BOARD_SELECTED", mapOf("id" to board.id, "name" to board.name))
            }
            is AddStatement -> {
                ensureAliasAvailable(statement.alias, statement, index, state)
                val boardId = resolveTargetBoard(statement.board, userId, statement, index, state)
                val data = objectMapper.createObjectNode().apply {
                    put("title", statement.title)
                    put("content", statement.text.orEmpty())
                    put("color", "white")
                }
                val pin = pins.create(boardId, userId, CreatePinRequest(PinType.note, data, tags = statement.tags.toSet()))
                bindAlias(statement.alias, pin.id, state)
                state.operations += StoaQlOperation(index, "PIN_CREATED", pin.id, pin)
            }
            is LinkStatement -> {
                ensureAliasAvailable(statement.alias, statement, index, state)
                val boardId = resolveTargetBoard(statement.board, userId, statement, index, state)
                val url = validUrl(statement.url, statement, index)
                val data = objectMapper.createObjectNode().apply {
                    put("url", url)
                    put("title", statement.title ?: url)
                    put("parseStatus", "pending")
                }
                val pin = pins.create(boardId, userId, CreatePinRequest(PinType.link, data, tags = statement.tags.toSet()))
                bindAlias(statement.alias, pin.id, state)
                state.operations += StoaQlOperation(index, "PIN_CREATED", pin.id, pin)
            }
            is ConnectStatement -> {
                val source = resolvePin(statement.source, userId, index, state)
                val target = resolvePin(statement.target, userId, index, state)
                requireSameBoard(source, target, statement, index)
                val connector = connectorService.createConnector(
                    source.collectionId,
                    userId,
                    CreateConnectorRequest(source.id, target.id),
                )
                state.operations += StoaQlOperation(index, "CONNECTION_CREATED", connector.id, connector)
            }
            is DisconnectStatement -> {
                val source = resolvePin(statement.source, userId, index, state)
                val target = resolvePin(statement.target, userId, index, state)
                requireSameBoard(source, target, statement, index)
                val id = connectorService.disconnectPins(source.collectionId, source.id, target.id, userId)
                state.operations += StoaQlOperation(index, "CONNECTION_DELETED", id)
            }
            is FindTextStatement -> {
                val boardId = statement.board?.let { collections.resolve(it, userId).id }
                val found = search.search(userId, statement.text, null, null, boardId)
                state.results += limitedResult(index, "PINS_FOUND", found, state)
            }
            is FindTagStatement -> {
                val found = search.findByTag(userId, statement.tag)
                state.results += limitedResult(index, "PINS_FOUND", found, state)
            }
            is FindConnectedStatement -> {
                if (statement.depth !in 1..10) semanticError(
                    "STOAQL_INVALID_PROPERTY",
                    "DEPTH muss zwischen 1 und 10 liegen.",
                    statement,
                    index,
                )
                val root = resolvePin(statement.reference, userId, index, state)
                val ids = connectedIds(root.collectionId, root.id, statement.depth)
                val found = ids.map { pins.detail(root.collectionId, it, userId) }
                state.results += limitedResult(index, "CONNECTED_PINS_FOUND", found, state)
            }
            is GetPinStatement -> {
                val pin = resolvePin(statement.reference, userId, index, state)
                state.results += StoaQlResult(index, "PIN", pins.detail(pin.collectionId, pin.id, userId))
            }
            is GetBoardStatement -> {
                val boardId = statement.board?.let { collections.resolve(it, userId).id }
                    ?: currentBoard(statement, index, state)
                state.results += StoaQlResult(
                    index,
                    "BOARD",
                    mapOf(
                        "board" to collections.detail(boardId, userId),
                        "pins" to pins.list(boardId, userId),
                        "elements" to boardElements.list(boardId, userId),
                    ),
                )
            }
            is UpdateStatement -> update(userId, index, statement, state)
            is DeleteStatement -> {
                val pin = resolvePin(statement.reference, userId, index, state)
                pins.delete(pin.collectionId, pin.id, userId)
                state.operations += StoaQlOperation(index, "PIN_DELETED", pin.id)
            }
            is MoveStatement -> {
                val pin = resolvePin(statement.reference, userId, index, state)
                val current = pins.detail(pin.collectionId, pin.id, userId)
                val updated = pins.update(
                    pin.collectionId,
                    pin.id,
                    userId,
                    UpdatePinRequest(
                        grid = UpdateGridBlockRequest(
                            x = statement.x,
                            y = statement.y,
                            heightClips = current.grid.heightClips,
                            layer = current.grid.layer,
                        ),
                    ),
                )
                state.operations += StoaQlOperation(index, "PIN_MOVED", pin.id, updated.grid)
            }
            is LayoutStatement -> {
                val root = statement.root?.let { resolvePin(it, userId, index, state) }
                val boardId = root?.collectionId ?: currentBoard(statement, index, state)
                val moved = layouts.layout(
                    boardId,
                    userId,
                    when (statement.type) {
                        LayoutType.MINDMAP -> BoardLayoutType.MINDMAP
                        LayoutType.TREE -> BoardLayoutType.TREE
                        LayoutType.GRID -> BoardLayoutType.GRID
                    },
                    root?.id,
                )
                state.operations += StoaQlOperation(
                    index,
                    "BOARD_LAYOUT_APPLIED",
                    boardId,
                    mapOf("layout" to statement.type.name, "pins" to moved.map { it.id }),
                )
            }
        }
    }

    private fun update(userId: String, index: Int, statement: UpdateStatement, state: ExecutionState) {
        val resolved = resolvePin(statement.reference, userId, index, state)
        val current = pins.detail(resolved.collectionId, resolved.id, userId)
        val request = when (statement.field) {
            UpdateField.TAGS -> UpdatePinRequest(tags = statement.tags.toSet())
            UpdateField.TITLE -> {
                if (current.type !in setOf(PinType.note, PinType.link)) invalidProperty(statement, index)
                UpdatePinRequest(data = objectMapper.createObjectNode().apply { put("title", statement.text.orEmpty()) })
            }
            UpdateField.TEXT -> {
                val field = when (current.type) {
                    PinType.note -> "content"
                    PinType.link -> "description"
                    else -> invalidProperty(statement, index)
                }
                UpdatePinRequest(data = objectMapper.createObjectNode().apply { put(field, statement.text.orEmpty()) })
            }
        }
        val updated = pins.update(resolved.collectionId, resolved.id, userId, request)
        state.operations += StoaQlOperation(index, "PIN_UPDATED", resolved.id, updated)
    }

    private fun connectedIds(collectionId: String, rootId: String, depth: Int): List<String> {
        val graph = linkedMapOf<String, MutableSet<String>>()
        connectorRepository.findAllByCollectionId(collectionId).forEach { connector ->
            val source = connector.sourcePin?.id ?: return@forEach
            val target = connector.targetPin?.id ?: return@forEach
            graph.getOrPut(source, ::linkedSetOf).add(target)
            graph.getOrPut(target, ::linkedSetOf).add(source)
        }
        val seen = linkedSetOf(rootId)
        var frontier = listOf(rootId)
        repeat(depth) {
            frontier = frontier.flatMap { graph[it].orEmpty() }.filter(seen::add).sorted()
        }
        return seen.filter { it != rootId }
    }

    private fun resolveTargetBoard(
        explicit: String?,
        userId: String,
        statement: StoaQlStatement,
        index: Int,
        state: ExecutionState,
    ): String = explicit?.let { collections.resolve(it, userId).id } ?: currentBoard(statement, index, state)

    private fun currentBoard(statement: StoaQlStatement, index: Int, state: ExecutionState): String =
        state.currentBoardId ?: semanticError(
            "STOAQL_BOARD_NOT_SELECTED",
            "Kein Board ausgewählt.",
            statement,
            index,
            "Öffne die Console in einem Board, verwende USE oder ergänze TO.",
        )

    private fun resolvePin(reference: PinReference, userId: String, index: Int, state: ExecutionState): ResolvedPin {
        val pinId = if (reference.isAlias) {
            state.aliases[reference.value] ?: throw StoaQlException(
                HttpStatus.BAD_REQUEST,
                "STOAQL_UNKNOWN_ALIAS",
                "Alias '${reference.value}' ist nicht definiert.",
                reference.span.column,
                index,
                "Deklariere ihn vorher mit AS ${reference.value}.",
            )
        } else {
            reference.value
        }
        val entity = pinRepository.findById(pinId).orElseThrow {
            StoaQlException(
                HttpStatus.NOT_FOUND,
                "STOAQL_REFERENCE_NOT_FOUND",
                "Pin '$pinId' wurde nicht gefunden.",
                reference.span.column,
                index,
            )
        }
        val collection = entity.collection ?: semanticError(
            "STOAQL_REFERENCE_NOT_FOUND",
            "Der Pin besitzt kein Board.",
            Source(reference.span.column, index),
        )
        collections.requireView(collection, userId)
        return ResolvedPin(entity.id, collection.id)
    }

    private fun ensureAliasAvailable(
        alias: String?,
        statement: StoaQlStatement,
        index: Int,
        state: ExecutionState,
    ) {
        if (alias != null && alias in state.aliases) semanticError(
            "STOAQL_DUPLICATE_ALIAS",
            "Alias '$alias' wurde bereits definiert.",
            statement,
            index,
        )
    }

    private fun bindAlias(alias: String?, pinId: String, state: ExecutionState) {
        if (alias != null) state.aliases[alias] = pinId
    }

    private fun requireSameBoard(source: ResolvedPin, target: ResolvedPin, statement: StoaQlStatement, index: Int) {
        if (source.collectionId != target.collectionId) semanticError(
            "STOAQL_CONNECTION_CONFLICT",
            "Pins aus unterschiedlichen Boards können nicht verbunden werden.",
            statement,
            index,
        )
    }

    private fun validUrl(raw: String, statement: StoaQlStatement, index: Int): String = try {
        val uri = URI(raw.trim())
        if (uri.scheme?.lowercase() !in setOf("http", "https") || uri.host.isNullOrBlank()) throw IllegalArgumentException()
        uri.toString()
    } catch (_: Exception) {
        semanticError("STOAQL_INVALID_PROPERTY", "LINK erwartet eine gültige HTTP- oder HTTPS-URL.", statement, index)
    }

    private fun limitedResult(index: Int, type: String, values: List<*>, state: ExecutionState): StoaQlResult {
        if (values.size > MAX_RETURNED_ENTITIES) state.warnings += "Das Ergebnis wurde auf 1000 Einträge begrenzt."
        return StoaQlResult(index, type, values.take(MAX_RETURNED_ENTITIES))
    }

    private fun validateRequest(request: StoaQlQueryRequest) {
        if (request.languageVersion != "1.0") throw StoaQlException(
            HttpStatus.BAD_REQUEST,
            "STOAQL_UNSUPPORTED_VERSION",
            "StoaQL-Version '${request.languageVersion}' wird nicht unterstützt.",
            1,
            hint = "Unterstützt wird languageVersion 1.0.",
        )
        if (!request.atomic) throw StoaQlException(
            HttpStatus.BAD_REQUEST,
            "STOAQL_INVALID_PROPERTY",
            "StoaQL v1 unterstützt ausschließlich atomare Queries.",
            1,
        )
        if (request.`return` != "operations") throw StoaQlException(
            HttpStatus.BAD_REQUEST,
            "STOAQL_INVALID_PROPERTY",
            "Der Return-Modus '${request.`return`}' wird nicht unterstützt.",
            1,
        )
        if (request.idempotencyKey != null && (request.idempotencyKey.isBlank() || request.idempotencyKey.length > 128)) {
            throw StoaQlException(
                HttpStatus.BAD_REQUEST,
                "STOAQL_INVALID_PROPERTY",
                "Der Idempotency-Key muss zwischen 1 und 128 Zeichen lang sein.",
                1,
            )
        }
    }

    private fun requestFingerprint(request: StoaQlQueryRequest): String {
        val canonical = listOf(
            request.languageVersion,
            request.query,
            request.context?.collectionId.orEmpty(),
            request.dryRun.toString(),
            request.atomic.toString(),
            request.`return`,
        ).joinToString("\u0000")
        return MessageDigest.getInstance("SHA-256")
            .digest(canonical.toByteArray())
            .joinToString("") { byte -> (byte.toInt() and 0xff).toString(16).padStart(2, '0') }
    }

    private fun invalidProperty(statement: StoaQlStatement, index: Int): Nothing = semanticError(
        "STOAQL_INVALID_PROPERTY",
        "Diese Eigenschaft wird für den Pin-Typ nicht unterstützt.",
        statement,
        index,
    )

    private fun domainException(exception: ApiException, statement: StoaQlStatement, index: Int): StoaQlException {
        val code = when (exception.status) {
            HttpStatus.FORBIDDEN -> "STOAQL_PERMISSION_DENIED"
            HttpStatus.NOT_FOUND -> "STOAQL_REFERENCE_NOT_FOUND"
            HttpStatus.CONFLICT -> "STOAQL_CONNECTION_CONFLICT"
            HttpStatus.UNPROCESSABLE_ENTITY -> "STOAQL_OUT_OF_BOUNDS"
            else -> "STOAQL_DOMAIN_ERROR"
        }
        return StoaQlException(exception.status, code, exception.message, statement.span.column, index)
    }

    private fun <T> translateDomainError(source: Source, block: () -> T): T = try {
        block()
    } catch (exception: ApiException) {
        throw StoaQlException(
            exception.status,
            if (exception.status == HttpStatus.FORBIDDEN) "STOAQL_PERMISSION_DENIED" else "STOAQL_BOARD_NOT_FOUND",
            exception.message,
            source.statementColumn,
            source.statementIndex,
        )
    }

    private fun semanticError(
        code: String,
        message: String,
        statement: StoaQlStatement,
        index: Int,
        hint: String? = null,
    ): Nothing = throw StoaQlException(HttpStatus.BAD_REQUEST, code, message, statement.span.column, index, hint)

    private fun semanticError(code: String, message: String, source: Source): Nothing = throw StoaQlException(
        HttpStatus.BAD_REQUEST,
        code,
        message,
        source.statementColumn,
        source.statementIndex,
    )

    private data class ExecutionState(
        var currentBoardId: String?,
        val aliases: LinkedHashMap<String, String> = linkedMapOf(),
        val operations: MutableList<StoaQlOperation> = mutableListOf(),
        val results: MutableList<StoaQlResult> = mutableListOf(),
        val warnings: MutableList<String> = mutableListOf(),
    )
    private data class ResolvedPin(val id: String, val collectionId: String)
    private data class Source(val statementColumn: Int, val statementIndex: Int?)

    companion object {
        private const val MAX_RETURNED_ENTITIES = 1000
    }
}
