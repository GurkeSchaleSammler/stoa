package com.stoasis.backend.domains.stoaql

import com.stoasis.backend.domains.stoaql.api.StoaQlErrorI18n
import kotlin.test.Test
import kotlin.test.assertEquals

class StoaQlErrorI18nTests {
    @Test
    fun `translates dynamic error values into every supported language`() {
        val message = StoaQlErrorI18n.message(
            "STOAQL_UNKNOWN_ALIAS",
            "Alias 'missing' ist nicht definiert.",
        )

        assertEquals("Alias 'missing' ist nicht definiert.", message.de)
        assertEquals("Alias 'missing' is not defined.", message.en)
        assertEquals("L'alias 'missing' n'est pas défini.", message.fr)
        assertEquals("L'alias 'missing' non è definito.", message.it)
    }

    @Test
    fun `translates dynamic hints into every supported language`() {
        val hint = StoaQlErrorI18n.hint("Deklariere ihn vorher mit AS missing.")

        assertEquals("Deklariere ihn vorher mit AS missing.", hint.de)
        assertEquals("Declare it first with AS missing.", hint.en)
        assertEquals("Déclarez-le d'abord avec AS missing.", hint.fr)
        assertEquals("Dichiaralo prima con AS missing.", hint.it)
    }
}
