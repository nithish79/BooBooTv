package com.openiptv.tv.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.openiptv.tv.data.model.Category
import com.openiptv.tv.data.model.Channel
import com.openiptv.tv.data.model.FeaturedPreset
import com.openiptv.tv.data.model.HomeSection
import com.openiptv.tv.data.model.IptvCategory
import com.openiptv.tv.data.model.IptvCountry
import com.openiptv.tv.data.repository.PlaylistRepository
import com.openiptv.tv.ui.FilterChipItem
import kotlinx.coroutines.launch

class TvViewModel(application: Application) : AndroidViewModel(application) {

    private val repository = PlaylistRepository(application)

    val presets: List<FeaturedPreset> get() = repository.presets
    val genres: List<IptvCategory> get() = repository.genres
    val regions: List<IptvCountry> get() = repository.regions

    private val _activeSection = MutableLiveData<HomeSection>(HomeSection.PRESETS)
    val activeSection: LiveData<HomeSection> = _activeSection

    private val _activeFilterChipId = MutableLiveData<String>(presets.first().id)
    val activeFilterChipId: LiveData<String> = _activeFilterChipId

    private val _activeSourceTitle = MutableLiveData<String>("Free-TV Global Master")
    val activeSourceTitle: LiveData<String> = _activeSourceTitle

    private val _allChannels = MutableLiveData<List<Channel>>(emptyList())
    val allChannels: LiveData<List<Channel>> = _allChannels

    private val _displayedChannels = MutableLiveData<List<Channel>>(emptyList())
    val displayedChannels: LiveData<List<Channel>> = _displayedChannels

    private val _categories = MutableLiveData<List<Category>>(emptyList())
    val categories: LiveData<List<Category>> = _categories

    private val _activeChannel = MutableLiveData<Channel?>()
    val activeChannel: LiveData<Channel?> = _activeChannel

    private val _favoriteIds = MutableLiveData<Set<String>>(emptySet())
    val favoriteIds: LiveData<Set<String>> = _favoriteIds

    private val _isLoading = MutableLiveData<Boolean>(false)
    val isLoading: LiveData<Boolean> = _isLoading

    private val _errorMessage = MutableLiveData<String?>()
    val errorMessage: LiveData<String?> = _errorMessage

    private val _searchQuery = MutableLiveData<String>("")
    val searchQuery: LiveData<String> = _searchQuery

    private var currentLoadedUrl: String = repository.getActiveUrl()

    init {
        _favoriteIds.value = repository.getFavoriteIds()
        _activeSourceTitle.value = repository.getActiveTitle()
        loadPlaylist(currentLoadedUrl)
    }

    fun loadPlaylist(url: String, forceReload: Boolean = false, title: String? = null) {
        viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null
            currentLoadedUrl = url
            repository.setActiveUrl(url)
            if (title != null) {
                _activeSourceTitle.value = title
                repository.setActiveTitle(title)
            }

            try {
                val channels = repository.loadPlaylist(url, forceReload)
                _allChannels.value = channels
                updateCategoriesAndFilters(channels)

                val current = _activeChannel.value
                if (current == null || !channels.any { it.id == current.id }) {
                    _activeChannel.value = channels.firstOrNull()
                }
            } catch (e: Exception) {
                e.printStackTrace()
                _errorMessage.value = e.message ?: "Failed to load channels"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun selectSection(section: HomeSection) {
        _activeSection.value = section

        when (section) {
            HomeSection.PRESETS -> {
                val firstPreset = presets.first()
                _activeFilterChipId.value = firstPreset.id
                loadPlaylist(firstPreset.url, title = firstPreset.name)
            }
            HomeSection.GENRES -> {
                val firstGenre = genres.first()
                _activeFilterChipId.value = firstGenre.id
                loadPlaylist(firstGenre.url, title = firstGenre.name)
            }
            HomeSection.REGIONS -> {
                val firstRegion = regions.first()
                _activeFilterChipId.value = firstRegion.code
                loadPlaylist(firstRegion.url, title = firstRegion.flag + " " + firstRegion.name)
            }
            HomeSection.FAVORITES -> {
                _activeFilterChipId.value = "__FAVORITES__"
                _activeSourceTitle.value = "★ Favorite Channels"
                applyFilters()
            }
            HomeSection.RECENTS -> {
                _activeFilterChipId.value = "__RECENTS__"
                _activeSourceTitle.value = "🕒 Recently Watched"
                applyFilters()
            }
        }
    }

    fun selectPreset(preset: FeaturedPreset) {
        _activeFilterChipId.value = preset.id
        loadPlaylist(preset.url, title = preset.name)
    }

    fun selectGenre(genre: IptvCategory) {
        _activeFilterChipId.value = genre.id
        loadPlaylist(genre.url, title = genre.name)
    }

    fun selectRegion(country: IptvCountry) {
        _activeFilterChipId.value = country.code
        loadPlaylist(country.url, title = country.flag + " " + country.name)
    }

    fun getChipsForCurrentSection(): List<FilterChipItem> {
        return when (_activeSection.value ?: HomeSection.PRESETS) {
            HomeSection.PRESETS -> presets.map {
                FilterChipItem(it.id, it.name, it.badge, it.url)
            }
            HomeSection.GENRES -> genres.map {
                FilterChipItem(it.id, it.name, "", it.url)
            }
            HomeSection.REGIONS -> regions.map {
                FilterChipItem(it.code, it.flag + " " + it.name, "", it.url)
            }
            HomeSection.FAVORITES -> listOf(
                FilterChipItem("__FAVORITES__", "★ All Favorites", "${repository.getFavoriteIds().size}")
            )
            HomeSection.RECENTS -> listOf(
                FilterChipItem("__RECENTS__", "🕒 All Recent", "${repository.getRecentChannels().size}")
            )
        }
    }

    fun setSearchQuery(query: String) {
        _searchQuery.value = query
        applyFilters()
    }

    fun selectChannel(channel: Channel) {
        _activeChannel.value = channel
        repository.addRecentChannel(channel)
    }

    fun toggleFavorite(channelId: String): Boolean {
        val isFav = repository.toggleFavorite(channelId)
        val updated = repository.getFavoriteIds()
        _favoriteIds.value = updated

        if (_activeSection.value == HomeSection.FAVORITES) {
            applyFilters()
        }
        return isFav
    }

    fun nextChannel(): Channel? {
        val list = _displayedChannels.value ?: return null
        if (list.isEmpty()) return null
        val current = _activeChannel.value ?: return list.first()
        val idx = list.indexOfFirst { it.id == current.id }
        val nextIdx = if (idx == -1) 0 else (idx + 1) % list.size
        val next = list[nextIdx]
        selectChannel(next)
        return next
    }

    fun prevChannel(): Channel? {
        val list = _displayedChannels.value ?: return null
        if (list.isEmpty()) return null
        val current = _activeChannel.value ?: return list.last()
        val idx = list.indexOfFirst { it.id == current.id }
        val prevIdx = if (idx <= 0) list.size - 1 else idx - 1
        val prev = list[prevIdx]
        selectChannel(prev)
        return prev
    }

    fun reloadCurrentPlaylist() {
        loadPlaylist(currentLoadedUrl, forceReload = true)
    }

    private fun updateCategoriesAndFilters(channels: List<Channel>) {
        val favs = _favoriteIds.value ?: emptySet()
        val recents = repository.getRecentChannels()
        _categories.value = repository.extractCategories(channels, favs.size, recents.size)
        applyFilters()
    }

    private fun applyFilters() {
        val section = _activeSection.value ?: HomeSection.PRESETS
        val channels = _allChannels.value ?: emptyList()
        val query = (_searchQuery.value ?: "").trim().lowercase()
        val favs = _favoriteIds.value ?: emptySet()
        val recents = repository.getRecentChannels()

        val baseChannels = when (section) {
            HomeSection.FAVORITES -> channels.filter { favs.contains(it.id) }
            HomeSection.RECENTS -> recents
            else -> channels
        }

        val filtered = if (query.isEmpty()) {
            baseChannels
        } else {
            baseChannels.filter {
                it.name.lowercase().contains(query) ||
                it.group.lowercase().contains(query) ||
                it.country.lowercase().contains(query)
            }
        }

        _displayedChannels.value = filtered
    }
}