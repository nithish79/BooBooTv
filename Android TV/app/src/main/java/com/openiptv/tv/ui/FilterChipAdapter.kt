package com.openiptv.tv.ui

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.openiptv.tv.R

data class FilterChipItem(
    val id: String,
    val title: String,
    val badge: String = "",
    val url: String = ""
)

class FilterChipAdapter(
    private val onChipClick: (FilterChipItem) -> Unit
) : RecyclerView.Adapter<FilterChipAdapter.FilterChipViewHolder>() {

    private val items = mutableListOf<FilterChipItem>()
    var selectedItemId: String = ""

    fun submitList(newItems: List<FilterChipItem>) {
        items.clear()
        items.addAll(newItems)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): FilterChipViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_filter_chip, parent, false)
        return FilterChipViewHolder(view)
    }

    override fun onBindViewHolder(holder: FilterChipViewHolder, position: Int) {
        holder.bind(items[position])
    }

    override fun getItemCount(): Int = items.size

    inner class FilterChipViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val tvTitle: TextView = itemView.findViewById(R.id.tvChipTitle)
        private val tvBadge: TextView = itemView.findViewById(R.id.tvChipBadge)

        init {
            TvFocusHelper.attachFocusAnimation(itemView, 1.06f)
            itemView.setOnClickListener {
                val pos = bindingAdapterPosition
                if (pos != RecyclerView.NO_POSITION) {
                    onChipClick(items[pos])
                }
            }
        }

        fun bind(item: FilterChipItem) {
            tvTitle.text = item.title

            if (item.badge.isNotEmpty()) {
                tvBadge.visibility = View.VISIBLE
                tvBadge.text = item.badge
            } else {
                tvBadge.visibility = View.GONE
            }

            itemView.isSelected = (item.id == selectedItemId)
        }
    }
}