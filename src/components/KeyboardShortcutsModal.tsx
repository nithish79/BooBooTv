import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'Space', desc: 'Play / Pause stream' },
  { key: 'F', desc: 'Toggle Fullscreen' },
  { key: 'P', desc: 'Toggle Picture-in-Picture' },
  { key: 'M', desc: 'Mute / Unmute audio' },
  { key: '↑ / ↓', desc: 'Increase / Decrease Volume' },
  { key: '[ / ]', desc: 'Previous / Next Channel' },
  { key: 'S', desc: 'Toggle Sidebar' },
  { key: '/', desc: 'Quick Focus Search' },
  { key: '?', desc: 'Show Keyboard Shortcuts' },
  { key: 'Esc', desc: 'Exit Fullscreen or close modal' },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="bg-dark-900 border border-slate-700/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-2 text-xs">
          {SHORTCUTS.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between p-2 rounded-xl bg-dark-950/60 border border-slate-800/80"
            >
              <span className="text-slate-300">{item.desc}</span>
              <kbd className="px-2.5 py-1 bg-dark-800 text-brand-400 font-mono text-xs font-semibold rounded-lg border border-slate-700 shadow-inner">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-dark-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
