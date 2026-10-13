package com.stoasis.backend.domains.board.application

/** Small, curated blueprints built from normal editable board elements. */
data class TemplateSection(val title: List<String>, val color: String) {
    fun title(language: String) = title[listOf("de", "en", "fr", "it").indexOf(language).coerceAtLeast(0)]
}
data class BoardTemplate(val id: String, val motif: String, val sections: List<TemplateSection>)

object BoardTemplateCatalog {
    private fun section(de: String, en: String, fr: String, it: String, color: String) =
        TemplateSection(listOf(de, en, fr, it), color)

    val templates = listOf(
        BoardTemplate("project", "arrow", listOf(
            section("Ideen", "Ideas", "Idées", "Idee", "clay"),
            section("In Arbeit", "In progress", "En cours", "In corso", "accent"),
            section("Erledigt", "Done", "Terminé", "Completato", "sage"),
        )),
        BoardTemplate("week", "star", listOf(
            section("Montag", "Monday", "Lundi", "Lunedì", "accent"),
            section("Dienstag", "Tuesday", "Mardi", "Martedì", "sage"),
            section("Mittwoch", "Wednesday", "Mercredi", "Mercoledì", "clay"),
            section("Donnerstag", "Thursday", "Jeudi", "Giovedì", "amber"),
            section("Freitag", "Friday", "Vendredi", "Venerdì", "ink"),
        )),
        BoardTemplate("research", "compass", listOf(
            section("Fragen", "Questions", "Questions", "Domande", "amber"),
            section("Quellen", "Sources", "Sources", "Fonti", "accent"),
            section("Erkenntnisse", "Insights", "Résultats", "Risultati", "sage"),
        )),
        BoardTemplate("moodboard", "wave", listOf(
            section("Stimmung", "Mood", "Ambiance", "Atmosfera", "clay"),
            section("Inspiration", "Inspiration", "Inspiration", "Ispirazione", "sage"),
            section("Details", "Details", "Détails", "Dettagli", "ink"),
        )),
        BoardTemplate("learning", "leaf", listOf(
            section("Entdecken", "Discover", "Découvrir", "Scoprire", "accent"),
            section("Üben", "Practice", "Pratiquer", "Esercitarsi", "amber"),
            section("Verstanden", "Understood", "Compris", "Compreso", "sage"),
        )),
    )

    fun prompt(language: String) = when (language) {
        "en" -> "Your first thought. Edit this note or replace it with your own pins."
        "fr" -> "Votre première idée. Modifiez cette note ou remplacez-la par vos épingles."
        "it" -> "La tua prima idea. Modifica questa nota o sostituiscila con le tue schede."
        else -> "Dein erster Gedanke. Bearbeite diese Notiz oder ersetze sie durch eigene Kacheln."
    }
}
