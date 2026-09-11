package com.openiptv.tv.ui

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.openiptv.tv.R
import com.openiptv.tv.data.model.FeaturedPreset

class PresetAdapter(
    private val presets: List<FeaturedPreset>,
    private val onPresetClick: (FeaturedPreset) -> Unit
) : RecyclerView.Adapter<PresetAdapter.PresetViewHolder>() {

    var activePresetUrl: String = ""

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PresetViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_preset, parent, false)
        return PresetViewHolder(view)
    }

    override fun onBindViewHolder(holder: PresetViewHolder, position: Int) {
        holder.bind(presets[position])
    }

    override fun getItemCount(): Int = presets.size

    inner class PresetViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val ivIcon: ImageView = itemView.findViewById(R.id.ivPresetIcon)
        private val tvName: TextView = itemView.findViewById(R.id.tvPresetName)
        private val tvDesc: TextView = itemView.findViewById(R.id.tvPresetDescription)
        private val tvBadge: TextView = itemView.findViewById(R.id.tvPresetBadge)

        init {
            TvFocusHelper.attachFocusAnimation(itemView, 1.04f)
            itemView.setOnClickListener {
                val pos = bindingAdapterPosition
                if (pos != RecyclerView.NO_POSITION) {
                    onPresetClick(presets[pos])
                }
            }
        }

        fun bind(preset: FeaturedPreset) {
            tvName.text = preset.name
            tvDesc.text = preset.description
            tvBadge.text = preset.badge
            tvBadge.visibility = if (preset.badge.isNotEmpty()) View.VISIBLE else View.GONE
            ivIcon.setImageResource(R.drawable.ic_presets)

            itemView.isSelected = (preset.url == activePresetUrl)
        }
    }
}