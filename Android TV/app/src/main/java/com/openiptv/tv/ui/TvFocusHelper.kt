package com.openiptv.tv.ui

import android.view.View

object TvFocusHelper {

    fun attachFocusAnimation(view: View, scale: Float = 1.05f) {
        view.setOnFocusChangeListener { v, hasFocus ->
            if (hasFocus) {
                v.animate()
                    .scaleX(scale)
                    .scaleY(scale)
                    .translationZ(8f)
                    .setDuration(150)
                    .start()
            } else {
                v.animate()
                    .scaleX(1.0f)
                    .scaleY(1.0f)
                    .translationZ(0f)
                    .setDuration(150)
                    .start()
            }
        }
    }
}