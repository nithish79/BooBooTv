package com.openiptv.tv.ui

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.openiptv.tv.R
import com.openiptv.tv.data.model.Category

class CategoryAdapter(
    private val onCategoryClick: (Category) -> Unit
) : RecyclerView.Adapter<CategoryAdapter.CategoryViewHolder>() {

    private val categories = mutableListOf<Category>()
    var selectedCategoryId: String = "__ALL__"

    fun submitList(list: List<Category>) {
        categories.clear()
        categories.addAll(list)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CategoryViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_category, parent, false)
        return CategoryViewHolder(view)
    }

    override fun onBindViewHolder(holder: CategoryViewHolder, position: Int) {
        holder.bind(categories[position])
    }

    override fun getItemCount(): Int = categories.size

    inner class CategoryViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val ivIcon: ImageView = itemView.findViewById(R.id.ivCategoryIcon)
        private val tvName: TextView = itemView.findViewById(R.id.tvCategoryName)
        private val tvCount: TextView = itemView.findViewById(R.id.tvCategoryCount)

        init {
            TvFocusHelper.attachFocusAnimation(itemView, 1.04f)
            itemView.setOnClickListener {
                val pos = bindingAdapterPosition
                if (pos != RecyclerView.NO_POSITION) {
                    onCategoryClick(categories[pos])
                }
            }
        }

        fun bind(category: Category) {
            tvName.text = category.name
            tvCount.text = category.count.toString()

            val iconRes = when (category.id) {
                "__FAVORITES__" -> R.drawable.ic_star_filled
                "__RECENTS__" -> R.drawable.ic_recent
                else -> R.drawable.ic_tv
            }
            ivIcon.setImageResource(iconRes)

            itemView.isSelected = (category.id == selectedCategoryId)
        }
    }
}