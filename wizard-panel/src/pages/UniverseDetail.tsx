import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Globe, ArrowLeft, Users, Film, Sparkles, Calendar, Palette, 
  BookOpen, Settings, Plus, Eye, ChevronRight, RefreshCw, Loader2,
  CheckCircle, Clock, Image as ImageIcon, Video, Zap, Search, Filter,
  AlertCircle
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { episodeApi } from '../services/api'
import { characterApi } from '../services/api'
import toast from 'react-hot-toast'

// Evren renkleri
const universeColors: Record<string, { bg: string, text: string, border: string, gradient: string }> = {
  kadersizler: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30', gradient: 'from-cyan-500 to-blue-500' },
  seferverse: { bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/30', gradient: 'from-violet-500 to-purple-500' },
  eco_os: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', gradient: 'from-emerald-500 to-teal-500' },
  lighthouse: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', gradient: 'from-amber-500 to-orange-500' },
  default: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30', gradient: 'from-gray-500 to-slate-500' },
}

export function UniverseDetail() {
  const { universeId } = useParams<{ universeId: string }>()
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch episodes
  const { data: episodesData, isLoading: episodesLoading } = useQuery({
    queryKey: ['episodes'],
    queryFn: async () => {
      const response = await fetch('/api/stories/scenes/all')
      if (!response.ok) return []
      const data = await response.json()
      return data.scenes || []
    },
  })

  // Fetch characters
  const { data: charactersData, isLoading: charactersLoading } = useQuery({
    queryKey: ['characters'],
    queryFn: () => characterApi.getAll(),
  })

  const episodes = (episodesData || []).filter((e: any) => e.universe === universeId)
  const characters = (charactersData?.data || []).filter((c: any) => (c.universe || c.universe_id) === universeId)

  // Filter episodes
  const filteredEpisodes = episodes.filter((episode: any) => {
    const matchesSearch = searchQuery === '' || 
      episode.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      episode.id?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'completed' && episode.status === 'completed') ||
      (statusFilter === 'pending' && episode.status !== 'completed' && episode.status !== 'failed')
    
    return matchesSearch && matchesStatus
  })

  const renderedEpisodes = filteredEpisodes.filter((e: any) => 
    e.status === 'completed' && (e.images > 0 || e.video_url || e.thumbnail_url)
  )
  const pendingEpisodes = filteredEpisodes.filter((e: any) => 
    e.status !== 'completed' || (e.images === 0 && !e.video_url && !e.thumbnail_url)
  )

  const universeColor = universeColors[universeId || ''] || universeColors.default

  // Stats
  const stats = [
    { 
      name: 'Toplam Bölüm', 
      value: episodes.length.toString(), 
      icon: Film, 
      color: 'bg-purple-600' 
    },
    { 
      name: 'Karakterler', 
      value: characters.length.toString(), 
      icon: Users, 
      color: 'bg-blue-600' 
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
  ]

  const getDisplayName = (value: any, fallback: string = 'Belirtilmemiş') => {
    if (!value || value === 'unknown' || value === 'Unknown' || value === '') return fallback
    if (typeof value === 'object') return value.name || value.title || fallback
    return String(value)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Bilinmiyor'
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch {
      return 'Bilinmiyor'
    }
  }

  if (!universeId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-300">Evren bulunamadı</h3>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/universe')}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-400" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
            <div className={`p-3 rounded-xl ${universeColor.bg} shadow-lg`}>
              <Globe className={`h-8 w-8 ${universeColor.text}`} />
            </div>
            {universeId.charAt(0).toUpperCase() + universeId.slice(1)}
          </h1>
          <p className="text-gray-400 mt-1">Evren yönetimi ve içerik görüntüleme</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/universe/${universeId}/character`)}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Karakter Ekle
          </button>
          <button
            onClick={() => navigate(`/universe/${universeId}/episode`)}
            className="btn btn-secondary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Bölüm Ekle
          </button>
        </div>
      </div>

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

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-800">
        <button className="px-4 py-2 text-sm font-medium text-gray-400 border-b-2 border-indigo-500 text-indigo-400">
          Bölümler
        </button>
        <button 
          onClick={() => navigate(`/characters?universe=${universeId}`)}
          className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
        >
          Karakterler
        </button>
        <button className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">
          Stiller
        </button>
        <button className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">
          Ayarlar
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
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

      {/* Loading */}
      {(episodesLoading || charactersLoading) && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
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
            {renderedEpisodes.map((episode: any, index: number) => (
              <div
                key={`${episode.id}-${index}`}
                onClick={() => navigate(`/universe/${universeId}/episode/${episode.id}`)}
                className="group relative bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-900/20 transition-all duration-300 cursor-pointer"
              >
                <div className="relative aspect-video bg-gray-800 overflow-hidden">
                  {episode.thumbnail_url || episode.video_url ? (
                    <img 
                      src={episode.thumbnail_url || episode.video_url} 
                      alt={episode.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${universeColor.gradient} opacity-20 flex items-center justify-center`}>
                      <Film className={`h-16 w-16 ${universeColor.text} opacity-30`} />
                    </div>
                  )}
                  {episode.video_url && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="p-4 bg-white/20 backdrop-blur-md rounded-full">
                        <Video className="h-8 w-8 text-white fill-white" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-6 space-y-3">
                  <h3 className="text-lg font-bold text-gray-100 group-hover:text-indigo-400 transition-colors line-clamp-2">
                    {getDisplayName(episode.title, episode.id)}
                  </h3>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>{episode.beats || 0} beats</span>
                    <span>{formatDate(episode.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
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
            {pendingEpisodes.map((episode: any, index: number) => (
              <div
                key={`${episode.id}-${index}`}
                onClick={() => navigate(`/universe/${universeId}/episode/${episode.id}`)}
                className="group relative bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden hover:border-yellow-500/50 hover:shadow-xl hover:shadow-yellow-900/20 transition-all duration-300 cursor-pointer"
              >
                <div className="relative aspect-video bg-gray-800 overflow-hidden">
                  <div className={`w-full h-full bg-gradient-to-br ${universeColor.gradient} opacity-10 flex items-center justify-center`}>
                    <div className="text-center">
                      <Film className={`h-16 w-16 ${universeColor.text} opacity-30 mx-auto mb-2`} />
                      <div className="text-xs text-gray-500 font-medium">Render Bekliyor</div>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  <h3 className="text-lg font-bold text-gray-100 group-hover:text-yellow-400 transition-colors line-clamp-2">
                    {getDisplayName(episode.title, episode.id)}
                  </h3>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>{episode.beats || 0} beats</span>
                    <span>{formatDate(episode.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!episodesLoading && !charactersLoading && filteredEpisodes.length === 0 && (
        <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700">
          <Film className="h-12 w-12 mx-auto mb-4 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-300">Bu evrende henüz bölüm yok</h3>
          <p className="text-gray-500 mt-2">İlk bölümünüzü oluşturmak için "Bölüm Ekle" butonuna tıklayın.</p>
        </div>
      )}
    </div>
  )
}

