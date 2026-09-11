package com.openiptv.tv.player

import android.content.Context
import android.net.Uri
import androidx.annotation.OptIn
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DefaultDataSource
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.exoplayer.DefaultLoadControl
import androidx.media3.exoplayer.DefaultRenderersFactory
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import com.openiptv.tv.data.model.Channel

enum class TvAspectRatio(val label: String, val mode: Int) {
    FIT_16_9("16:9 (Fit)", AspectRatioFrameLayout.RESIZE_MODE_FIT),
    STRETCH_FILL("Stretch (Fill)", AspectRatioFrameLayout.RESIZE_MODE_FILL),
    ZOOM_CROP("Zoom (Crop)", AspectRatioFrameLayout.RESIZE_MODE_ZOOM),
    FIXED_4_3("4:3", AspectRatioFrameLayout.RESIZE_MODE_FIXED_WIDTH)
}

enum class VideoResolution(val label: String, val maxVertical: Int) {
    AUTO("Auto", Int.MAX_VALUE),
    FHD_1080("1080p", 1080),
    HD_720("720p", 720),
    SD_480("480p", 480),
    LOW_360("360p", 360)
}

@OptIn(UnstableApi::class)
class TvPlayerManager(
    private val context: Context,
    private val playerView: PlayerView,
    private val listener: PlayerEventListener
) {

    interface PlayerEventListener {
        fun onBuffering(isBuffering: Boolean)
        fun onPlaying()
        fun onError(error: String, hasMoreAlternatives: Boolean)
        fun onSourceSwitched(sourceIndex: Int, totalSources: Int)
        fun onVideoSizeChanged(width: Int, height: Int)
    }

    private var exoPlayer: ExoPlayer? = null
    private var currentChannel: Channel? = null
    private var currentSourceIndex: Int = 0
    private var currentAspectRatio = TvAspectRatio.FIT_16_9
    private var currentResolution = VideoResolution.AUTO

    init {
        setupPlayer()
    }

    private fun setupPlayer() {
        val userAgent = "Mozilla/5.0 (Linux; Android 14; Android TV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

        val defaultHeaders = HashMap<String, String>()
        defaultHeaders["Accept"] = "*/*"
        defaultHeaders["Sec-Fetch-Mode"] = "cors"

        val httpDataSourceFactory = DefaultHttpDataSource.Factory()
            .setUserAgent(userAgent)
            .setAllowCrossProtocolRedirects(true)
            .setConnectTimeoutMs(12000)
            .setReadTimeoutMs(15000)
            .setDefaultRequestProperties(defaultHeaders)

        val dataSourceFactory = DefaultDataSource.Factory(context, httpDataSourceFactory)

        val loadControl = DefaultLoadControl.Builder()
            .setBufferDurationsMs(
                2000,   // Min buffer (fast TV zap start)
                15000,  // Max buffer
                1000,   // Buffer for playback
                1500    // Buffer for rebuffering
            )
            .build()

        val renderersFactory = DefaultRenderersFactory(context)
            .setExtensionRendererMode(DefaultRenderersFactory.EXTENSION_RENDERER_MODE_PREFER)

        val mediaSourceFactory = DefaultMediaSourceFactory(dataSourceFactory)

        exoPlayer = ExoPlayer.Builder(context, renderersFactory)
            .setLoadControl(loadControl)
            .setMediaSourceFactory(mediaSourceFactory)
            .build()
            .apply {
                playWhenReady = true
                addListener(object : Player.Listener {
                    override fun onPlaybackStateChanged(playbackState: Int) {
                        when (playbackState) {
                            Player.STATE_BUFFERING -> listener.onBuffering(true)
                            Player.STATE_READY -> {
                                listener.onBuffering(false)
                                listener.onPlaying()
                            }
                            Player.STATE_ENDED -> listener.onBuffering(false)
                            Player.STATE_IDLE -> Unit
                        }
                    }

                    override fun onPlayerError(error: PlaybackException) {
                        listener.onBuffering(false)
                        val channel = currentChannel
                        if (channel != null && currentSourceIndex + 1 < channel.alternatives.size) {
                            currentSourceIndex++
                            listener.onSourceSwitched(currentSourceIndex, channel.alternatives.size)
                            playStreamUrl(channel.alternatives[currentSourceIndex])
                        } else {
                            listener.onError(error.message ?: "Stream error", false)
                        }
                    }

                    override fun onVideoSizeChanged(videoSize: androidx.media3.common.VideoSize) {
                        listener.onVideoSizeChanged(videoSize.width, videoSize.height)
                    }
                })
            }

        playerView.player = exoPlayer
        playerView.resizeMode = currentAspectRatio.mode
    }

    fun playChannel(channel: Channel) {
        currentChannel = channel
        currentSourceIndex = 0
        val urls = channel.alternatives.ifEmpty { listOf(channel.url) }
        listener.onSourceSwitched(currentSourceIndex, urls.size)
        playStreamUrl(urls[0])
    }

    fun stopPlayback() {
        exoPlayer?.stop()
        exoPlayer?.clearMediaItems()
    }

    fun retryCurrentStream() {
        val channel = currentChannel ?: return
        val urls = channel.alternatives.ifEmpty { listOf(channel.url) }
        playStreamUrl(urls[currentSourceIndex])
    }

    fun selectSourceIndex(index: Int) {
        val channel = currentChannel ?: return
        val urls = channel.alternatives.ifEmpty { listOf(channel.url) }
        if (index in urls.indices) {
            currentSourceIndex = index
            listener.onSourceSwitched(currentSourceIndex, urls.size)
            playStreamUrl(urls[currentSourceIndex])
        }
    }

    fun cycleSource(): Int {
        val channel = currentChannel ?: return 0
        val urls = channel.alternatives.ifEmpty { listOf(channel.url) }
        if (urls.size <= 1) return 0
        currentSourceIndex = (currentSourceIndex + 1) % urls.size
        listener.onSourceSwitched(currentSourceIndex, urls.size)
        playStreamUrl(urls[currentSourceIndex])
        return currentSourceIndex
    }

    fun switchNextAlternative(): Boolean {
        val channel = currentChannel ?: return false
        val urls = channel.alternatives.ifEmpty { listOf(channel.url) }
        if (currentSourceIndex + 1 < urls.size) {
            currentSourceIndex++
            listener.onSourceSwitched(currentSourceIndex, urls.size)
            playStreamUrl(urls[currentSourceIndex])
            return true
        }
        return false
    }

    private fun playStreamUrl(url: String) {
        val player = exoPlayer ?: return
        listener.onBuffering(true)

        val mediaItem = MediaItem.Builder()
            .setUri(Uri.parse(url))
            .build()

        player.setMediaItem(mediaItem)
        player.prepare()
        player.play()
    }

    fun togglePlayPause(): Boolean {
        val player = exoPlayer ?: return false
        return if (player.isPlaying) {
            player.pause()
            false
        } else {
            player.play()
            true
        }
    }

    fun isPlaying(): Boolean = exoPlayer?.isPlaying == true

    // Aspect Ratio
    fun cycleAspectRatio(): TvAspectRatio {
        val values = TvAspectRatio.values()
        val nextIndex = (currentAspectRatio.ordinal + 1) % values.size
        setTvAspectRatio(values[nextIndex])
        return currentAspectRatio
    }

    fun setTvAspectRatio(ratio: TvAspectRatio) {
        currentAspectRatio = ratio
        playerView.resizeMode = ratio.mode
    }

    fun getTvAspectRatio(): TvAspectRatio = currentAspectRatio

    // Resolution / Quality
    fun cycleResolution(): VideoResolution {
        val values = VideoResolution.values()
        val nextIndex = (currentResolution.ordinal + 1) % values.size
        setResolution(values[nextIndex])
        return currentResolution
    }

    fun setResolution(res: VideoResolution) {
        currentResolution = res
        val player = exoPlayer ?: return
        player.trackSelectionParameters = player.trackSelectionParameters
            .buildUpon()
            .setMaxVideoSize(Int.MAX_VALUE, res.maxVertical)
            .build()
    }

    fun getCurrentResolution(): VideoResolution = currentResolution

    fun setAudioBoost(factor: Float) {
        exoPlayer?.volume = factor
    }

    fun release() {
        exoPlayer?.release()
        exoPlayer = null
    }

    fun getCurrentSourceInfo(): Pair<Int, Int> {
        val count = currentChannel?.alternatives?.size ?: 1
        return Pair(currentSourceIndex + 1, count.coerceAtLeast(1))
    }

    fun getAvailableSources(): List<String> {
        return currentChannel?.alternatives?.ifEmpty { listOf(currentChannel?.url ?: "") } ?: emptyList()
    }
}