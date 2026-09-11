import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Channel } from '../types';
import { ChannelCard } from './ChannelCard';
import { Search, LayoutGrid, List, X, Tv } from 'lucide-react';

interface ChannelListProps {
  channels: Channel[];
  activeChannel: Channel | null;
  favoriteIds: Set<string>;
  searchQuery: string;
  selectedCategory: string;
  viewMode: 'grid' | 'list';
  onSearchChange: (q: string) => void;
  onSelectChannel: (c: Channel) => void;
  onToggleFavorite: (id: string) => void;
  onChangeViewMode: (m: 'grid' | 'list') => void;
}

const PAGE_SIZE = 60;

export const ChannelList: React.FC<ChannelListProps> = ({
  channels,
  activeChannel,
  favoriteIds,
  searchQuery,
  selectedCategory,
  viewMode,
  onSearchChange,
  onSelectChannel,
  onToggleFavorite,
  onChangeViewMode,
}) => {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  // Reset pagination when category or search changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    if (listContainerRef.current) {
      listContainerRef.current.scrollTop = 0;
    }
  }, [searchQuery, selectedCategory]);

  // Filter channels by Category and Search query
  const filteredChannels = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return channels.filter((ch) => {
      // Category filter
      if (selectedCategory === '__FAVORITES__') {
        if (!favoriteIds.has(ch.id)) return false;
      } else if (selectedCategory && selectedCategory !== '__ALL__') {
        if (ch.group !== selectedCategory) return false;
      }

      // Query filter
      if (!q) return true;
      return (
        ch.name.toLowerCase().includes(q) ||
        ch.group.toLowerCase().includes(q) ||
        ch.country.toLowerCase().includes(q)
      );
    });
  }, [channels, selectedCategory, searchQuery, favoriteIds]);

  // Paginated visible slice
  const visibleChannels = useMemo(() => {
    return filteredChannels.slice(0, visibleCount);
  }, [filteredChannels, visibleCount]);

  // Infinite scroll loader
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 400) {
      if (visibleCount < filteredChannels.length) {
        setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredChannels.length));
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-dark-950 border-r border-slate-800/80 overflow-hidden select-none">
      {/* Search & Top Action Bar */}
      <div className="p-3 border-b border-slate-800/80 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search 2,000+ channels... (/)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-dark-900 border border-slate-700/60 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/80 focus:ring-1 focus:ring-brand-500/80 transition"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-dark-900 border border-slate-700/60 rounded-xl p-0.5">
          <button
            onClick={() => onChangeViewMode('grid')}
            className={`p-1.5 rounded-lg transition ${
              viewMode === 'grid'
                ? 'bg-brand-500/20 text-brand-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => onChangeViewMode('list')}
            className={`p-1.5 rounded-lg transition ${
              viewMode === 'list'
                ? 'bg-brand-500/20 text-brand-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Compact List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Channel Count Bar */}
      <div className="px-3 py-1.5 bg-dark-900/40 border-b border-slate-800/40 flex items-center justify-between text-[11px] text-slate-400 font-medium">
        <span>
          {selectedCategory === '__FAVORITES__'
            ? 'Favorites'
            : selectedCategory === '__ALL__' || !selectedCategory
            ? 'All Channels'
            : selectedCategory}
        </span>
        <span>
          {filteredChannels.length} {filteredChannels.length === 1 ? 'channel' : 'channels'}
        </span>
      </div>

      {/* Scrollable Channels Container */}
      <div
        ref={listContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden p-3 custom-scrollbar"
      >
        {visibleChannels.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <Tv className="w-10 h-10 text-slate-600 mb-3" />
            <h4 className="text-sm font-semibold text-slate-200 mb-1">No channels found</h4>
            <p className="text-xs text-slate-500 max-w-xs mb-3">
              {searchQuery
                ? `No channels match "${searchQuery}".`
                : 'There are no channels in this category.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="px-3 py-1.5 bg-dark-800 hover:bg-dark-700 text-brand-400 text-xs rounded-lg border border-slate-700 transition"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2.5">
                {visibleChannels.map((channel) => (
                  <ChannelCard
                    key={channel.id}
                    channel={channel}
                    isActive={activeChannel?.id === channel.id}
                    isFavorite={favoriteIds.has(channel.id)}
                    viewMode="grid"
                    onSelect={onSelectChannel}
                    onToggleFavorite={onToggleFavorite}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {visibleChannels.map((channel) => (
                  <ChannelCard
                    key={channel.id}
                    channel={channel}
                    isActive={activeChannel?.id === channel.id}
                    isFavorite={favoriteIds.has(channel.id)}
                    viewMode="list"
                    onSelect={onSelectChannel}
                    onToggleFavorite={onToggleFavorite}
                  />
                ))}
              </div>
            )}

            {/* Load More Indicator */}
            {visibleCount < filteredChannels.length && (
              <div className="py-4 text-center">
                <button
                  onClick={() =>
                    setVisibleCount((prev) =>
                      Math.min(prev + PAGE_SIZE, filteredChannels.length)
                    )
                  }
                  className="px-4 py-1.5 text-xs text-slate-400 hover:text-white bg-dark-900 hover:bg-dark-800 border border-slate-800 rounded-lg transition"
                >
                  Load More ({filteredChannels.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
