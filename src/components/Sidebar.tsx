import React, { useState } from 'react';
import { GroupInfo } from '../types';
import {
  Tv,
  Star,
  Clock,
  Globe2,
  ChevronRight,
  Search,
  X,
  Radio,
} from 'lucide-react';

interface SidebarProps {
  groups: GroupInfo[];
  totalChannels: number;
  selectedCategory: string;
  favoritesCount: number;
  recentsCount: number;
  isOpen: boolean;
  onSelectCategory: (category: string) => void;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  groups,
  totalChannels,
  selectedCategory,
  favoritesCount,
  recentsCount,
  isOpen,
  onSelectCategory,
  onCloseMobile,
}) => {
  const [categorySearch, setCategorySearch] = useState('');

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(categorySearch.toLowerCase().trim())
  );

  if (!isOpen) return null;

  return (
    <aside className="w-64 bg-dark-900 border-r border-slate-800/80 flex flex-col h-full select-none flex-shrink-0 z-30 transition-all duration-200">
      {/* Primary Navigation Sections */}
      <div className="p-3 border-b border-slate-800/80 space-y-1">
        <button
          onClick={() => onSelectCategory('__ALL__')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
            selectedCategory === '__ALL__' || !selectedCategory
              ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-dark-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Tv className="w-4 h-4 text-brand-400" />
            <span>All Channels</span>
          </div>
          <span className="text-[10px] bg-dark-950/80 text-slate-400 px-2 py-0.5 rounded-full font-mono">
            {totalChannels}
          </span>
        </button>

        <button
          onClick={() => onSelectCategory('__FAVORITES__')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
            selectedCategory === '__FAVORITES__'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-dark-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400/20" />
            <span>Favorites</span>
          </div>
          <span className="text-[10px] bg-dark-950/80 text-slate-400 px-2 py-0.5 rounded-full font-mono">
            {favoritesCount}
          </span>
        </button>

        <button
          onClick={() => onSelectCategory('__RECENT__')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
            selectedCategory === '__RECENT__'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-dark-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-purple-400" />
            <span>Recent</span>
          </div>
          <span className="text-[10px] bg-dark-950/80 text-slate-400 px-2 py-0.5 rounded-full font-mono">
            {recentsCount}
          </span>
        </button>
      </div>

      {/* Country / Group Section Header with Search */}
      <div className="px-3 pt-3 pb-2 flex flex-col gap-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <Globe2 className="w-3.5 h-3.5 text-brand-400" />
            <span>Countries ({groups.length})</span>
          </div>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter countries..."
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            className="w-full bg-dark-950/70 border border-slate-800 rounded-lg pl-8 pr-7 py-1 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-slate-600 transition"
          />
          {categorySearch && (
            <button
              onClick={() => setCategorySearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Category List */}
      <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5 custom-scrollbar">
        {filteredGroups.map((group) => {
          const isSelected = selectedCategory === group.name;
          return (
            <button
              key={group.name}
              onClick={() => onSelectCategory(group.name)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
                isSelected
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-dark-800/60'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <ChevronRight
                  className={`w-3 h-3 text-slate-500 transition-transform ${
                    isSelected ? 'rotate-90 text-brand-400' : ''
                  }`}
                />
                <span className="truncate">{group.name}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono flex-shrink-0 ml-2">
                {group.count}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
