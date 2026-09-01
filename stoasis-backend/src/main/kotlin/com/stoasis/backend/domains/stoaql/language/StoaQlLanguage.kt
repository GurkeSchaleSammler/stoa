package com.stoasis.backend.domains.stoaql.language

data class SourceSpan(val column: Int)

sealed interface StoaQlStatement {
    val span: SourceSpan
}

data class UseStatement(val board: String, override val span: SourceSpan) : StoaQlStatement
data class AddStatement(
    val title: String,
    val alias: String?,
    val text: String?,
    val tags: List<String>,
    val board: String?,
    override val span: SourceSpan,
) : StoaQlStatement
data class LinkStatement(
    val url: String,
    val alias: String?,
    val title: String?,
    val tags: List<String>,
    val board: String?,
    override val span: SourceSpan,
) : StoaQlStatement

data class PinReference(val value: String, val isAlias: Boolean, val span: SourceSpan)
data class ConnectStatement(
    val source: PinReference,
    val target: PinReference,
    override val span: SourceSpan,
) : StoaQlStatement
data class DisconnectStatement(
    val source: PinReference,
    val target: PinReference,
    override val span: SourceSpan,
) : StoaQlStatement

sealed interface FindStatement : StoaQlStatement
data class FindTextStatement(
    val text: String,
    val board: String?,
    override val span: SourceSpan,
) : FindStatement
data class FindTagStatement(val tag: String, override val span: SourceSpan) : FindStatement
data class FindConnectedStatement(
    val reference: PinReference,
    val depth: Int,
    override val span: SourceSpan,
) : FindStatement

sealed interface GetStatement : StoaQlStatement
data class GetPinStatement(val reference: PinReference, override val span: SourceSpan) : GetStatement
data class GetBoardStatement(val board: String?, override val span: SourceSpan) : GetStatement

enum class UpdateField { TITLE, TEXT, TAGS }
data class UpdateStatement(
    val reference: PinReference,
    val field: UpdateField,
    val text: String? = null,
    val tags: List<String> = emptyList(),
    override val span: SourceSpan,
) : StoaQlStatement
data class DeleteStatement(val reference: PinReference, override val span: SourceSpan) : StoaQlStatement
data class MoveStatement(
    val reference: PinReference,
    val x: Int,
    val y: Int,
    override val span: SourceSpan,
) : StoaQlStatement

enum class LayoutType { MINDMAP, TREE, GRID }
data class LayoutStatement(
    val type: LayoutType,
    val root: PinReference?,
    override val span: SourceSpan,
) : StoaQlStatement

class StoaQlLanguageException(
    val code: String,
    override val message: String,
    val column: Int,
    val hint: String? = null,
) : RuntimeException(message)

class StoaQlParser private constructor(private val tokens: List<Token>) {
    private var current = 0

    fun parse(): List<StoaQlStatement> {
        if (peek().kind == TokenKind.EOF) errorAt(peek(), "STOAQL_PARSE_ERROR", "Die Query ist leer.")
        val statements = mutableListOf<StoaQlStatement>()
        while (peek().kind != TokenKind.EOF) {
            if (statements.size >= MAX_STATEMENTS) {
                errorAt(peek(), "STOAQL_PARSE_ERROR", "Die Query enthält zu viele Statements.")
            }
            statements += statement()
            if (match(TokenKind.SEMICOLON)) {
                if (peek().kind == TokenKind.EOF) break
            } else if (peek().kind != TokenKind.EOF) {
                errorAt(peek(), hint = "Trenne mehrere Statements mit einem Semikolon.")
            }
        }
        return statements
    }

    private fun statement(): StoaQlStatement {
        val command = expect(TokenKind.WORD, "Am Anfang eines Statements wird ein Command erwartet.")
        val span = SourceSpan(command.column)
        return when (command.text.uppercase()) {
            "USE" -> UseStatement(expectString("Nach USE wird ein Boardname erwartet."), span)
            "ADD" -> add(span)
            "LINK" -> link(span)
            "CONNECT" -> ConnectStatement(reference(), expectArrowThenReference(), span)
            "DISCONNECT" -> DisconnectStatement(reference(), expectArrowThenReference(), span)
            "FIND" -> find(span)
            "GET" -> get(span)
            "UPDATE" -> update(span)
            "DELETE" -> DeleteStatement(reference(), span)
            "MOVE" -> move(span)
            "LAYOUT" -> layout(span)
            else -> errorAt(command, hint = "Gültige Commands sind USE, ADD, LINK, CONNECT, DISCONNECT, FIND, GET, UPDATE, DELETE, MOVE und LAYOUT.")
        }
    }

    private fun add(span: SourceSpan): AddStatement {
        val title = expectString("Nach ADD wird ein Titel in doppelten Anführungszeichen erwartet.")
        val alias = if (matchWord("AS")) identifier() else null
        val text = if (matchWord("TEXT")) expectString("Nach TEXT wird ein String erwartet.") else null
        val tags = if (matchWord("TAGS")) tags() else emptyList()
        val board = if (matchWord("TO")) expectString("Nach TO wird ein Board erwartet.") else null
        return AddStatement(title, alias, text, tags, board, span)
    }

    private fun link(span: SourceSpan): LinkStatement {
        val url = expectString("Nach LINK wird eine URL in doppelten Anführungszeichen erwartet.")
        val alias = if (matchWord("AS")) identifier() else null
        val title = if (matchWord("TITLE")) expectString("Nach TITLE wird ein String erwartet.") else null
        val tags = if (matchWord("TAGS")) tags() else emptyList()
        val board = if (matchWord("TO")) expectString("Nach TO wird ein Board erwartet.") else null
        return LinkStatement(url, alias, title, tags, board, span)
    }

    private fun find(span: SourceSpan): FindStatement = when {
        matchWord("TAG") -> FindTagStatement(expectString("Nach FIND TAG wird ein Tag erwartet."), span)
        matchWord("CONNECTED") -> {
            expectWord("TO", "Nach FIND CONNECTED wird TO erwartet.")
            val reference = reference()
            val depth = if (matchWord("DEPTH")) number("Nach DEPTH wird eine Zahl erwartet.") else 1
            FindConnectedStatement(reference, depth, span)
        }
        else -> {
            val text = expectString("Nach FIND wird ein Suchtext erwartet.")
            val board = if (matchWord("IN")) expectString("Nach IN wird ein Board erwartet.") else null
            FindTextStatement(text, board, span)
        }
    }

    private fun get(span: SourceSpan): GetStatement {
        if (matchWord("BOARD")) {
            val board = if (peek().kind == TokenKind.STRING) advance().text else null
            return GetBoardStatement(board, span)
        }
        return GetPinStatement(reference(), span)
    }

    private fun update(span: SourceSpan): UpdateStatement {
        val reference = reference()
        return when {
            matchWord("TITLE") -> UpdateStatement(reference, UpdateField.TITLE, text = expectString("Nach TITLE wird ein String erwartet."), span = span)
            matchWord("TEXT") -> UpdateStatement(reference, UpdateField.TEXT, text = expectString("Nach TEXT wird ein String erwartet."), span = span)
            matchWord("TAGS") -> UpdateStatement(reference, UpdateField.TAGS, tags = tags(), span = span)
            else -> errorAt(peek(), hint = "UPDATE unterstützt TITLE, TEXT oder TAGS.")
        }
    }

    private fun move(span: SourceSpan): MoveStatement {
        val reference = reference()
        expectWord("TO", "Nach der Pin-Referenz wird TO erwartet.")
        val x = number("Nach TO wird eine X-Koordinate erwartet.")
        expect(TokenKind.COMMA, "Zwischen X- und Y-Koordinate wird ein Komma erwartet.")
        val y = number("Nach dem Komma wird eine Y-Koordinate erwartet.")
        return MoveStatement(reference, x, y, span)
    }

    private fun layout(span: SourceSpan): LayoutStatement {
        val typeToken = expect(TokenKind.WORD, "Nach LAYOUT wird MINDMAP, TREE oder GRID erwartet.")
        val type = runCatching { LayoutType.valueOf(typeToken.text.uppercase()) }.getOrElse {
            errorAt(typeToken, hint = "Unterstützte Layouts sind MINDMAP, TREE und GRID.")
        }
        return if (type == LayoutType.GRID) {
            LayoutStatement(type, null, span)
        } else {
            expectWord("FROM", "Nach ${type.name} wird FROM erwartet.")
            LayoutStatement(type, reference(), span)
        }
    }

    private fun expectArrowThenReference(): PinReference {
        expect(TokenKind.ARROW, "Zwischen den Referenzen wird -> erwartet.")
        return reference()
    }

    private fun reference(): PinReference {
        val token = peek()
        return when (token.kind) {
            TokenKind.STRING -> PinReference(advance().text, false, SourceSpan(token.column))
            TokenKind.WORD -> {
                if (token.text.uppercase() in RESERVED_WORDS) {
                    errorAt(token, hint = "Bestehende Pins werden als \"pin-id\" und neue Pins über ihren Alias referenziert.")
                }
                PinReference(advance().text, true, SourceSpan(token.column))
            }
            else -> errorAt(token, hint = "Verwende einen Alias oder eine Pin-ID in doppelten Anführungszeichen.")
        }
    }

    private fun identifier(): String {
        val token = expect(TokenKind.WORD, "Nach AS wird ein Alias erwartet.")
        if (token.text.uppercase() in RESERVED_WORDS) {
            errorAt(token, "STOAQL_PARSE_ERROR", "Keywords dürfen nicht als Alias verwendet werden.")
        }
        return token.text
    }

    private fun tags(): List<String> {
        expect(TokenKind.LBRACKET, "Nach TAGS wird [ erwartet.")
        val result = mutableListOf(expectString("Die Tag-Liste muss mindestens einen String enthalten."))
        while (match(TokenKind.COMMA)) result += expectString("Nach dem Komma wird ein Tag erwartet.")
        expect(TokenKind.RBRACKET, "Die Tag-Liste muss mit ] enden.")
        return result
    }

    private fun number(message: String): Int {
        val token = expect(TokenKind.NUMBER, message)
        return token.text.toIntOrNull() ?: errorAt(token, "STOAQL_PARSE_ERROR", "Die Zahl ist zu groß.")
    }

    private fun expectString(message: String) = expect(TokenKind.STRING, message).text

    private fun expectWord(word: String, message: String) {
        if (!matchWord(word)) errorAt(peek(), message = message)
    }

    private fun matchWord(word: String): Boolean {
        if (peek().kind != TokenKind.WORD || !peek().text.equals(word, ignoreCase = true)) return false
        advance()
        return true
    }

    private fun match(kind: TokenKind): Boolean {
        if (peek().kind != kind) return false
        advance()
        return true
    }

    private fun expect(kind: TokenKind, message: String): Token {
        if (peek().kind == kind) return advance()
        return errorAt(peek(), message = message)
    }

    private fun peek() = tokens[current]
    private fun advance() = tokens[current++]

    private fun errorAt(
        token: Token,
        code: String = "STOAQL_UNEXPECTED_TOKEN",
        message: String = "Unerwartetes Token '${token.text}'.",
        hint: String? = null,
    ): Nothing = throw StoaQlLanguageException(code, message, token.column, hint)

    companion object {
        private const val MAX_QUERY_LENGTH = 100 * 1024
        private const val MAX_STATEMENTS = 500

        fun parse(query: String): List<StoaQlStatement> {
            if (query.length > MAX_QUERY_LENGTH) {
                throw StoaQlLanguageException("STOAQL_PARSE_ERROR", "Die Query ist zu lang.", 1)
            }
            return StoaQlParser(Lexer(query).scan()).parse()
        }
    }
}

private enum class TokenKind { WORD, STRING, NUMBER, SEMICOLON, COMMA, LBRACKET, RBRACKET, ARROW, EOF }
private data class Token(val kind: TokenKind, val text: String, val column: Int)

private class Lexer(private val source: String) {
    private var current = 0

    fun scan(): List<Token> {
        val tokens = mutableListOf<Token>()
        while (current < source.length) {
            val start = current
            when (val char = source[current++]) {
                ' ', '\t' -> Unit
                '\n', '\r' -> fail("STOAQL_PARSE_ERROR", "StoaQL-Queries müssen einzeilig sein.", start)
                ';' -> tokens += Token(TokenKind.SEMICOLON, ";", start + 1)
                ',' -> tokens += Token(TokenKind.COMMA, ",", start + 1)
                '[' -> tokens += Token(TokenKind.LBRACKET, "[", start + 1)
                ']' -> tokens += Token(TokenKind.RBRACKET, "]", start + 1)
                '-' -> {
                    if (current < source.length && source[current] == '>') {
                        current += 1
                        tokens += Token(TokenKind.ARROW, "->", start + 1)
                    } else {
                        fail("STOAQL_UNEXPECTED_TOKEN", "Nach - wird > erwartet.", start)
                    }
                }
                '"' -> tokens += string(start)
                else -> when {
                    char.isLetter() || char == '_' -> tokens += word(start)
                    char.isDigit() -> tokens += number(start)
                    else -> fail("STOAQL_UNEXPECTED_TOKEN", "Unerwartetes Zeichen '$char'.", start)
                }
            }
        }
        tokens += Token(TokenKind.EOF, "<EOF>", source.length + 1)
        return tokens
    }

    private fun string(start: Int): Token {
        val value = StringBuilder()
        while (current < source.length) {
            when (val char = source[current++]) {
                '"' -> return Token(TokenKind.STRING, value.toString(), start + 1)
                '\n', '\r' -> fail("STOAQL_UNTERMINATED_STRING", "Strings dürfen keinen echten Zeilenumbruch enthalten.", start)
                '\\' -> {
                    if (current >= source.length) break
                    value.append(
                        when (val escaped = source[current++]) {
                            '"' -> '"'
                            '\\' -> '\\'
                            'n' -> '\n'
                            'r' -> '\r'
                            't' -> '\t'
                            else -> fail("STOAQL_PARSE_ERROR", "Unbekannte Escape-Sequenz \\$escaped.", current - 2)
                        },
                    )
                }
                else -> value.append(char)
            }
        }
        fail("STOAQL_UNTERMINATED_STRING", "Der String wurde nicht abgeschlossen.", start)
    }

    private fun word(start: Int): Token {
        while (current < source.length && (source[current].isLetterOrDigit() || source[current] == '_')) current += 1
        return Token(TokenKind.WORD, source.substring(start, current), start + 1)
    }

    private fun number(start: Int): Token {
        while (current < source.length && source[current].isDigit()) current += 1
        return Token(TokenKind.NUMBER, source.substring(start, current), start + 1)
    }

    private fun fail(code: String, message: String, index: Int): Nothing =
        throw StoaQlLanguageException(code, message, index + 1)
}

private val RESERVED_WORDS = setOf(
    "USE", "ADD", "LINK", "AS", "TO", "TITLE", "TEXT", "TAGS", "CONNECT", "DISCONNECT",
    "FIND", "TAG", "IN", "CONNECTED", "DEPTH", "GET", "BOARD", "UPDATE", "DELETE", "MOVE",
    "LAYOUT", "FROM", "MINDMAP", "TREE", "GRID",
)
