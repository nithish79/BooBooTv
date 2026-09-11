import { useEffect } from 'react';

interface KeyboardActions {
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onTogglePiP: () => void;
  onVolumeUp: () => void;
  onVolumeDown: () => void;
  onPrevChannel: () => void;
  onNextChannel: () => void;
  onToggleSidebar: () => void;
  onFocusSearch: () => void;
  onToggleShortcutsModal: () => void;
}

export function useKeyboardShortcuts(actions: KeyboardActions, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          actions.onTogglePlay();
          break;
        case 'f':
          e.preventDefault();
          actions.onToggleFullscreen();
          break;
        case 'p':
          e.preventDefault();
          actions.onTogglePiP();
          break;
        case 'm':
          e.preventDefault();
          actions.onToggleMute();
          break;
        case 'arrowup':
          e.preventDefault();
          actions.onVolumeUp();
          break;
        case 'arrowdown':
          e.preventDefault();
          actions.onVolumeDown();
          break;
        case '[':
        case 'pageup':
        case 'channeldown':
          e.preventDefault();
          actions.onPrevChannel();
          break;
        case ']':
        case 'pagedown':
        case 'channelup':
          e.preventDefault();
          actions.onNextChannel();
          break;
        case 'mediaplaypause':
        case 'mediaplay':
        case 'mediapause':
          e.preventDefault();
          actions.onTogglePlay();
          break;
        case 's':
          e.preventDefault();
          actions.onToggleSidebar();
          break;
        case '/':
          e.preventDefault();
          actions.onFocusSearch();
          break;
        case '?':
          e.preventDefault();
          actions.onToggleShortcutsModal();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions, enabled]);
}
