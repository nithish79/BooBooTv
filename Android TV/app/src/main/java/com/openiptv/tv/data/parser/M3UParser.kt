package com.openiptv.tv.data.parser

import com.openiptv.tv.data.model.Channel
import java.io.BufferedReader
import java.io.StringReader
import java.util.regex.Pattern

object M3UParser {

    private val PROBLEMATIC_DOMAINS = listOf(
        "aynascope.net",
        "aynaott.com",
        "cloudplay-sonyliv.pages.dev",
        "dishmt.slivcdn.com",
        "103.253.18.58:8000",
        "103.157.248.140:8000",
        "121.91.61.106:8000",
        "23.237.104.106:8080",
        "88.212.15.19",
        "stream.cammonitorplus.net",
        "mdc.ott.alticeusa.net",
        "bantel-cdn1.iptvperu.tv",
        "jmp2.uk",
        ".amagi.tv/"
    )

    private val QUALITY_REGEX = Pattern.compile("[\\[\\(]\\s*(\\d{3,4}p|4K|2K|FHD|HD|SD)\\s*[\\]\\)]", Pattern.CASE_INSENSITIVE)
    private val NAME_REGEX = Pattern.compile("tvg-name=\"([^\"]*)\"", Pattern.CASE_INSENSITIVE)
    private val LOGO_REGEX = Pattern.compile("tvg-logo=\"([^\"]*)\"", Pattern.CASE_INSENSITIVE)
    private val ID_REGEX = Pattern.compile("tvg-id=\"([^\"]*)\"", Pattern.CASE_INSENSITIVE)
    private val COUNTRY_REGEX = Pattern.compile("tvg-country=\"([^\"]*)\"", Pattern.CASE_INSENSITIVE)
    private val GROUP_REGEX = Pattern.compile("group-title=\"([^\"]*)\"", Pattern.CASE_INSENSITIVE)

    fun parse(m3uContent: String): List<Channel> {
        val channels = mutableListOf<Channel>()
        val reader = BufferedReader(StringReader(m3uContent))
        var line: String?

        var currentName = ""
        var currentLogo = ""
        var currentGroup = "General"
        var currentCountry = ""
        var currentTvgId = ""
        var currentQuality = ""
        var counter = 0

        while (reader.readLine().also { line = it } != null) {
            val trimmed = line!!.trim()
            if (trimmed.isEmpty()) continue

            if (trimmed.startsWith("#EXTINF:", ignoreCase = true)) {
                counter++

                val nameMatcher = NAME_REGEX.matcher(trimmed)
                val logoMatcher = LOGO_REGEX.matcher(trimmed)
                val idMatcher = ID_REGEX.matcher(trimmed)
                val countryMatcher = COUNTRY_REGEX.matcher(trimmed)
                val groupMatcher = GROUP_REGEX.matcher(trimmed)

                val commaIdx = trimmed.lastIndexOf(',')
                val rawTitle = if (commaIdx != -1) trimmed.substring(commaIdx + 1).trim() else ""

                val nameCandidate = if (nameMatcher.find()) (nameMatcher.group(1) ?: "").trim() else rawTitle.ifEmpty { "Channel $counter" }
                val (cleanName, quality) = extractQuality(nameCandidate)

                currentName = cleanName
                currentQuality = quality
                currentLogo = if (logoMatcher.find()) (logoMatcher.group(1) ?: "").trim() else ""
                currentTvgId = if (idMatcher.find()) (idMatcher.group(1) ?: "").trim() else ""
                currentGroup = if (groupMatcher.find()) (groupMatcher.group(1) ?: "").trim().ifEmpty { "General" } else "General"
                currentCountry = if (countryMatcher.find()) (countryMatcher.group(1) ?: "").trim() else extractCountryFromId(currentTvgId)
            } else if (!trimmed.startsWith("#") && (trimmed.startsWith("http://") || trimmed.startsWith("https://"))) {
                if (currentName.isEmpty()) {
                    currentName = "Channel ${channels.size + 1}"
                }

                val alternatives = mutableListOf<String>()
                alternatives.add(trimmed)

                attachFallbacks(currentName, currentTvgId, alternatives)

                alternatives.sortWith { a, b ->
                    val aProb = if (isProblematic(a)) 1 else 0
                    val bProb = if (isProblematic(b)) 1 else 0
                    if (aProb != bProb) aProb - bProb
                    else {
                        val aHighPerf = if (a.contains("vgcdn.net") || a.contains("cloudfront.net") || a.contains("tangotv.in")) 1 else 0
                        val bHighPerf = if (b.contains("vgcdn.net") || b.contains("cloudfront.net") || b.contains("tangotv.in")) 1 else 0
                        bHighPerf - aHighPerf
                    }
                }

                val primaryUrl = alternatives.firstOrNull() ?: trimmed
                val channelId = if (currentTvgId.isNotEmpty()) "$currentTvgId-$counter" else "ch-$counter"

                channels.add(
                    Channel(
                        id = channelId,
                        name = currentName,
                        logo = currentLogo,
                        country = currentCountry,
                        group = currentGroup,
                        url = primaryUrl,
                        alternatives = alternatives,
                        quality = currentQuality,
                        streamType = detectStreamType(primaryUrl)
                    )
                )

                currentName = ""
                currentLogo = ""
                currentGroup = "General"
                currentCountry = ""
                currentTvgId = ""
                currentQuality = ""
            }
        }

        return channels
    }

    private fun isProblematic(url: String): Boolean {
        return PROBLEMATIC_DOMAINS.any { url.contains(it, ignoreCase = true) }
    }

    private fun extractQuality(name: String): Pair<String, String> {
        val matcher = QUALITY_REGEX.matcher(name)
        return if (matcher.find()) {
            val quality = (matcher.group(1) ?: "").uppercase()
            val matchedGroup = matcher.group(0) ?: ""
            val clean = name.replace(matchedGroup, "").trim()
            Pair(clean.ifEmpty { name }, quality)
        } else {
            Pair(name, "")
        }
    }

    private fun extractCountryFromId(tvgId: String): String {
        if (tvgId.isEmpty()) return ""
        val match = Regex("""\.([a-z]{2})(@|$)""", RegexOption.IGNORE_CASE).find(tvgId)
        return match?.groupValues?.getOrNull(1)?.uppercase() ?: ""
    }

    private fun detectStreamType(url: String): String {
        val lower = url.lowercase()
        return when {
            lower.contains(".m3u8") || lower.contains("/hls") || lower.contains(".smil") -> "hls"
            lower.endsWith(".mp4") || lower.contains(".mp4?") -> "mp4"
            lower.endsWith(".ts") || lower.contains(".ts?") -> "ts"
            else -> "hls"
        }
    }

    private fun attachFallbacks(name: String, tvgId: String, alternatives: MutableList<String>) {
        val lowerName = name.lowercase()
        val lowerId = tvgId.lowercase()

        if (lowerName.contains("asianet") || lowerId.contains("asianet")) {
            val fallbacks = when {
                lowerName.contains("suvarna") || lowerId.contains("suvarna") -> listOf(
                    "https://asianetnews.vgcdn.net/vglive-sk-335835/playlist.m3u8"
                )
                lowerName.contains("movies") || lowerId.contains("movies") -> listOf(
                    "https://da86m1sqpm3o0.cloudfront.net/28072023/smil:asianetmovies1.smil/playlist.m3u8"
                )
                lowerName.contains("news") || lowerId.contains("news") -> listOf(
                    "https://asianet-samsung.vgcdn.net/ptnr-monitoring/vglive-sk-906908/playlist.m3u8",
                    "https://asianetnews.vgcdn.net/vglive-sk-917600/playlist.m3u8"
                )
                else -> listOf(
                    "https://raw.githubusercontent.com/amazeyourself/adaptive-streams/refs/heads/main/streams/in/YuppTV/AsianetHD.m3u8",
                    "https://mumt03.tangotv.in/Dsly5z3HASIANETMIDDLEEAST/index.m3u8"
                )
            }
            for (fb in fallbacks) {
                if (!alternatives.contains(fb)) alternatives.add(fb)
            }
        }
    }
}