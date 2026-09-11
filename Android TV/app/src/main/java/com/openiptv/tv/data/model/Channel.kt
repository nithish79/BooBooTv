package com.openiptv.tv.data.model

import java.io.Serializable

data class Channel(
    val id: String,
    val name: String,
    val logo: String = "",
    val country: String = "",
    val group: String = "General",
    val url: String,
    val alternatives: List<String> = emptyList(),
    val quality: String = "",
    val streamType: String = "hls"
) : Serializable

data class Category(
    val id: String,
    val name: String,
    val count: Int = 0
)

data class FeaturedPreset(
    val id: String,
    val name: String,
    val description: String,
    val badge: String = "",
    val url: String
)

data class IptvCategory(
    val id: String,
    val name: String,
    val description: String = "",
    val url: String
)

data class IptvCountry(
    val code: String,
    val name: String,
    val flag: String,
    val url: String
)

enum class HomeSection {
    PRESETS,
    GENRES,
    REGIONS,
    FAVORITES,
    RECENTS
}

enum class ScreenState {
    HOME,
    PLAYER
}