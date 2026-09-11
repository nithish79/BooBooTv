import React, { useState, useEffect, useRef } from 'react';
import {
  FeaturedPreset,
  IptvCategory,
  IptvCountry,
  IptvOrgCatalog,
  PlaylistData,
} from '../types';
import { parseClientM3U } from '../utils/m3uParser';
import {
  Sparkles,
  Layers,
  Globe,
  Link as LinkIcon,
  Upload,
  Search,
  Check,
  Trophy,
  Film,
  Newspaper,
  Music,
  Tv,
  LayoutGrid,
  Loader2,
  X,
  AlertCircle,
} from 'lucide-react';

interface IptvOrgBrowserProps {
  currentUrl: string;
  onSelectPlaylist: (url: string, name?: string) => void;
  onLoadCustomData: (data: PlaylistData) => void;
  onClose: () => void;
}

export const IptvOrgBrowser: React.FC<IptvOrgBrowserProps> = ({
  currentUrl,
  onSelectPlaylist,
  onLoadCustomData,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'featured' | 'categories' | 'countries' | 'custom'>('featured');
  const [catalog, setCatalog] = useState<IptvOrgCatalog | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Search queries
  const [categorySearch, setCategorySearch] = useState('');
  const [countrySearch, setCountrySearch] = useState('');

  // Custom URL & File
  const [customUrl, setCustomUrl] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/iptv-org/catalog')
      .then((r) => r.json())
      .then((data: IptvOrgCatalog) => {
        setCatalog(data);
      })
      .catch((err) => {
        console.error('Failed to load iptv-org catalog:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const getPresetIcon = (icon: string) => {
    switch (icon) {
      case 'trophy': return <Trophy className="w-5 h-5 text-amber-400" />;
      case 'film': return <Film className="w-5 h-5 text-rose-400" />;
      case 'newspaper': return <Newspaper className="w-5 h-5 text-sky-400" />;
      case 'music': return <Music className="w-5 h-5 text-emerald-400" />;
      case 'layout-grid': return <LayoutGrid className="w-5 h-5 text-purple-400" />;
      case 'globe': return <Globe className="w-5 h-5 text-indigo-400" />;
      default: return <Tv className="w-5 h-5 text-brand-400" />;
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customUrl.trim();
    if (!trimmed) {
      setCustomError('Please enter a valid playlist URL.');
      return;
    }
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setCustomError('URL must start with http:// or https://');
      return;
    }
    setCustomError(null);
    onSelectPlaylist(trimmed, 'Custom URL');
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCustomError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text.includes('#EXTM3U') && !text.includes('#EXTINF')) {
          throw new Error('Selected file is not a valid M3U/M3U8 playlist.');
        }
        const parsed = parseClientM3U(text, file.name);
        onLoadCustomData(parsed);
        onClose();
      } catch (err: any) {
        setCustomError(err.message || 'Failed to parse file.');
      }
    };
    reader.onerror = () => setCustomError('Failed to read file.');
    reader.readAsText(file);
  };

  const filteredCategories = catalog?.categories.filter((c) =>
    c.name.toLowerCase().includes(categorySearch.toLowerCase().trim())
  ) || [];

  const filteredCountries = catalog?.countries.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase().trim()) ||
    c.code.toLowerCase().includes(countrySearch.toLowerCase().trim())
  ) || [];

  return (
    <div className="flex flex-col h-full overflow-hidden text-xs">
      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 bg-dark-950/40 p-1 gap-1">
        <button
          onClick={() => setActiveTab('featured')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-semibold transition ${
            activeTab === 'featured'
              ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-dark-800/60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Curated Presets</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-semibold transition ${
            activeTab === 'categories'
              ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-dark-800/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Genres ({catalog?.categories.length || 30})</span>
        </button>

        <button
          onClick={() => setActiveTab('countries')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-semibold transition ${
            activeTab === 'countries'
              ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-dark-800/60'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Countries (240+)</span>
        </button>

        <button
          onClick={() => setActiveTab('custom')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-semibold transition ${
            activeTab === 'custom'
              ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-dark-800/60'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" />
          <span>Custom / File</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar min-h-[380px] max-h-[500px]">
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
            <span className="text-xs">Loading IPTV-Org database...</span>
          </div>
        ) : (
          <>
            {/* FEATURED PRESETS TAB */}
            {activeTab === 'featured' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {catalog?.featured.map((item: FeaturedPreset) => {
                  const isActive = currentUrl === item.url;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        onSelectPlaylist(item.url, item.name);
                        onClose();
                      }}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start justify-between group ${
                        isActive
                          ? 'bg-brand-500/15 border-brand-500/60 text-white shadow-md shadow-brand-500/5'
                          : 'bg-dark-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-dark-850'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="p-2.5 rounded-xl bg-dark-900 border border-slate-800 group-hover:scale-105 transition flex-shrink-0">
                          {getPresetIcon(item.icon)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-bold text-xs text-white truncate">
                              {item.name}
                            </span>
                            {item.badge && (
                              <span className="text-[9px] bg-brand-500/20 text-brand-300 font-bold px-1.5 py-0.2 rounded font-mono flex-shrink-0">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {isActive && (
                        <div className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center text-dark-950 flex-shrink-0 ml-2">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* CATEGORIES TAB */}
            {activeTab === 'categories' && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search genres (Sports, Movies, News, Kids...)"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="w-full bg-dark-950 border border-slate-800 rounded-xl pl-8 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
                  />
                  {categorySearch && (
                    <button
                      onClick={() => setCategorySearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {filteredCategories.map((cat: IptvCategory) => {
                    const isActive = currentUrl === cat.url;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          onSelectPlaylist(cat.url, `IPTV-Org: ${cat.name}`);
                          onClose();
                        }}
                        className={`text-left p-3 rounded-xl border transition flex items-center justify-between group ${
                          isActive
                            ? 'bg-brand-500/15 border-brand-500/60 text-white'
                            : 'bg-dark-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-dark-850'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-semibold text-xs text-white truncate">
                            {cat.name}
                          </div>
                          {cat.description && (
                            <div className="text-[10px] text-slate-500 truncate mt-0.5">
                              {cat.description}
                            </div>
                          )}
                        </div>
                        {isActive ? (
                          <div className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center text-dark-950 flex-shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 group-hover:text-brand-400 font-mono">
                            Load →
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* COUNTRIES TAB */}
            {activeTab === 'countries' && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search 240+ countries (India, United States, United Kingdom, France...)"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    className="w-full bg-dark-950 border border-slate-800 rounded-xl pl-8 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
                  />
                  {countrySearch && (
                    <button
                      onClick={() => setCountrySearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {filteredCountries.map((c: IptvCountry) => {
                    const isActive = currentUrl === c.url;
                    return (
                      <button
                        key={c.code}
                        onClick={() => {
                          onSelectPlaylist(c.url, `IPTV-Org: ${c.name} ${c.flag}`);
                          onClose();
                        }}
                        className={`text-left p-2.5 rounded-xl border transition flex items-center justify-between group ${
                          isActive
                            ? 'bg-brand-500/15 border-brand-500/60 text-white'
                            : 'bg-dark-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-dark-850'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-1">
                          <span className="text-base flex-shrink-0">{c.flag}</span>
                          <div className="min-w-0">
                            <span className="font-semibold text-xs text-white truncate block">
                              {c.name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {c.code}
                            </span>
                          </div>
                        </div>

                        {isActive && (
                          <div className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center text-dark-950 flex-shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CUSTOM / FILE TAB */}
            {activeTab === 'custom' && (
              <div className="space-y-5">
                {customError && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{customError}</span>
                  </div>
                )}

                <div>
                  <div className="text-slate-300 font-semibold mb-1 flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-brand-400" />
                    <span>Load Custom M3U / M3U8 URL</span>
                  </div>
                  <p className="text-slate-400 text-[11px] mb-3">
                    Paste any direct M3U stream URL or playlist from GitHub or your provider.
                  </p>
                  <form onSubmit={handleCustomSubmit} className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://example.com/playlist.m3u8"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      className="flex-1 bg-dark-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-brand-500 hover:bg-brand-400 text-dark-950 font-bold rounded-xl shadow-md transition"
                    >
                      Load URL
                    </button>
                  </form>
                </div>

                <div className="border-t border-slate-800/80 pt-4">
                  <div className="text-slate-300 font-semibold mb-1 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>Upload Local File</span>
                  </div>
                  <p className="text-slate-400 text-[11px] mb-3">
                    Select or drag-and-drop a local .m3u or .m3u8 file from your computer.
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".m3u,.m3u8"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-800 hover:border-brand-500/60 rounded-2xl p-6 text-center cursor-pointer bg-dark-950/40 hover:bg-dark-950/80 transition group"
                  >
                    <Upload className="w-8 h-8 text-slate-500 group-hover:text-brand-400 mx-auto mb-2 transition" />
                    <div className="font-semibold text-white text-xs mb-0.5">
                      Click to choose an M3U file
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Supports standard M3U and M3U_PLUS
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
