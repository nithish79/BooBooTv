package com.openiptv.tv

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.KeyEvent
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.widget.doAfterTextChanged
import androidx.media3.ui.PlayerView
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import coil.load
import com.openiptv.tv.data.model.Channel
import com.openiptv.tv.data.model.HomeSection
import com.openiptv.tv.data.model.ScreenState
import com.openiptv.tv.player.TvAspectRatio
import com.openiptv.tv.player.TvPlayerManager
import com.openiptv.tv.player.VideoResolution
import com.openiptv.tv.ui.ChannelAdapter
import com.openiptv.tv.ui.FilterChipAdapter
import com.openiptv.tv.ui.TvFocusHelper
import com.openiptv.tv.viewmodel.TvViewModel

class MainActivity : AppCompatActivity(), TvPlayerManager.PlayerEventListener {

    private val viewModel: TvViewModel by viewModels()
    private lateinit var playerManager: TvPlayerManager

    // State
    private var currentScreenState = ScreenState.HOME

    // Splash Screen
    private lateinit var splashContainer: LinearLayout
    private lateinit var ivSplashMascot: ImageView

    // Home Screen Views
    private lateinit var homeScreenContainer: LinearLayout
    private lateinit var tvActiveSourceBadge: TextView
    private lateinit var btnHomeSearch: ImageButton
    private lateinit var btnHomeReload: ImageButton
    private lateinit var btnHomeSettings: ImageButton
    private lateinit var etHomeSearch: EditText
    private lateinit var btnNavPresets: Button
    private lateinit var btnNavGenres: Button
    private lateinit var btnNavRegions: Button
    private lateinit var btnNavFavorites: Button
    private lateinit var btnNavRecents: Button
    private lateinit var rvSubFilters: RecyclerView
    private lateinit var rvHomeChannels: RecyclerView
    private lateinit var tvHomeStatus: TextView

    // Adapters
    private lateinit var channelAdapter: ChannelAdapter
    private lateinit var filterChipAdapter: FilterChipAdapter

    // Player Screen Views
    private lateinit var playerContainer: View
    private lateinit var playerView: PlayerView
    private lateinit var bufferingContainer: LinearLayout
    private lateinit var tvBufferingText: TextView
    private lateinit var errorContainer: LinearLayout
    private lateinit var tvErrorMessage: TextView
    private lateinit var btnRetryStream: Button
    private lateinit var btnNextAlternative: Button
    private lateinit var btnBackToHome: Button

    // In-Player Interactive HUD Views
    private lateinit var playerControlsHud: LinearLayout
    private lateinit var tvOsdNumber: TextView
    private lateinit var ivOsdLogo: ImageView
    private lateinit var tvOsdName: TextView
    private lateinit var ivOsdFavorite: ImageView
    private lateinit var tvOsdCategory: TextView
    private lateinit var tvOsdQuality: TextView
    private lateinit var tvOsdSourceCount: TextView

    // HUD Action Buttons
    private lateinit var btnHudPlayPause: Button
    private lateinit var btnHudPrev: Button
    private lateinit var btnHudNext: Button
    private lateinit var btnHudAspect: Button
    private lateinit var btnHudSource: Button
    private lateinit var btnHudQuality: Button
    private lateinit var btnHudFavorite: Button
    private lateinit var btnHudHome: Button

    // Settings Overlay
    private lateinit var settingsOverlay: LinearLayout
    private lateinit var btnAspect16_9: Button
    private lateinit var btnAspect4_3: Button
    private lateinit var btnAspectFill: Button
    private lateinit var btnAspectZoom: Button
    private lateinit var btnAudioBoost100: Button
    private lateinit var btnAudioBoost150: Button
    private lateinit var btnAudioBoost200: Button
    private lateinit var btnCloseSettings: Button

    // Exit Dialog
    private lateinit var exitDialogOverlay: View
    private lateinit var btnCancelExit: Button
    private lateinit var btnConfirmExit: Button

    // Timers
    private val hudHandler = Handler(Looper.getMainLooper())
    private val hideHudRunnable = Runnable {
        playerControlsHud.visibility = View.GONE
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        initViews()
        initPlayer()
        initAdapters()
        initObservers()
        initClickListeners()
        setupSearchNavigationFlow()

        // Show cute Boo Boo TV Splash Screen on start
        showSplashScreen()
    }

    private fun showSplashScreen() {
        splashContainer.visibility = View.VISIBLE
        ivSplashMascot.animate()
            .scaleX(1.12f)
            .scaleY(1.12f)
            .setDuration(800)
            .withEndAction {
                ivSplashMascot.animate()
                    .scaleX(1.0f)
                    .scaleY(1.0f)
                    .setDuration(700)
                    .start()
            }
            .start()

        Handler(Looper.getMainLooper()).postDelayed({
            splashContainer.animate()
                .alpha(0f)
                .setDuration(400)
                .withEndAction {
                    splashContainer.visibility = View.GONE
                    switchToHomeScreen()
                }
                .start()
        }, 4000)
    }

    private fun initViews() {
        // Splash
        splashContainer = findViewById(R.id.splashContainer)
        ivSplashMascot = findViewById(R.id.ivSplashMascot)

        // Home Screen
        homeScreenContainer = findViewById(R.id.homeScreenContainer)
        tvActiveSourceBadge = findViewById(R.id.tvActiveSourceBadge)
        btnHomeSearch = findViewById(R.id.btnHomeSearch)
        btnHomeReload = findViewById(R.id.btnHomeReload)
        btnHomeSettings = findViewById(R.id.btnHomeSettings)
        etHomeSearch = findViewById(R.id.etHomeSearch)

        btnNavPresets = findViewById(R.id.btnNavPresets)
        btnNavGenres = findViewById(R.id.btnNavGenres)
        btnNavRegions = findViewById(R.id.btnNavRegions)
        btnNavFavorites = findViewById(R.id.btnNavFavorites)
        btnNavRecents = findViewById(R.id.btnNavRecents)
        rvSubFilters = findViewById(R.id.rvSubFilters)
        rvHomeChannels = findViewById(R.id.rvHomeChannels)
        tvHomeStatus = findViewById(R.id.tvHomeStatus)

        // Player Screen
        playerContainer = findViewById(R.id.playerContainer)
        playerView = findViewById(R.id.playerView)
        bufferingContainer = findViewById(R.id.bufferingContainer)
        tvBufferingText = findViewById(R.id.tvBufferingText)
        errorContainer = findViewById(R.id.errorContainer)
        tvErrorMessage = findViewById(R.id.tvErrorMessage)
        btnRetryStream = findViewById(R.id.btnRetryStream)
        btnNextAlternative = findViewById(R.id.btnNextAlternative)
        btnBackToHome = findViewById(R.id.btnBackToHome)

        // In-Player HUD
        playerControlsHud = findViewById(R.id.playerControlsHud)
        tvOsdNumber = findViewById(R.id.tvOsdNumber)
        ivOsdLogo = findViewById(R.id.ivOsdLogo)
        tvOsdName = findViewById(R.id.tvOsdName)
        ivOsdFavorite = findViewById(R.id.ivOsdFavorite)
        tvOsdCategory = findViewById(R.id.tvOsdCategory)
        tvOsdQuality = findViewById(R.id.tvOsdQuality)
        tvOsdSourceCount = findViewById(R.id.tvOsdSourceCount)

        btnHudPlayPause = findViewById(R.id.btnHudPlayPause)
        btnHudPrev = findViewById(R.id.btnHudPrev)
        btnHudNext = findViewById(R.id.btnHudNext)
        btnHudAspect = findViewById(R.id.btnHudAspect)
        btnHudSource = findViewById(R.id.btnHudSource)
        btnHudQuality = findViewById(R.id.btnHudQuality)
        btnHudFavorite = findViewById(R.id.btnHudFavorite)
        btnHudHome = findViewById(R.id.btnHudHome)

        // Settings Overlay
        settingsOverlay = findViewById(R.id.settingsOverlay)
        btnAspect16_9 = findViewById(R.id.btnAspect16_9)
        btnAspect4_3 = findViewById(R.id.btnAspect4_3)
        btnAspectFill = findViewById(R.id.btnAspectFill)
        btnAspectZoom = findViewById(R.id.btnAspectZoom)
        btnAudioBoost100 = findViewById(R.id.btnAudioBoost100)
        btnAudioBoost150 = findViewById(R.id.btnAudioBoost150)
        btnAudioBoost200 = findViewById(R.id.btnAudioBoost200)
        btnCloseSettings = findViewById(R.id.btnCloseSettings)

        // Exit Dialog
        exitDialogOverlay = findViewById(R.id.exitDialogOverlay)
        btnCancelExit = findViewById(R.id.btnCancelExit)
        btnConfirmExit = findViewById(R.id.btnConfirmExit)

        // Attach TV Remote Focus Animations
        listOf(
            btnHomeSearch, btnHomeReload, btnHomeSettings,
            btnNavPresets, btnNavGenres, btnNavRegions, btnNavFavorites, btnNavRecents,
            btnRetryStream, btnNextAlternative, btnBackToHome,
            btnHudPlayPause, btnHudPrev, btnHudNext, btnHudAspect,
            btnHudSource, btnHudQuality, btnHudFavorite, btnHudHome,
            btnAspect16_9, btnAspect4_3, btnAspectFill, btnAspectZoom,
            btnAudioBoost100, btnAudioBoost150, btnAudioBoost200, btnCloseSettings,
            btnCancelExit, btnConfirmExit
        ).forEach { TvFocusHelper.attachFocusAnimation(it, 1.05f) }
    }

    private fun initPlayer() {
        playerManager = TvPlayerManager(this, playerView, this)
    }

    private fun initAdapters() {
        // Channels Adapter
        channelAdapter = ChannelAdapter(
            onChannelClick = { channel, _ ->
                viewModel.selectChannel(channel)
                switchToPlayerScreen()
            },
            onChannelLongClick = { channel, _ ->
                val isFav = viewModel.toggleFavorite(channel.id)
                val msg = if (isFav) "Added to Favorites" else "Removed from Favorites"
                Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()
                true
            }
        )
        rvHomeChannels.layoutManager = LinearLayoutManager(this)
        rvHomeChannels.adapter = channelAdapter

        // Filter Chips Adapter
        filterChipAdapter = FilterChipAdapter { chip ->
            when (viewModel.activeSection.value ?: HomeSection.PRESETS) {
                HomeSection.PRESETS -> {
                    val preset = viewModel.presets.firstOrNull { it.id == chip.id }
                    if (preset != null) viewModel.selectPreset(preset)
                }
                HomeSection.GENRES -> {
                    val genre = viewModel.genres.firstOrNull { it.id == chip.id }
                    if (genre != null) viewModel.selectGenre(genre)
                }
                HomeSection.REGIONS -> {
                    val region = viewModel.regions.firstOrNull { it.code == chip.id }
                    if (region != null) viewModel.selectRegion(region)
                }
                else -> Unit
            }
            filterChipAdapter.selectedItemId = chip.id
            filterChipAdapter.notifyDataSetChanged()
        }
        rvSubFilters.layoutManager = LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, false)
        rvSubFilters.adapter = filterChipAdapter
    }

    private fun initObservers() {
        viewModel.displayedChannels.observe(this) { channels ->
            channelAdapter.submitList(channels) {
                val title = viewModel.activeSourceTitle.value ?: "Channels"
                tvActiveSourceBadge.text = "$title • ${channels.size} Ch"
            }
        }

        viewModel.activeSourceTitle.observe(this) { title ->
            val count = viewModel.displayedChannels.value?.size ?: 0
            tvActiveSourceBadge.text = "$title • $count Ch"
        }

        viewModel.activeSection.observe(this) { section ->
            updateSectionTabsUI(section)
            val chips = viewModel.getChipsForCurrentSection()
            filterChipAdapter.submitList(chips)
            filterChipAdapter.selectedItemId = viewModel.activeFilterChipId.value ?: ""
            filterChipAdapter.notifyDataSetChanged()
        }

        viewModel.activeFilterChipId.observe(this) { chipId ->
            filterChipAdapter.selectedItemId = chipId
            filterChipAdapter.notifyDataSetChanged()
        }

        viewModel.activeChannel.observe(this) { channel ->
            if (channel != null) {
                channelAdapter.activeChannelId = channel.id
                channelAdapter.notifyDataSetChanged()
                if (currentScreenState == ScreenState.PLAYER) {
                    playerManager.playChannel(channel)
                    updateHudChannelInfo(channel)
                }
            }
        }

        viewModel.favoriteIds.observe(this) { favs ->
            channelAdapter.favoriteIds = favs
            channelAdapter.notifyDataSetChanged()
            val active = viewModel.activeChannel.value
            if (active != null) {
                val isFav = favs.contains(active.id)
                ivOsdFavorite.visibility = if (isFav) View.VISIBLE else View.GONE
                btnHudFavorite.text = if (isFav) "★ Saved" else "☆ Star"
            }
        }

        viewModel.isLoading.observe(this) { loading ->
            if (currentScreenState == ScreenState.PLAYER) {
                bufferingContainer.visibility = if (loading) View.VISIBLE else View.GONE
                tvBufferingText.text = "Buffering live stream..."
            }
        }

        viewModel.errorMessage.observe(this) { err ->
            if (currentScreenState == ScreenState.PLAYER) {
                if (err != null) {
                    errorContainer.visibility = View.VISIBLE
                    tvErrorMessage.text = err
                } else {
                    errorContainer.visibility = View.GONE
                }
            }
        }
    }

    private fun initClickListeners() {
        // Section Navigation
        btnNavPresets.setOnClickListener { viewModel.selectSection(HomeSection.PRESETS) }
        btnNavGenres.setOnClickListener { viewModel.selectSection(HomeSection.GENRES) }
        btnNavRegions.setOnClickListener { viewModel.selectSection(HomeSection.REGIONS) }
        btnNavFavorites.setOnClickListener { viewModel.selectSection(HomeSection.FAVORITES) }
        btnNavRecents.setOnClickListener { viewModel.selectSection(HomeSection.RECENTS) }

        // Home Header
        btnHomeReload.setOnClickListener {
            viewModel.reloadCurrentPlaylist()
            Toast.makeText(this, "Reloading channels...", Toast.LENGTH_SHORT).show()
        }

        btnHomeSearch.setOnClickListener {
            if (etHomeSearch.visibility == View.VISIBLE) {
                etHomeSearch.visibility = View.GONE
                viewModel.setSearchQuery("")
            } else {
                etHomeSearch.visibility = View.VISIBLE
                etHomeSearch.requestFocus()
            }
        }

        etHomeSearch.doAfterTextChanged { text ->
            viewModel.setSearchQuery(text?.toString() ?: "")
        }

        btnHomeSettings.setOnClickListener {
            openSettings()
        }

        // Player Actions
        btnBackToHome.setOnClickListener {
            switchToHomeScreen()
        }

        btnRetryStream.setOnClickListener {
            errorContainer.visibility = View.GONE
            playerManager.retryCurrentStream()
        }

        btnNextAlternative.setOnClickListener {
            errorContainer.visibility = View.GONE
            playerManager.switchNextAlternative()
        }

        // In-Player HUD Interactive Buttons
        btnHudPlayPause.setOnClickListener {
            val isPlaying = playerManager.togglePlayPause()
            btnHudPlayPause.text = if (isPlaying) "⏸ Pause" else "▶ Play"
            resetHudTimer()
        }

        btnHudPrev.setOnClickListener {
            val prev = viewModel.prevChannel()
            if (prev != null) updateHudChannelInfo(prev)
            resetHudTimer()
        }

        btnHudNext.setOnClickListener {
            val next = viewModel.nextChannel()
            if (next != null) updateHudChannelInfo(next)
            resetHudTimer()
        }

        btnHudAspect.setOnClickListener {
            val nextAspect = playerManager.cycleAspectRatio()
            btnHudAspect.text = "Aspect: ${nextAspect.label}"
            Toast.makeText(this, "Aspect Ratio: ${nextAspect.label}", Toast.LENGTH_SHORT).show()
            resetHudTimer()
        }

        btnHudSource.setOnClickListener {
            val nextSourceIdx = playerManager.cycleSource()
            val total = playerManager.getAvailableSources().size
            btnHudSource.text = "Source: ${nextSourceIdx + 1}/$total"
            Toast.makeText(this, "Source ${nextSourceIdx + 1}/$total", Toast.LENGTH_SHORT).show()
            resetHudTimer()
        }

        btnHudQuality.setOnClickListener {
            val nextRes = playerManager.cycleResolution()
            btnHudQuality.text = "Res: ${nextRes.label}"
            Toast.makeText(this, "Max Resolution: ${nextRes.label}", Toast.LENGTH_SHORT).show()
            resetHudTimer()
        }

        btnHudFavorite.setOnClickListener {
            val active = viewModel.activeChannel.value
            if (active != null) {
                val isFav = viewModel.toggleFavorite(active.id)
                btnHudFavorite.text = if (isFav) "★ Saved" else "☆ Star"
                ivOsdFavorite.visibility = if (isFav) View.VISIBLE else View.GONE
            }
            resetHudTimer()
        }

        btnHudHome.setOnClickListener {
            switchToHomeScreen()
        }

        // Settings Buttons
        btnAspect16_9.setOnClickListener {
            playerManager.setTvAspectRatio(TvAspectRatio.FIT_16_9)
            highlightAspectButton(btnAspect16_9)
            btnHudAspect.text = "Aspect: 16:9"
        }
        btnAspect4_3.setOnClickListener {
            playerManager.setTvAspectRatio(TvAspectRatio.FIXED_4_3)
            highlightAspectButton(btnAspect4_3)
            btnHudAspect.text = "Aspect: 4:3"
        }
        btnAspectFill.setOnClickListener {
            playerManager.setTvAspectRatio(TvAspectRatio.STRETCH_FILL)
            highlightAspectButton(btnAspectFill)
            btnHudAspect.text = "Aspect: Stretch"
        }
        btnAspectZoom.setOnClickListener {
            playerManager.setTvAspectRatio(TvAspectRatio.ZOOM_CROP)
            highlightAspectButton(btnAspectZoom)
            btnHudAspect.text = "Aspect: Zoom"
        }

        btnAudioBoost100.setOnClickListener {
            playerManager.setAudioBoost(1.0f)
            highlightAudioButton(btnAudioBoost100)
        }
        btnAudioBoost150.setOnClickListener {
            playerManager.setAudioBoost(1.5f)
            highlightAudioButton(btnAudioBoost150)
        }
        btnAudioBoost200.setOnClickListener {
            playerManager.setAudioBoost(2.0f)
            highlightAudioButton(btnAudioBoost200)
        }

        btnCloseSettings.setOnClickListener {
            hideSettings()
        }

        // Exit Dialog Buttons
        btnCancelExit.setOnClickListener {
            hideExitDialog()
        }

        btnConfirmExit.setOnClickListener {
            playerManager.stopPlayback()
            finish()
        }
    }

    private fun setupSearchNavigationFlow() {
        // When in Search Bar, pressing DPAD_DOWN moves focus directly into Channel List
        etHomeSearch.setOnKeyListener { _, keyCode, event ->
            if (event.action == KeyEvent.ACTION_DOWN && keyCode == KeyEvent.KEYCODE_DPAD_DOWN) {
                if (channelAdapter.itemCount > 0) {
                    rvHomeChannels.requestFocus()
                    return@setOnKeyListener true
                }
            }
            false
        }

        // When in Channel List at top item, pressing DPAD_UP moves focus directly into Search Bar
        rvHomeChannels.setOnKeyListener { _, keyCode, event ->
            if (event.action == KeyEvent.ACTION_DOWN && keyCode == KeyEvent.KEYCODE_DPAD_UP) {
                val layoutManager = rvHomeChannels.layoutManager as? LinearLayoutManager
                if (layoutManager != null && etHomeSearch.visibility == View.VISIBLE) {
                    val firstVisible = layoutManager.findFirstCompletelyVisibleItemPosition()
                    if (firstVisible <= 0) {
                        etHomeSearch.requestFocus()
                        return@setOnKeyListener true
                    }
                }
            }
            false
        }
    }

    private fun updateSectionTabsUI(active: HomeSection) {
        val activeColor = resources.getColor(R.color.brand_focused, theme)
        val inactiveColor = resources.getColor(R.color.text_secondary, theme)

        btnNavPresets.setTextColor(if (active == HomeSection.PRESETS) activeColor else inactiveColor)
        btnNavGenres.setTextColor(if (active == HomeSection.GENRES) activeColor else inactiveColor)
        btnNavRegions.setTextColor(if (active == HomeSection.REGIONS) activeColor else inactiveColor)
        btnNavFavorites.setTextColor(if (active == HomeSection.FAVORITES) activeColor else inactiveColor)
        btnNavRecents.setTextColor(if (active == HomeSection.RECENTS) activeColor else inactiveColor)
    }

    private fun switchToHomeScreen() {
        currentScreenState = ScreenState.HOME

        // Fix: Immediately stop and silence player audio when leaving player!
        playerManager.stopPlayback()

        playerContainer.visibility = View.GONE
        playerControlsHud.visibility = View.GONE
        errorContainer.visibility = View.GONE
        bufferingContainer.visibility = View.GONE
        homeScreenContainer.visibility = View.VISIBLE

        rvHomeChannels.requestFocus()
    }

    private fun switchToPlayerScreen() {
        val channel = viewModel.activeChannel.value ?: return
        currentScreenState = ScreenState.PLAYER
        homeScreenContainer.visibility = View.GONE
        settingsOverlay.visibility = View.GONE
        exitDialogOverlay.visibility = View.GONE
        playerContainer.visibility = View.VISIBLE

        playerManager.playChannel(channel)
        btnHudPlayPause.text = "⏸ Pause"
        btnHudAspect.text = "Aspect: ${playerManager.getTvAspectRatio().label}"
        btnHudQuality.text = "Res: ${playerManager.getCurrentResolution().label}"

        showPlayerHud(channel)
    }

    private fun showPlayerHud(channel: Channel) {
        updateHudChannelInfo(channel)
        playerControlsHud.visibility = View.VISIBLE
        btnHudPlayPause.requestFocus()
        resetHudTimer()
    }

    private fun resetHudTimer() {
        hudHandler.removeCallbacks(hideHudRunnable)
        hudHandler.postDelayed(hideHudRunnable, 5500)
    }

    private fun updateHudChannelInfo(channel: Channel) {
        val channels = viewModel.displayedChannels.value ?: emptyList()
        val index = channels.indexOfFirst { it.id == channel.id }
        val formattedNumber = String.format("%02d", if (index >= 0) index + 1 else 1)
        tvOsdNumber.text = formattedNumber
        tvOsdName.text = channel.name

        val meta = if (channel.country.isNotEmpty()) {
            channel.group + " • " + channel.country
        } else {
            channel.group
        }
        tvOsdCategory.text = meta

        if (channel.quality.isNotEmpty()) {
            tvOsdQuality.visibility = View.VISIBLE
            tvOsdQuality.text = channel.quality
        } else {
            tvOsdQuality.visibility = View.GONE
        }

        val isFav = viewModel.favoriteIds.value?.contains(channel.id) == true
        ivOsdFavorite.visibility = if (isFav) View.VISIBLE else View.GONE
        btnHudFavorite.text = if (isFav) "★ Saved" else "☆ Star"

        if (channel.logo.isNotEmpty()) {
            ivOsdLogo.load(channel.logo) {
                crossfade(true)
                placeholder(R.drawable.ic_tv)
                error(R.drawable.ic_tv)
            }
        } else {
            ivOsdLogo.setImageResource(R.drawable.ic_tv)
        }

        val (curSource, totalSources) = playerManager.getCurrentSourceInfo()
        tvOsdSourceCount.text = "Source $curSource/$totalSources"
        btnHudSource.text = "Source: $curSource/$totalSources"
    }

    private fun showExitDialog() {
        exitDialogOverlay.visibility = View.VISIBLE
        btnCancelExit.requestFocus()
    }

    private fun hideExitDialog() {
        exitDialogOverlay.visibility = View.GONE
        if (currentScreenState == ScreenState.HOME) {
            rvHomeChannels.requestFocus()
        }
    }

    private fun openSettings() {
        settingsOverlay.visibility = View.VISIBLE
        btnAspect16_9.requestFocus()
    }

    private fun hideSettings() {
        settingsOverlay.visibility = View.GONE
        if (currentScreenState == ScreenState.HOME) {
            rvHomeChannels.requestFocus()
        }
    }

    private fun highlightAspectButton(selected: Button) {
        val colorActive = resources.getColor(R.color.brand_focused, theme)
        val colorInactive = resources.getColor(R.color.text_secondary, theme)
        listOf(btnAspect16_9, btnAspect4_3, btnAspectFill, btnAspectZoom).forEach {
            it.setTextColor(if (it == selected) colorActive else colorInactive)
        }
    }

    private fun highlightAudioButton(selected: Button) {
        val colorActive = resources.getColor(R.color.brand_focused, theme)
        val colorInactive = resources.getColor(R.color.text_secondary, theme)
        listOf(btnAudioBoost100, btnAudioBoost150, btnAudioBoost200).forEach {
            it.setTextColor(if (it == selected) colorActive else colorInactive)
        }
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        // 1. Exit Dialog Handling
        if (exitDialogOverlay.visibility == View.VISIBLE) {
            if (keyCode == KeyEvent.KEYCODE_BACK) {
                hideExitDialog()
                return true
            }
            return super.onKeyDown(keyCode, event)
        }

        // 2. Settings Overlay Handling
        if (settingsOverlay.visibility == View.VISIBLE) {
            if (keyCode == KeyEvent.KEYCODE_BACK) {
                hideSettings()
                return true
            }
            return super.onKeyDown(keyCode, event)
        }

        // 3. Fullscreen Video Player Mode
        if (currentScreenState == ScreenState.PLAYER) {
            when (keyCode) {
                // Rewind / Previous Channel
                KeyEvent.KEYCODE_MEDIA_REWIND,
                KeyEvent.KEYCODE_MEDIA_PREVIOUS,
                KeyEvent.KEYCODE_MEDIA_STEP_BACKWARD -> {
                    val prev = viewModel.prevChannel()
                    if (prev != null) updateHudChannelInfo(prev)
                    resetHudTimer()
                    return true
                }

                // Fast-Forward / Next Channel
                KeyEvent.KEYCODE_MEDIA_FAST_FORWARD,
                KeyEvent.KEYCODE_MEDIA_NEXT,
                KeyEvent.KEYCODE_MEDIA_STEP_FORWARD -> {
                    val next = viewModel.nextChannel()
                    if (next != null) updateHudChannelInfo(next)
                    resetHudTimer()
                    return true
                }

                // Arrow Keys & OK -> Activate/Focus In-Player HUD controls
                KeyEvent.KEYCODE_DPAD_UP,
                KeyEvent.KEYCODE_DPAD_DOWN,
                KeyEvent.KEYCODE_DPAD_LEFT,
                KeyEvent.KEYCODE_DPAD_RIGHT,
                KeyEvent.KEYCODE_DPAD_CENTER,
                KeyEvent.KEYCODE_ENTER -> {
                    if (playerControlsHud.visibility != View.VISIBLE) {
                        val active = viewModel.activeChannel.value
                        if (active != null) showPlayerHud(active)
                        return true
                    } else {
                        resetHudTimer()
                        // Normal D-pad focus between buttons
                        return super.onKeyDown(keyCode, event)
                    }
                }

                KeyEvent.KEYCODE_BACK -> {
                    if (playerControlsHud.visibility == View.VISIBLE) {
                        playerControlsHud.visibility = View.GONE
                        hudHandler.removeCallbacks(hideHudRunnable)
                        return true
                    }
                    // Return to Home Screen with previous filters preserved!
                    switchToHomeScreen()
                    return true
                }

                KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE,
                KeyEvent.KEYCODE_MEDIA_PLAY,
                KeyEvent.KEYCODE_MEDIA_PAUSE -> {
                    val isPlaying = playerManager.togglePlayPause()
                    btnHudPlayPause.text = if (isPlaying) "⏸ Pause" else "▶ Play"
                    return true
                }

                KeyEvent.KEYCODE_CHANNEL_UP -> {
                    val next = viewModel.nextChannel()
                    if (next != null) updateHudChannelInfo(next)
                    return true
                }

                KeyEvent.KEYCODE_CHANNEL_DOWN -> {
                    val prev = viewModel.prevChannel()
                    if (prev != null) updateHudChannelInfo(prev)
                    return true
                }
            }
            return super.onKeyDown(keyCode, event)
        }

        // 4. Home Screen Mode
        if (currentScreenState == ScreenState.HOME) {
            if (keyCode == KeyEvent.KEYCODE_BACK) {
                showExitDialog()
                return true
            }
        }

        return super.onKeyDown(keyCode, event)
    }

    override fun onBuffering(isBuffering: Boolean) {
        if (currentScreenState == ScreenState.PLAYER) {
            bufferingContainer.visibility = if (isBuffering) View.VISIBLE else View.GONE
            tvBufferingText.text = "Buffering live broadcast..."
        }
    }

    override fun onPlaying() {
        if (currentScreenState == ScreenState.PLAYER) {
            bufferingContainer.visibility = View.GONE
            errorContainer.visibility = View.GONE
        }
    }

    override fun onError(error: String, hasMoreAlternatives: Boolean) {
        if (currentScreenState == ScreenState.PLAYER) {
            bufferingContainer.visibility = View.GONE
            errorContainer.visibility = View.VISIBLE
            tvErrorMessage.text = "Playback error: $error"
            btnNextAlternative.visibility = if (hasMoreAlternatives) View.VISIBLE else View.GONE
        }
    }

    override fun onSourceSwitched(sourceIndex: Int, totalSources: Int) {
        tvOsdSourceCount.text = "Source ${sourceIndex + 1}/$totalSources"
        btnHudSource.text = "Source: ${sourceIndex + 1}/$totalSources"
    }

    override fun onVideoSizeChanged(width: Int, height: Int) {
        if (width > 0 && height > 0) {
            tvOsdQuality.visibility = View.VISIBLE
            tvOsdQuality.text = "${width}x${height}"
        }
    }

    override fun onPause() {
        super.onPause()
        if (currentScreenState == ScreenState.PLAYER) {
            playerManager.stopPlayback()
        }
    }

    override fun onStop() {
        super.onStop()
        playerManager.stopPlayback()
    }

    override fun onDestroy() {
        super.onDestroy()
        hudHandler.removeCallbacksAndMessages(null)
        playerManager.release()
    }
}