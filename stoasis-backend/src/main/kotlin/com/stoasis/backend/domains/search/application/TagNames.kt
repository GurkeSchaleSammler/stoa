package com.stoasis.backend.domains.search.application

import com.stoasis.backend.shared.web.ApiException
import java.text.Normalizer
import java.util.Locale
import org.springframework.http.HttpStatus

/** Normalizes tags identically in pin editing, imports and search. */
fun normalizeTag(value: String): String {
    val name = Normalizer.normalize(value.trim().removePrefix("#"), Normalizer.Form.NFC).lowercase(Locale.ROOT)
    if (name.length > 120 || name.any(Char::isISOControl)) {
        throw ApiException(HttpStatus.BAD_REQUEST, "Tags dürfen höchstens 120 Zeichen und keine Steuerzeichen enthalten.")
    }
    return name
}

/** Removes empty and duplicate names and bounds the number of tags. */
fun normalizeTags(values: Collection<String>): MutableSet<String> {
    if (values.size > 50) throw ApiException(HttpStatus.BAD_REQUEST, "Höchstens 50 Tags sind erlaubt.")
    return values.map(::normalizeTag).filter(String::isNotBlank).toMutableSet()
}
