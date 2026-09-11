package com.openiptv.tv.data.repository

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.openiptv.tv.data.model.Category
import com.openiptv.tv.data.model.Channel
import com.openiptv.tv.data.model.FeaturedPreset
import com.openiptv.tv.data.model.IptvCategory
import com.openiptv.tv.data.model.IptvCountry
import com.openiptv.tv.data.parser.M3UParser
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.util.concurrent.TimeUnit

class PlaylistRepository(private val context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences("openiptv_tv_prefs", Context.MODE_PRIVATE)
    private val gson = Gson()

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .build()

    // 1. Featured Presets
    val presets = listOf(
        FeaturedPreset(
            id = "free-tv-global",
            name = "Free-TV Global Master",
            description = "2,000+ public worldwide channels across 97 countries",
            badge = "Popular",
            url = "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8"
        ),
        FeaturedPreset(
            id = "iptv-org-sports",
            name = "Live Sports ⚽",
            description = "500+ sports channels, football, racing, athletics",
            badge = "Sports",
            url = "https://iptv-org.github.io/iptv/categories/sports.m3u"
        ),
        FeaturedPreset(
            id = "iptv-org-movies",
            name = "Movies & Cinema 🎬",
            description = "800+ cinema channels, classics, Hollywood & world movies",
            badge = "Movies",
            url = "https://iptv-org.github.io/iptv/categories/movies.m3u"
        ),
        FeaturedPreset(
            id = "iptv-org-news",
            name = "24/7 Global News 📰",
            description = "1,000+ live news broadcasts from major networks",
            badge = "News",
            url = "https://iptv-org.github.io/iptv/categories/news.m3u"
        ),
        FeaturedPreset(
            id = "iptv-org-music",
            name = "Music & Concerts 🎵",
            description = "700+ music TV channels, rock, pop, hip-hop, electronic",
            badge = "Music",
            url = "https://iptv-org.github.io/iptv/categories/music.m3u"
        ),
        FeaturedPreset(
            id = "iptv-org-india",
            name = "India Live TV 🇮🇳",
            description = "750+ Indian channels (DD, ABP, Zee, Aaj Tak, News, Entertainment)",
            badge = "India",
            url = "https://iptv-org.github.io/iptv/countries/in.m3u"
        ),
        FeaturedPreset(
            id = "iptv-org-usa",
            name = "United States 🇺🇸",
            description = "350+ American public channels, news, weather, sports",
            badge = "USA",
            url = "https://iptv-org.github.io/iptv/countries/us.m3u"
        ),
        FeaturedPreset(
            id = "iptv-org-uk",
            name = "United Kingdom 🇬🇧",
            description = "180+ British channels, BBC, ITV, Sky News, factual",
            badge = "UK",
            url = "https://iptv-org.github.io/iptv/countries/uk.m3u"
        )
    )

    // 2. IPTV-Org Genres / Categories
    val genres = listOf(
        IptvCategory("sports", "Sports ⚽", "Live sports, football, athletics, racing", "https://iptv-org.github.io/iptv/categories/sports.m3u"),
        IptvCategory("movies", "Movies & Cinema 🎬", "Feature films and cinema", "https://iptv-org.github.io/iptv/categories/movies.m3u"),
        IptvCategory("news", "News 📰", "24/7 breaking news and current affairs", "https://iptv-org.github.io/iptv/categories/news.m3u"),
        IptvCategory("music", "Music 🎵", "Music tracks, videos and concerts", "https://iptv-org.github.io/iptv/categories/music.m3u"),
        IptvCategory("entertainment", "Entertainment 🎭", "General variety and reality series", "https://iptv-org.github.io/iptv/categories/entertainment.m3u"),
        IptvCategory("animation", "Animation & Cartoons 🎨", "2D/3D cartoon & animated shows", "https://iptv-org.github.io/iptv/categories/animation.m3u"),
        IptvCategory("kids", "Kids 🧒", "Children's programming and family cartoons", "https://iptv-org.github.io/iptv/categories/kids.m3u"),
        IptvCategory("documentary", "Documentary 🦁", "Nature, real world and wildlife", "https://iptv-org.github.io/iptv/categories/documentary.m3u"),
        IptvCategory("comedy", "Comedy 😂", "Stand-up, sitcoms, and humor", "https://iptv-org.github.io/iptv/categories/comedy.m3u"),
        IptvCategory("cooking", "Cooking & Food 🍳", "Culinary shows and recipes", "https://iptv-org.github.io/iptv/categories/cooking.m3u"),
        IptvCategory("auto", "Auto & Motors 🏎️", "Cars, motorsports, and racing", "https://iptv-org.github.io/iptv/categories/auto.m3u"),
        IptvCategory("business", "Business & Finance 📈", "Markets, finance, and economics", "https://iptv-org.github.io/iptv/categories/business.m3u"),
        IptvCategory("classic", "Classic TV 🎞️", "Vintage shows and cinema from earlier eras", "https://iptv-org.github.io/iptv/categories/classic.m3u"),
        IptvCategory("culture", "Culture & Arts 🏛️", "Art, history, and cultural documentaries", "https://iptv-org.github.io/iptv/categories/culture.m3u"),
        IptvCategory("education", "Education 🎓", "Academic and instructional television", "https://iptv-org.github.io/iptv/categories/education.m3u"),
        IptvCategory("family", "Family 👨‍👩‍👧‍👦", "All-ages family entertainment", "https://iptv-org.github.io/iptv/categories/family.m3u"),
        IptvCategory("general", "General TV 📺", "Broad mix of general programming", "https://iptv-org.github.io/iptv/categories/general.m3u"),
        IptvCategory("lifestyle", "Lifestyle ✨", "Fashion, home, and wellbeing", "https://iptv-org.github.io/iptv/categories/lifestyle.m3u"),
        IptvCategory("outdoor", "Outdoor & Nature 🌲", "Fishing, hunting, and adventure", "https://iptv-org.github.io/iptv/categories/outdoor.m3u"),
        IptvCategory("religious", "Religious 🙏", "Faith-based and spiritual channels", "https://iptv-org.github.io/iptv/categories/religious.m3u"),
        IptvCategory("science", "Science & Tech 🔬", "Scientific discoveries and technology", "https://iptv-org.github.io/iptv/categories/science.m3u"),
        IptvCategory("travel", "Travel & World ✈️", "Global travel and world exploration", "https://iptv-org.github.io/iptv/categories/travel.m3u"),
        IptvCategory("weather", "Weather 🌦️", "Forecasts, radar, and climate", "https://iptv-org.github.io/iptv/categories/weather.m3u")
    )

    // 3. IPTV-Org Regions / Countries
    val regions = listOf(
        IptvCountry("in", "India", "🇮🇳", "https://iptv-org.github.io/iptv/countries/in.m3u"),
        IptvCountry("us", "United States", "🇺🇸", "https://iptv-org.github.io/iptv/countries/us.m3u"),
        IptvCountry("uk", "United Kingdom", "🇬🇧", "https://iptv-org.github.io/iptv/countries/uk.m3u"),
        IptvCountry("ca", "Canada", "🇨🇦", "https://iptv-org.github.io/iptv/countries/ca.m3u"),
        IptvCountry("ae", "United Arab Emirates", "🇦🇪", "https://iptv-org.github.io/iptv/countries/ae.m3u"),
        IptvCountry("sa", "Saudi Arabia", "🇸🇦", "https://iptv-org.github.io/iptv/countries/sa.m3u"),
        IptvCountry("au", "Australia", "🇦🇺", "https://iptv-org.github.io/iptv/countries/au.m3u"),
        IptvCountry("de", "Germany", "🇩🇪", "https://iptv-org.github.io/iptv/countries/de.m3u"),
        IptvCountry("fr", "France", "🇫🇷", "https://iptv-org.github.io/iptv/countries/fr.m3u"),
        IptvCountry("it", "Italy", "🇮🇹", "https://iptv-org.github.io/iptv/countries/it.m3u"),
        IptvCountry("es", "Spain", "🇪🇸", "https://iptv-org.github.io/iptv/countries/es.m3u"),
        IptvCountry("br", "Brazil", "🇧🇷", "https://iptv-org.github.io/iptv/countries/br.m3u"),
        IptvCountry("mx", "Mexico", "🇲🇽", "https://iptv-org.github.io/iptv/countries/mx.m3u"),
        IptvCountry("jp", "Japan", "🇯🇵", "https://iptv-org.github.io/iptv/countries/jp.m3u"),
        IptvCountry("kr", "South Korea", "🇰🇷", "https://iptv-org.github.io/iptv/countries/kr.m3u"),
        IptvCountry("pk", "Pakistan", "🇵🇰", "https://iptv-org.github.io/iptv/countries/pk.m3u"),
        IptvCountry("bd", "Bangladesh", "🇧🇩", "https://iptv-org.github.io/iptv/countries/bd.m3u"),
        IptvCountry("tr", "Turkey", "🇹🇷", "https://iptv-org.github.io/iptv/countries/tr.m3u"),
        IptvCountry("ru", "Russia", "🇷🇺", "https://iptv-org.github.io/iptv/countries/ru.m3u"),
        IptvCountry("nl", "Netherlands", "🇳🇱", "https://iptv-org.github.io/iptv/countries/nl.m3u"),
        IptvCountry("ch", "Switzerland", "🇨🇭", "https://iptv-org.github.io/iptv/countries/ch.m3u"),
        IptvCountry("sg", "Singapore", "🇸🇬", "https://iptv-org.github.io/iptv/countries/sg.m3u"),
        IptvCountry("nz", "New Zealand", "🇳🇿", "https://iptv-org.github.io/iptv/countries/nz.m3u"),
        IptvCountry("za", "South Africa", "🇿🇦", "https://iptv-org.github.io/iptv/countries/za.m3u"),
        IptvCountry("eg", "Egypt", "🇪🇬", "https://iptv-org.github.io/iptv/countries/eg.m3u")
    )

    fun getActiveUrl(): String {
        return prefs.getString("active_playlist_url", presets.first().url) ?: presets.first().url
    }

    fun setActiveUrl(url: String) {
        prefs.edit().putString("active_playlist_url", url).apply()
    }

    fun getActiveTitle(): String {
        return prefs.getString("active_playlist_title", "Free-TV Global Master") ?: "Free-TV Global Master"
    }

    fun setActiveTitle(title: String) {
        prefs.edit().putString("active_playlist_title", title).apply()
    }

    suspend fun loadPlaylist(url: String, forceReload: Boolean = false): List<Channel> = withContext(Dispatchers.IO) {
        val safeName = url.replace(Regex("[^a-zA-Z0-9]"), "_").take(50)
        val cacheFile = File(context.cacheDir, "playlist_${safeName}.m3u")

        if (!forceReload && cacheFile.exists() && cacheFile.length() > 0) {
            try {
                val cachedContent = cacheFile.readText()
                val parsed = M3UParser.parse(cachedContent)
                if (parsed.isNotEmpty()) {
                    return@withContext parsed
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        val request = Request.Builder()
            .url(url)
            .header("User-Agent", "Mozilla/5.0 (Linux; Android TV) BooBooTV/1.0")
            .build()

        val response = httpClient.newCall(request).execute()
        if (!response.isSuccessful) {
            throw Exception("Server returned ${response.code}: ${response.message}")
        }

        val content = response.body?.string() ?: throw Exception("Empty response body")
        try {
            cacheFile.writeText(content)
        } catch (e: Exception) {
            e.printStackTrace()
        }

        return@withContext M3UParser.parse(content)
    }

    fun getFavoriteIds(): Set<String> {
        return prefs.getStringSet("favorite_channel_ids", emptySet()) ?: emptySet()
    }

    fun toggleFavorite(channelId: String): Boolean {
        val current = getFavoriteIds().toMutableSet()
        val isFav: Boolean
        if (current.contains(channelId)) {
            current.remove(channelId)
            isFav = false
        } else {
            current.add(channelId)
            isFav = true
        }
        prefs.edit().putStringSet("favorite_channel_ids", current).apply()
        return isFav
    }

    fun getRecentChannels(): List<Channel> {
        val json = prefs.getString("recent_channels_json", null) ?: return emptyList()
        return try {
            val type = object : TypeToken<List<Channel>>() {}.type
            gson.fromJson(json, type) ?: emptyList()
        } catch (e: Exception) {
            emptyList()
        }
    }

    fun addRecentChannel(channel: Channel) {
        val current = getRecentChannels().toMutableList()
        current.removeAll { it.id == channel.id }
        current.add(0, channel)
        val trimmed = current.take(50)
        prefs.edit().putString("recent_channels_json", gson.toJson(trimmed)).apply()
    }

    fun extractCategories(channels: List<Channel>, favoriteCount: Int, recentCount: Int): List<Category> {
        val groupCounts = mutableMapOf<String, Int>()
        for (ch in channels) {
            val g = ch.group.ifEmpty { "General" }
            groupCounts[g] = (groupCounts[g] ?: 0) + 1
        }

        val result = mutableListOf<Category>()
        result.add(Category("__ALL__", "All Channels", channels.size))
        result.add(Category("__FAVORITES__", "★ Favorites", favoriteCount))
        result.add(Category("__RECENTS__", "🕒 Recent", recentCount))

        val sortedGroups = groupCounts.entries
            .sortedByDescending { it.value }
            .map { Category(it.key, it.key, it.value) }

        result.addAll(sortedGroups)
        return result
    }
}