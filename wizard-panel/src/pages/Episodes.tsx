import { useState, useEffect } from 'react'
import { 
  Play, Plus, Eye, Download, Zap, Image as ImageIcon, Clock, CheckCircle, 
  AlertTriangle, RefreshCw, Film, BookOpen, Globe, Filter, Search,
  ChevronRight, Sparkles, Video, Loader2, X, Calendar, User, Palette
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { EpisodeBadge } from '../components/SVBadge'
import { EpisodesListAlerts } from '../components/TelemetryAlerts'
import { useQuery } from '@tanstack/react-query'
import { episodeApi } from '../services/api'
import toast from 'react-hot-toast'

interface Episode {
  id: string
  unique_key?: string
  title: string
  universe: string
  quest?: string | null
  character: string
  style: string
  beats: number
  status: string
  diversity_score: number
  created_at: string
  images: number
  nft_ready: boolean
  thumbnail_url?: string
  video_url?: string
  season?: string
  episode_number?: number
}

const API_BASE_URL = "/api"

// Evren renkleri
const universeColors: Record<string, { bg: string, text: string, border: string, gradient: string }> = {
  kadersizler: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30', gradient: 'from-cyan-500 to-blue-500' },
  seferverse: { bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/30', gradient: 'from-violet-500 to-purple-500' },
  eco_os: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', gradient: 'from-emerald-500 to-teal-500' },
  lighthouse: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', gradient: 'from-amber-500 to-orange-500' },
  default: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30', gradient: 'from-gray-500 to-slate-500' },
}

// Durum renkleri
const statusColors: Record<string, { bg: string, text: string, border: string }> = {
  completed: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  processing: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  pending: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' },
  failed: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
}

export function Episodes() {
  const navigate = useNavigate()
  const [selectedEpisode, setSelectedEpisode] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all')
  const [universeFilter, setUniverseFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch episodes
  const { data: episodesData, isLoading, refetch } = useQuery({
    queryKey: ['episodes'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/stories/scenes/all`)
      if (!response.ok) throw new Error("Bölümler yüklenemedi")
      const data = await response.json()
      return data.scenes || []
    },
    refetchOnWindowFocus: true,
  })

  const episodes: Episode[] = episodesData || []

  // Unique universes
  const universes = [...new Set(episodes.map((e: Episode) => e.universe))]

  // Filter episodes
  const filteredEpisodes = episodes.filter((episode: Episode) => {
    const matchesSearch = searchQuery === '' || 
      episode.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      episode.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      episode.character?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesUniverse = universeFilter === 'all' || episode.universe === universeFilter
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'completed' && episode.status === 'completed') ||
      (statusFilter === 'pending' && episode.status !== 'completed' && episode.status !== 'failed')
    
    return matchesSearch && matchesUniverse && matchesStatus
  })

  // Separate rendered and pending
  const renderedEpisodes = filteredEpisodes.filter((e: Episode) => 
    e.status === 'completed' && (e.images > 0 || e.video_url || e.thumbnail_url)
  )
  const pendingEpisodes = filteredEpisodes.filter((e: Episode) => 
    e.status !== 'completed' || (e.images === 0 && !e.video_url && !e.thumbnail_url)
  )

  // Stats
  const stats = [
    { 
      name: 'Toplam Bölüm', 
      value: episodes.length.toString(), 
      icon: Film, 
      color: 'bg-purple-600' 
    },
    { 
      name: 'Render Edilmiş', 
      value: renderedEpisodes.length.toString(), 
      icon: CheckCircle, 
      color: 'bg-emerald-600' 
    },
    { 
      name: 'Bekleyen', 
      value: pendingEpisodes.length.toString(), 
      icon: Clock, 
      color: 'bg-yellow-600' 
    },
    { 
      name: 'Toplam Görsel', 
      value: episodes.reduce((acc: number, e: Episode) => acc + (e.images || 0), 0).toString(), 
      icon: ImageIcon, 
      color: 'bg-blue-600' 
    },
  ]

  // Format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Bilinmiyor'
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch {
      return 'Bilinmiyor'
    }
  }

  // Get display name
  const getDisplayName = (value: any, fallback: string = 'Belirtilmemiş') => {
    if (!value || value === 'unknown' || value === 'Unknown' || value === '') return fallback
    if (typeof value === 'object') return value.name || value.title || fallback
    return String(value)
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
            <Film className="h-8 w-8 text-indigo-400" />
            BÖLÜMLER
          </h1>
          <p className="text-gray-400 mt-1">Hikaye bölümlerini yönetin ve render edin</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => refetch()}
            disabled={isLoading}
            className="btn btn-secondary"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
          <button className="btn btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Bölüm
          </button>
        </div>
      </div>

      <EpisodesListAlerts />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-100">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Bölüm ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Universe Filter */}
          <div className="relative">
            <select
              value={universeFilter}
              onChange={(e) => setUniverseFilter(e.target.value)}
              className="appearance-none bg-gray-800 border border-gray-700 text-white py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tüm Evrenler</option>
              {universes.map((u) => (
                <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>
              ))}
            </select>
            <Globe className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                statusFilter === 'all' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                statusFilter === 'completed' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Render Edilmiş
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                statusFilter === 'pending' ? 'bg-yellow-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Bekleyen
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && episodes.length === 0 && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredEpisodes.length === 0 && (
        <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700">
          <Film className="h-12 w-12 mx-auto mb-4 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-300">Bölüm bulunamadı</h3>
          <p className="text-gray-500 mt-2">Filtreleri değiştirerek tekrar deneyin.</p>
        </div>
      )}

      {/* Render Edilmiş Bölümler */}
      {renderedEpisodes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-gray-100">Render Edilmiş & İzlenebilir</h2>
            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full">
              {renderedEpisodes.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {renderedEpisodes.map((episode, index) => {
              const universeColor = universeColors[episode.universe] || universeColors.default
              const statusColor = statusColors[episode.status] || statusColors.pending
              
              return (
                <div
                  key={`${episode.universe}-${episode.id}-${index}`}
                  onClick={() => navigate(`/universe/${episode.universe}/episode/${episode.id}`)}
                  className="group relative bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-900/20 transition-all duration-300 cursor-pointer"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-gray-800 overflow-hidden">
                    {episode.thumbnail_url || episode.video_url ? (
                      <img 
                        src={episode.thumbnail_url || episode.video_url} 
                        alt={episode.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : episode.images > 0 ? (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-900/50 to-purple-900/50 flex items-center justify-center">
                        <ImageIcon className="h-16 w-16 text-indigo-400/50" />
                        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 rounded text-xs text-white font-medium">
                          {episode.images} görsel
                        </div>
                      </div>
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${universeColor.gradient} opacity-20 flex items-center justify-center`}>
                        <Film className={`h-16 w-16 ${universeColor.text} opacity-30`} />
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusColor.bg} ${statusColor.text} ${statusColor.border} border`}>
                        {episode.status === 'completed' ? 'Tamamlandı' : episode.status}
                      </span>
                    </div>

                    {/* Play Button Overlay */}
                    {episode.video_url && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="p-4 bg-white/20 backdrop-blur-md rounded-full">
                          <Play className="h-8 w-8 text-white fill-white" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4">
                    {/* Title & Universe */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-100 group-hover:text-indigo-400 transition-colors line-clamp-2 mb-2">
                        {getDisplayName(episode.title, episode.id)}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${universeColor.bg} ${universeColor.text}`}>
                          {getDisplayName(episode.universe, 'Evren')}
                        </span>
                        {episode.quest && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            quest: {episode.quest}
                          </span>
                        )}
                        {episode.season && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-300">
                            Sezon {episode.season}
                          </span>
                        )}
                        {episode.episode_number && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-300">
                            Bölüm {episode.episode_number}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          Karakter:
                        </span>
                        <span className="text-gray-300 font-medium">
                          {getDisplayName(episode.character, 'Belirtilmemiş')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 flex items-center gap-1.5">
                          <Palette className="h-3.5 w-3.5" />
                          Stil:
                        </span>
                        <span className="text-gray-300 font-medium truncate ml-2">
                          {getDisplayName(episode.style, 'Varsayılan')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 flex items-center gap-1.5">
                          <Film className="h-3.5 w-3.5" />
                          Beats:
                        </span>
                        <span className="text-gray-300 font-medium">{episode.beats || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          Tarih:
                        </span>
                        <span className="text-gray-300 font-medium text-xs">
                          {formatDate(episode.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase">Diversity</span>
                        <span className={`font-mono font-bold text-sm ${
                          episode.diversity_score >= 0.8 ? 'text-emerald-400' :
                          episode.diversity_score >= 0.6 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {((episode.diversity_score || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-8 w-px bg-gray-800"></div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-gray-500 uppercase">SV Status</span>
                        <EpisodeBadge episodeId={episode.id} universeId={episode.universe} />
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="bg-gray-900/80 p-4 border-t border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {episode.video_url && (
                        <div className="flex items-center gap-1.5 text-emerald-400" title="Video Hazır">
                          <Video className="h-3.5 w-3.5" />
                          <span className="font-medium">Video</span>
                        </div>
                      )}
                      {episode.images > 0 && (
                        <div className="flex items-center gap-1.5" title="Görseller">
                          <ImageIcon className="h-3.5 w-3.5 text-gray-500" />
                          <span className="font-medium">{episode.images}</span>
                        </div>
                      )}
                      {episode.nft_ready && (
                        <div className="flex items-center gap-1.5 text-purple-400" title="NFT Hazır">
                          <Sparkles className="h-3.5 w-3.5" />
                          <span className="font-medium">NFT</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                        title="Görüntüle"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/universe/${episode.universe}/episode/${episode.id}`)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {episode.video_url && (
                        <a
                          href={episode.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-emerald-400 transition-colors"
                          title="Video İzle"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Play className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Bekleyen Bölümler */}
      {pendingEpisodes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-400" />
            <h2 className="text-xl font-bold text-gray-100">Render Edilmemiş / Bekleyen</h2>
            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full">
              {pendingEpisodes.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingEpisodes.map((episode, index) => {
              const universeColor = universeColors[episode.universe] || universeColors.default
              const statusColor = statusColors[episode.status] || statusColors.pending
              
              return (
                <div
                  key={`${episode.universe}-${episode.id}-${index}`}
                  onClick={() => navigate(`/universe/${episode.universe}/episode/${episode.id}`)}
                  className="group relative bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden hover:border-yellow-500/50 hover:shadow-xl hover:shadow-yellow-900/20 transition-all duration-300 cursor-pointer"
                >
                  {/* Thumbnail Placeholder */}
                  <div className="relative aspect-video bg-gray-800 overflow-hidden">
                    <div className={`w-full h-full bg-gradient-to-br ${universeColor.gradient} opacity-10 flex items-center justify-center`}>
                      <div className="text-center">
                        <Film className={`h-16 w-16 ${universeColor.text} opacity-30 mx-auto mb-2`} />
                        <div className="text-xs text-gray-500 font-medium">Render Bekliyor</div>
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusColor.bg} ${statusColor.text} ${statusColor.border} border`}>
                        {episode.status === 'processing' ? 'İşleniyor' : 
                         episode.status === 'pending' ? 'Bekliyor' : 
                         episode.status || 'Bekliyor'}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4">
                    {/* Title & Universe */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-100 group-hover:text-yellow-400 transition-colors line-clamp-2 mb-2">
                        {getDisplayName(episode.title, episode.id)}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${universeColor.bg} ${universeColor.text}`}>
                          {getDisplayName(episode.universe, 'Evren')}
                        </span>
                        {episode.quest && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/10 text-yellow-300 border border-yellow-500/20">
                            quest: {episode.quest}
                          </span>
                        )}
                        {episode.season && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-300">
                            Sezon {episode.season}
                          </span>
                        )}
                        {episode.episode_number && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-300">
                            Bölüm {episode.episode_number}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          Karakter:
                        </span>
                        <span className="text-gray-300 font-medium">
                          {getDisplayName(episode.character, 'Belirtilmemiş')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 flex items-center gap-1.5">
                          <Palette className="h-3.5 w-3.5" />
                          Stil:
                        </span>
                        <span className="text-gray-300 font-medium truncate ml-2">
                          {getDisplayName(episode.style, 'Varsayılan')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 flex items-center gap-1.5">
                          <Film className="h-3.5 w-3.5" />
                          Beats:
                        </span>
                        <span className="text-gray-300 font-medium">{episode.beats || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          Tarih:
                        </span>
                        <span className="text-gray-300 font-medium text-xs">
                          {formatDate(episode.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase">Diversity</span>
                        <span className={`font-mono font-bold text-sm ${
                          (episode.diversity_score || 0) >= 0.8 ? 'text-emerald-400' :
                          (episode.diversity_score || 0) >= 0.6 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {((episode.diversity_score || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-8 w-px bg-gray-800"></div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-gray-500 uppercase">SV Status</span>
                        <EpisodeBadge episodeId={episode.id} universeId={episode.universe} />
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="bg-gray-900/80 p-4 border-t border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {episode.images > 0 && (
                        <div className="flex items-center gap-1.5" title="Görseller">
                          <ImageIcon className="h-3.5 w-3.5 text-gray-500" />
                          <span className="font-medium">{episode.images}</span>
                        </div>
                      )}
                      {!episode.images && (
                        <div className="flex items-center gap-1.5 text-gray-500" title="Henüz görsel yok">
                          <ImageIcon className="h-3.5 w-3.5" />
                          <span className="font-medium">0 görsel</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                        title="Görüntüle"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/universe/${episode.universe}/episode/${episode.id}`)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        className="p-2 hover:bg-yellow-900/50 rounded-lg text-yellow-500 transition-colors"
                        title="Render Et"
                        onClick={(e) => {
                          e.stopPropagation()
                          toast.success('Render başlatılıyor...')
                        }}
                      >
                        <Zap className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
