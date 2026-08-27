package com.stoasis.backend.shared.utils

private val colorPresets = setOf("accent", "sage", "clay", "ink", "amber")
private val hexColor = Regex("^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")

fun normalizeUiColor(value: String?): String? {
    val trimmed = value?.trim()?.takeIf(String::isNotBlank) ?: return null
    val preset = trimmed.lowercase()
    if (preset in colorPresets) return preset
    val hex = hexColor.matchEntire(trimmed)?.groupValues?.get(1) ?: return null
    return "#${hex.lowercase()}"
}
