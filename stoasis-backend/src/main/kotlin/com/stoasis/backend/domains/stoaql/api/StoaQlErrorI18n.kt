package com.stoasis.backend.domains.stoaql.api

import com.stoasis.backend.shared.i18n.StringI18n

object StoaQlErrorI18n {
    fun message(code: String, german: String): StringI18n = dynamicMessage(german)
        ?: MESSAGES[german]
        ?: genericMessage(code, german)

    fun hint(german: String): StringI18n {
        Regex("Deklariere ihn vorher mit AS (.+)\\.").matchEntire(german)?.groupValues?.get(1)?.let { alias ->
            return text(
                german,
                "Declare it first with AS $alias.",
                "Déclarez-le d'abord avec AS $alias.",
                "Dichiaralo prima con AS $alias.",
            )
        }
        return HINTS[german]
            ?: StringI18n(
                de = german,
                fr = "Vérifiez la syntaxe de la requête et réessayez.",
                it = "Controlla la sintassi della query e riprova.",
                en = "Check the query syntax and try again.",
            )
    }

    private fun dynamicMessage(german: String): StringI18n? {
        Regex("Unerwartetes Token '(.+)'.").matchEntire(german)?.groupValues?.get(1)?.let { token ->
            return text(
                german,
                "Unexpected token '$token'.",
                "Jeton inattendu '$token'.",
                "Token imprevisto '$token'.",
            )
        }
        Regex("Unerwartetes Zeichen '(.+)'.").matchEntire(german)?.groupValues?.get(1)?.let { character ->
            return text(
                german,
                "Unexpected character '$character'.",
                "Caractère inattendu '$character'.",
                "Carattere imprevisto '$character'.",
            )
        }
        Regex("Unbekannte Escape-Sequenz (.+)\\.").matchEntire(german)?.groupValues?.get(1)?.let { sequence ->
            return text(
                german,
                "Unknown escape sequence $sequence.",
                "Séquence d'échappement inconnue $sequence.",
                "Sequenza di escape sconosciuta $sequence.",
            )
        }
        Regex("Nach (MINDMAP|TREE) wird FROM erwartet\\.").matchEntire(german)?.groupValues?.get(1)?.let { layout ->
            return text(
                german,
                "FROM is expected after $layout.",
                "FROM est attendu après $layout.",
                "Dopo $layout è previsto FROM.",
            )
        }
        Regex("Alias '(.+)' ist nicht definiert\\.").matchEntire(german)?.groupValues?.get(1)?.let { alias ->
            return text(
                german,
                "Alias '$alias' is not defined.",
                "L'alias '$alias' n'est pas défini.",
                "L'alias '$alias' non è definito.",
            )
        }
        Regex("Pin '(.+)' wurde nicht gefunden\\.").matchEntire(german)?.groupValues?.get(1)?.let { pin ->
            return text(
                german,
                "Pin '$pin' was not found.",
                "Le pin '$pin' est introuvable.",
                "Il pin '$pin' non è stato trovato.",
            )
        }
        Regex("Alias '(.+)' wurde bereits definiert\\.").matchEntire(german)?.groupValues?.get(1)?.let { alias ->
            return text(
                german,
                "Alias '$alias' has already been defined.",
                "L'alias '$alias' a déjà été défini.",
                "L'alias '$alias' è già stato definito.",
            )
        }
        Regex("StoaQL-Version '(.+)' wird nicht unterstützt\\.").matchEntire(german)?.groupValues?.get(1)?.let { version ->
            return text(
                german,
                "StoaQL version '$version' is not supported.",
                "La version StoaQL '$version' n'est pas prise en charge.",
                "La versione StoaQL '$version' non è supportata.",
            )
        }
        Regex("Der Return-Modus '(.+)' wird nicht unterstützt\\.").matchEntire(german)?.groupValues?.get(1)?.let { mode ->
            return text(
                german,
                "Return mode '$mode' is not supported.",
                "Le mode de retour '$mode' n'est pas pris en charge.",
                "La modalità di ritorno '$mode' non è supportata.",
            )
        }
        return null
    }

    private fun genericMessage(code: String, german: String): StringI18n = when (code) {
        "STOAQL_PERMISSION_DENIED" -> text(
            german,
            "You do not have permission to perform this query operation.",
            "Vous n'avez pas l'autorisation d'effectuer cette opération.",
            "Non hai l'autorizzazione per eseguire questa operazione.",
        )
        "STOAQL_REFERENCE_NOT_FOUND", "STOAQL_BOARD_NOT_FOUND" -> text(
            german,
            "The requested reference was not found.",
            "La référence demandée est introuvable.",
            "Il riferimento richiesto non è stato trovato.",
        )
        "STOAQL_CONNECTION_CONFLICT" -> text(
            german,
            "The query operation conflicts with the current board state.",
            "L'opération est en conflit avec l'état actuel du board.",
            "L'operazione è in conflitto con lo stato attuale della board.",
        )
        "STOAQL_OUT_OF_BOUNDS" -> text(
            german,
            "The requested position is outside the board.",
            "La position demandée se trouve hors du board.",
            "La posizione richiesta è fuori dalla board.",
        )
        else -> text(
            german,
            "The query could not be processed.",
            "La requête n'a pas pu être traitée.",
            "Non è stato possibile elaborare la query.",
        )
    }

    private fun text(de: String, en: String, fr: String, it: String) = StringI18n(
        de = de,
        fr = fr,
        it = it,
        en = en,
    )

    private val MESSAGES = mapOf(
        "Die Query ist leer." to text(
            "Die Query ist leer.",
            "The query is empty.",
            "La requête est vide.",
            "La query è vuota.",
        ),
        "Die Query enthält zu viele Statements." to text(
            "Die Query enthält zu viele Statements.",
            "The query contains too many statements.",
            "La requête contient trop d'instructions.",
            "La query contiene troppe istruzioni.",
        ),
        "Am Anfang eines Statements wird ein Command erwartet." to text(
            "Am Anfang eines Statements wird ein Command erwartet.",
            "A command is expected at the beginning of a statement.",
            "Une commande est attendue au début d'une instruction.",
            "All'inizio di un'istruzione è previsto un comando.",
        ),
        "Nach USE wird ein Boardname erwartet." to text(
            "Nach USE wird ein Boardname erwartet.",
            "A board name is expected after USE.",
            "Un nom de board est attendu après USE.",
            "Dopo USE è previsto il nome di una board.",
        ),
        "Nach ADD wird ein Titel in doppelten Anführungszeichen erwartet." to text(
            "Nach ADD wird ein Titel in doppelten Anführungszeichen erwartet.",
            "A title in double quotes is expected after ADD.",
            "Un titre entre guillemets doubles est attendu après ADD.",
            "Dopo ADD è previsto un titolo tra virgolette doppie.",
        ),
        "Nach TEXT wird ein String erwartet." to text(
            "Nach TEXT wird ein String erwartet.",
            "A string is expected after TEXT.",
            "Une chaîne est attendue après TEXT.",
            "Dopo TEXT è prevista una stringa.",
        ),
        "Nach TO wird ein Board erwartet." to text(
            "Nach TO wird ein Board erwartet.",
            "A board is expected after TO.",
            "Un board est attendu après TO.",
            "Dopo TO è prevista una board.",
        ),
        "Nach LINK wird eine URL in doppelten Anführungszeichen erwartet." to text(
            "Nach LINK wird eine URL in doppelten Anführungszeichen erwartet.",
            "A URL in double quotes is expected after LINK.",
            "Une URL entre guillemets doubles est attendue après LINK.",
            "Dopo LINK è previsto un URL tra virgolette doppie.",
        ),
        "Nach TITLE wird ein String erwartet." to text(
            "Nach TITLE wird ein String erwartet.",
            "A string is expected after TITLE.",
            "Une chaîne est attendue après TITLE.",
            "Dopo TITLE è prevista una stringa.",
        ),
        "Nach FIND TAG wird ein Tag erwartet." to text(
            "Nach FIND TAG wird ein Tag erwartet.",
            "A tag is expected after FIND TAG.",
            "Un tag est attendu après FIND TAG.",
            "Dopo FIND TAG è previsto un tag.",
        ),
        "Nach FIND CONNECTED wird TO erwartet." to text(
            "Nach FIND CONNECTED wird TO erwartet.",
            "TO is expected after FIND CONNECTED.",
            "TO est attendu après FIND CONNECTED.",
            "Dopo FIND CONNECTED è previsto TO.",
        ),
        "Nach DEPTH wird eine Zahl erwartet." to text(
            "Nach DEPTH wird eine Zahl erwartet.",
            "A number is expected after DEPTH.",
            "Un nombre est attendu après DEPTH.",
            "Dopo DEPTH è previsto un numero.",
        ),
        "Nach FIND wird ein Suchtext erwartet." to text(
            "Nach FIND wird ein Suchtext erwartet.",
            "Search text is expected after FIND.",
            "Un texte de recherche est attendu après FIND.",
            "Dopo FIND è previsto un testo di ricerca.",
        ),
        "Nach IN wird ein Board erwartet." to text(
            "Nach IN wird ein Board erwartet.",
            "A board is expected after IN.",
            "Un board est attendu après IN.",
            "Dopo IN è prevista una board.",
        ),
        "Nach der Pin-Referenz wird TO erwartet." to text(
            "Nach der Pin-Referenz wird TO erwartet.",
            "TO is expected after the pin reference.",
            "TO est attendu après la référence du pin.",
            "Dopo il riferimento al pin è previsto TO.",
        ),
        "Nach TO wird eine X-Koordinate erwartet." to text(
            "Nach TO wird eine X-Koordinate erwartet.",
            "An X coordinate is expected after TO.",
            "Une coordonnée X est attendue après TO.",
            "Dopo TO è prevista una coordinata X.",
        ),
        "Zwischen X- und Y-Koordinate wird ein Komma erwartet." to text(
            "Zwischen X- und Y-Koordinate wird ein Komma erwartet.",
            "A comma is expected between the X and Y coordinates.",
            "Une virgule est attendue entre les coordonnées X et Y.",
            "Tra le coordinate X e Y è prevista una virgola.",
        ),
        "Nach dem Komma wird eine Y-Koordinate erwartet." to text(
            "Nach dem Komma wird eine Y-Koordinate erwartet.",
            "A Y coordinate is expected after the comma.",
            "Une coordonnée Y est attendue après la virgule.",
            "Dopo la virgola è prevista una coordinata Y.",
        ),
        "Nach LAYOUT wird MINDMAP, TREE oder GRID erwartet." to text(
            "Nach LAYOUT wird MINDMAP, TREE oder GRID erwartet.",
            "MINDMAP, TREE, or GRID is expected after LAYOUT.",
            "MINDMAP, TREE ou GRID est attendu après LAYOUT.",
            "Dopo LAYOUT è previsto MINDMAP, TREE o GRID.",
        ),
        "Zwischen den Referenzen wird -> erwartet." to text(
            "Zwischen den Referenzen wird -> erwartet.",
            "-> is expected between the references.",
            "-> est attendu entre les références.",
            "Tra i riferimenti è previsto ->.",
        ),
        "Nach AS wird ein Alias erwartet." to text(
            "Nach AS wird ein Alias erwartet.",
            "An alias is expected after AS.",
            "Un alias est attendu après AS.",
            "Dopo AS è previsto un alias.",
        ),
        "Keywords dürfen nicht als Alias verwendet werden." to text(
            "Keywords dürfen nicht als Alias verwendet werden.",
            "Keywords cannot be used as aliases.",
            "Les mots-clés ne peuvent pas être utilisés comme alias.",
            "Le parole chiave non possono essere usate come alias.",
        ),
        "Nach TAGS wird [ erwartet." to text(
            "Nach TAGS wird [ erwartet.",
            "[ is expected after TAGS.",
            "[ est attendu après TAGS.",
            "Dopo TAGS è prevista [.",
        ),
        "Die Tag-Liste muss mindestens einen String enthalten." to text(
            "Die Tag-Liste muss mindestens einen String enthalten.",
            "The tag list must contain at least one string.",
            "La liste de tags doit contenir au moins une chaîne.",
            "L'elenco dei tag deve contenere almeno una stringa.",
        ),
        "Nach dem Komma wird ein Tag erwartet." to text(
            "Nach dem Komma wird ein Tag erwartet.",
            "A tag is expected after the comma.",
            "Un tag est attendu après la virgule.",
            "Dopo la virgola è previsto un tag.",
        ),
        "Die Tag-Liste muss mit ] enden." to text(
            "Die Tag-Liste muss mit ] enden.",
            "The tag list must end with ].",
            "La liste de tags doit se terminer par ].",
            "L'elenco dei tag deve terminare con ].",
        ),
        "Die Zahl ist zu groß." to text(
            "Die Zahl ist zu groß.",
            "The number is too large.",
            "Le nombre est trop grand.",
            "Il numero è troppo grande.",
        ),
        "Die Query ist zu lang." to text(
            "Die Query ist zu lang.",
            "The query is too long.",
            "La requête est trop longue.",
            "La query è troppo lunga.",
        ),
        "StoaQL-Queries müssen einzeilig sein." to text(
            "StoaQL-Queries müssen einzeilig sein.",
            "StoaQL queries must be on a single line.",
            "Les requêtes StoaQL doivent tenir sur une seule ligne.",
            "Le query StoaQL devono essere su una sola riga.",
        ),
        "Nach - wird > erwartet." to text(
            "Nach - wird > erwartet.",
            "> is expected after -.",
            "> est attendu après -.",
            "Dopo - è previsto >.",
        ),
        "Strings dürfen keinen echten Zeilenumbruch enthalten." to text(
            "Strings dürfen keinen echten Zeilenumbruch enthalten.",
            "Strings cannot contain an actual line break.",
            "Les chaînes ne peuvent pas contenir de saut de ligne réel.",
            "Le stringhe non possono contenere un'interruzione di riga reale.",
        ),
        "Der String wurde nicht abgeschlossen." to text(
            "Der String wurde nicht abgeschlossen.",
            "The string was not terminated.",
            "La chaîne n'a pas été terminée.",
            "La stringa non è stata terminata.",
        ),
        "Der Idempotency-Key wurde bereits für eine andere Query verwendet." to text(
            "Der Idempotency-Key wurde bereits für eine andere Query verwendet.",
            "The idempotency key has already been used for another query.",
            "La clé d'idempotence a déjà été utilisée pour une autre requête.",
            "La chiave di idempotenza è già stata usata per un'altra query.",
        ),
        "DEPTH muss zwischen 1 und 10 liegen." to text(
            "DEPTH muss zwischen 1 und 10 liegen.",
            "DEPTH must be between 1 and 10.",
            "DEPTH doit être compris entre 1 et 10.",
            "DEPTH deve essere compreso tra 1 e 10.",
        ),
        "Kein Board ausgewählt." to text(
            "Kein Board ausgewählt.",
            "No board is selected.",
            "Aucun board n'est sélectionné.",
            "Nessuna board selezionata.",
        ),
        "Der Pin besitzt kein Board." to text(
            "Der Pin besitzt kein Board.",
            "The pin does not belong to a board.",
            "Le pin n'appartient à aucun board.",
            "Il pin non appartiene a nessuna board.",
        ),
        "Pins aus unterschiedlichen Boards können nicht verbunden werden." to text(
            "Pins aus unterschiedlichen Boards können nicht verbunden werden.",
            "Pins from different boards cannot be connected.",
            "Les pins de boards différents ne peuvent pas être connectés.",
            "I pin di board diverse non possono essere collegati.",
        ),
        "LINK erwartet eine gültige HTTP- oder HTTPS-URL." to text(
            "LINK erwartet eine gültige HTTP- oder HTTPS-URL.",
            "LINK expects a valid HTTP or HTTPS URL.",
            "LINK attend une URL HTTP ou HTTPS valide.",
            "LINK richiede un URL HTTP o HTTPS valido.",
        ),
        "StoaQL v1 unterstützt ausschließlich atomare Queries." to text(
            "StoaQL v1 unterstützt ausschließlich atomare Queries.",
            "StoaQL v1 only supports atomic queries.",
            "StoaQL v1 ne prend en charge que les requêtes atomiques.",
            "StoaQL v1 supporta solo query atomiche.",
        ),
        "Der Idempotency-Key muss zwischen 1 und 128 Zeichen lang sein." to text(
            "Der Idempotency-Key muss zwischen 1 und 128 Zeichen lang sein.",
            "The idempotency key must be between 1 and 128 characters long.",
            "La clé d'idempotence doit contenir entre 1 et 128 caractères.",
            "La chiave di idempotenza deve avere una lunghezza compresa tra 1 e 128 caratteri.",
        ),
        "Diese Eigenschaft wird für den Pin-Typ nicht unterstützt." to text(
            "Diese Eigenschaft wird für den Pin-Typ nicht unterstützt.",
            "This property is not supported for the pin type.",
            "Cette propriété n'est pas prise en charge pour ce type de pin.",
            "Questa proprietà non è supportata per il tipo di pin.",
        ),
    )

    private val HINTS = mapOf(
        "Trenne mehrere Statements mit einem Semikolon." to text(
            "Trenne mehrere Statements mit einem Semikolon.",
            "Separate multiple statements with a semicolon.",
            "Séparez plusieurs instructions par un point-virgule.",
            "Separa più istruzioni con un punto e virgola.",
        ),
        "Gültige Commands sind USE, ADD, LINK, CONNECT, DISCONNECT, FIND, GET, UPDATE, DELETE, MOVE und LAYOUT." to text(
            "Gültige Commands sind USE, ADD, LINK, CONNECT, DISCONNECT, FIND, GET, UPDATE, DELETE, MOVE und LAYOUT.",
            "Valid commands are USE, ADD, LINK, CONNECT, DISCONNECT, FIND, GET, UPDATE, DELETE, MOVE, and LAYOUT.",
            "Les commandes valides sont USE, ADD, LINK, CONNECT, DISCONNECT, FIND, GET, UPDATE, DELETE, MOVE et LAYOUT.",
            "I comandi validi sono USE, ADD, LINK, CONNECT, DISCONNECT, FIND, GET, UPDATE, DELETE, MOVE e LAYOUT.",
        ),
        "UPDATE unterstützt TITLE, TEXT oder TAGS." to text(
            "UPDATE unterstützt TITLE, TEXT oder TAGS.",
            "UPDATE supports TITLE, TEXT, or TAGS.",
            "UPDATE prend en charge TITLE, TEXT ou TAGS.",
            "UPDATE supporta TITLE, TEXT o TAGS.",
        ),
        "Unterstützte Layouts sind MINDMAP, TREE und GRID." to text(
            "Unterstützte Layouts sind MINDMAP, TREE und GRID.",
            "Supported layouts are MINDMAP, TREE, and GRID.",
            "Les dispositions prises en charge sont MINDMAP, TREE et GRID.",
            "I layout supportati sono MINDMAP, TREE e GRID.",
        ),
        "Bestehende Pins werden als \"pin-id\" und neue Pins über ihren Alias referenziert." to text(
            "Bestehende Pins werden als \"pin-id\" und neue Pins über ihren Alias referenziert.",
            "Reference existing pins as \"pin-id\" and new pins by their alias.",
            "Référencez les pins existants comme \"pin-id\" et les nouveaux pins par leur alias.",
            "Fai riferimento ai pin esistenti come \"pin-id\" e ai nuovi pin tramite il loro alias.",
        ),
        "Verwende einen Alias oder eine Pin-ID in doppelten Anführungszeichen." to text(
            "Verwende einen Alias oder eine Pin-ID in doppelten Anführungszeichen.",
            "Use an alias or a pin ID in double quotes.",
            "Utilisez un alias ou un ID de pin entre guillemets doubles.",
            "Usa un alias o un ID pin tra virgolette doppie.",
        ),
        "Öffne die Console in einem Board, verwende USE oder ergänze TO." to text(
            "Öffne die Console in einem Board, verwende USE oder ergänze TO.",
            "Open the console from a board, use USE, or add TO.",
            "Ouvrez la console depuis un board, utilisez USE ou ajoutez TO.",
            "Apri la console da una board, usa USE oppure aggiungi TO.",
        ),
        "Unterstützt wird languageVersion 1.0." to text(
            "Unterstützt wird languageVersion 1.0.",
            "languageVersion 1.0 is supported.",
            "languageVersion 1.0 est prise en charge.",
            "È supportata languageVersion 1.0.",
        ),
    )
}
