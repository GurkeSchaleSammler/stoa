package com.stoasis.backend.domains.stoaql

import com.stoasis.backend.domains.stoaql.language.AddStatement
import com.stoasis.backend.domains.stoaql.language.ConnectStatement
import com.stoasis.backend.domains.stoaql.language.LayoutStatement
import com.stoasis.backend.domains.stoaql.language.StoaQlLanguageException
import com.stoasis.backend.domains.stoaql.language.StoaQlParser
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertIs

class StoaQlParserTests {
    @Test
    fun `parses aliases connections and layout`() {
        val statements = StoaQlParser.parse(
            "ADD \"SSH\" AS ssh TEXT \"Secure Shell\" TAGS [\"network\",\"security\"]; " +
                "ADD \"Keys\" AS keys; CONNECT ssh -> keys; LAYOUT MINDMAP FROM ssh",
        )

        assertEquals(4, statements.size)
        assertIs<AddStatement>(statements[0]).also {
            assertEquals("ssh", it.alias)
            assertEquals(listOf("network", "security"), it.tags)
        }
        assertIs<ConnectStatement>(statements[2])
        assertIs<LayoutStatement>(statements[3])
    }

    @Test
    fun `reports the source column for an unterminated string`() {
        val error = assertFailsWith<StoaQlLanguageException> { StoaQlParser.parse("ADD \"SSH") }
        assertEquals("STOAQL_UNTERMINATED_STRING", error.code)
        assertEquals(5, error.column)
    }
}
