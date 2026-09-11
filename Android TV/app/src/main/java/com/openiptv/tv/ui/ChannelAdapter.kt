package com.openiptv.tv.ui

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import coil.load
import com.openiptv.tv.R
import com.openiptv.tv.data.model.Channel

class ChannelAdapter(
    private val onChannelClick: (Channel, Int) -> Unit,
    private val onChannelLongClick: (Channel, Int) -> Boolean
) : ListAdapter<Channel, ChannelAdapter.ChannelViewHolder>(ChannelDiffCallback()) {

    var activeChannelId: String? = null
    var favoriteIds: Set<String> = emptySet()

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ChannelViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_channel_card, parent, false)
        return ChannelViewHolder(view)
    }

    override fun onBindViewHolder(holder: ChannelViewHolder, position: Int) {
        holder.bind(getItem(position), position)
    }

    inner class ChannelViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val tvNumber: TextView = itemView.findViewById(R.id.tvChannelNumber)
        private val ivLogo: ImageView = itemView.findViewById(R.id.ivChannelLogo)
        private val tvName: TextView = itemView.findViewById(R.id.tvChannelName)
        private val tvCategory: TextView = itemView.findViewById(R.id.tvChannelCategory)
        private val tvQuality: TextView = itemView.findViewById(R.id.tvQualityBadge)
        private val ivFavorite: ImageView = itemView.findViewById(R.id.ivFavorite)

        init {
            TvFocusHelper.attachFocusAnimation(itemView, 1.04f)

            itemView.setOnClickListener {
                val pos = bindingAdapterPosition
                if (pos != RecyclerView.NO_POSITION) {
                    onChannelClick(getItem(pos), pos)
                }
            }

            itemView.setOnLongClickListener {
                val pos = bindingAdapterPosition
                if (pos != RecyclerView.NO_POSITION) {
                    onChannelLongClick(getItem(pos), pos)
                } else {
                    false
                }
            }
        }

        fun bind(channel: Channel, position: Int) {
            val formattedNumber = String.format("%02d", position + 1)
            tvNumber.text = formattedNumber
            tvName.text = channel.name

            val metaText = if (channel.country.isNotEmpty()) {
                channel.group + " • " + channel.country
            } else {
                channel.group
            }
            tvCategory.text = metaText

            if (channel.quality.isNotEmpty()) {
                tvQuality.visibility = View.VISIBLE
                tvQuality.text = channel.quality
            } else {
                tvQuality.visibility = View.GONE
            }

            val isFav = favoriteIds.contains(channel.id)
            ivFavorite.setImageResource(if (isFav) R.drawable.ic_star_filled else R.drawable.ic_star_outline)

            if (channel.logo.isNotEmpty()) {
                ivLogo.load(channel.logo) {
                    crossfade(true)
                    placeholder(R.drawable.ic_tv)
                    error(R.drawable.ic_tv)
                }
            } else {
                ivLogo.setImageResource(R.drawable.ic_tv)
            }

            itemView.isSelected = (channel.id == activeChannelId)
        }
    }

    class ChannelDiffCallback : DiffUtil.ItemCallback<Channel>() {
        override fun areItemsTheSame(oldItem: Channel, newItem: Channel): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: Channel, newItem: Channel): Boolean {
            return oldItem == newItem
        }
    }
}