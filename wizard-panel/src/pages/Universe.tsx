import { useState } from 'react'
import { 
  Globe, Plus, Edit, Trash2, Users, Sparkles, Film, Calendar, 
  Search, Filter, Eye, ChevronRight, RefreshCw, Loader2, X,
  BookOpen, Palette, Zap, CheckCircle, AlertCircle, Settings
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { universeApi } from '../services/api'
import { episodeApi } from '../services/api'
import { characterApi } from '../services/api'
import toast from 'react-hot-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../components/ui/dialog'
import { Input } from '../components/ui/input'

// Evren renkleri
const universeColors: Record<string, { bg: string, text: string, border: string, gradient: string }> = {
  kadersizler: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30', gradient: 'from-cyan-500 to-blue-500' },
  seferverse: { bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/30', gradient: 'from-violet-500 to-purple-500' },
  eco_os: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', gradient: 'from-emerald-500 to-teal-500' },
  lighthouse: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', gradient: 'from-amber-500 to-orange-500' },
  default: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30', gradient: 'from-gray-500 to-slate-500' },
}

interface Universe {
  id: string
  name?: string
  title?: string
  description?: string
  tagline?: string
  style?: string
  characters_count?: number
  episodes_count?: number
  created_at?: string
  status?: string
  thumbnail_url?: string
}

export function Universe() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUniverse, setSelectedUniverse] = useState<Universe | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newUniverse, setNewUniverse] = useState({
    id: '',
    name: '',
    description: '',
    style: '',
  })

  // Fetch universes from episodes/characters data
  const { data: episodesData } = useQuery({
    queryKey: ['episodes'],
    queryFn: async () => {
      const response = await fetch('/api/stories/scenes/all')
      if (!response.ok) return []
      const data = await response.json()
      return data.scenes || []
    },
  })

  const { data: charactersData } = useQuery({
    queryKey: ['characters'],
    queryFn: () => characterApi.getAll(),
  })

  // Build universes from data
  const episodes = episodesData || []
  const characters = charactersData?.data || []
  
  // Get unique universes
  const universeIds = [...new Set([
    ...episodes.map((e: any) => e.universe),
    ...characters.map((c: any) => c.universe || c.universe_id)
  ])].filter(Boolean)

  // Build universe objects with stats
  const universes: Universe[] = universeIds.map((id: string) => {
    const universeEpisodes = episodes.filter((e: any) => e.universe === id)
    const universeCharacters = characters.filter((c: any) => (c.universe || c.universe_id) === id)
    
    return {
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      title: id.charAt(0).toUpperCase() + id.slice(1),
      description: `Evren açıklaması: ${id}`,
      characters_count: universeCharacters.length,
      episodes_count: universeEpisodes.length,
      style: universeEpisodes[0]?.style || 'default',
      status: 'active',
    }
  })

  // Filter universes
  const filteredUniverses = universes.filter((universe) => {
    const matchesSearch = searchQuery === '' || 
      universe.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      universe.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      universe.description?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  // Create universe mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await universeApi.create(data)
      return response.data
    },
    onSuccess: () => {
      toast.success('Evren oluşturuldu!')
      setCreateModalOpen(false)
      setNewUniverse({ id: '', name: '', description: '', style: '' })
      queryClient.invalidateQueries({ queryKey: ['episodes'] })
      queryClient.invalidateQueries({ queryKey: ['characters'] })
    },
    onError: (error: any) => {
      toast.error(`Hata: ${error.message || 'Evren oluşturulamadı'}`)
    }
  })

  const handleCreate = () => {
    if (!newUniverse.id || !newUniverse.name) {
      toast.error('ID ve isim gereklidir')
      return
    }
    createMutation.mutate({
      id: newUniverse.id.toLowerCase(),
      name: newUniverse.name,
      description: newUniverse.description,
      style: newUniverse.style || 'default',
    })
  }

  const handleUniverseClick = (universe: Universe) => {
    setSelectedUniverse(universe)
    setDetailOpen(true)
  }

  // Stats
  const stats = [
    { 
      name: 'Toplam Evren', 
      value: universes.length.toString(), 
      icon: Globe, 
      color: 'bg-indigo-600' 
    },
    { 
      name: 'Toplam Karakter', 
      value: characters.length.toString(), 
      icon: Users, 
      color: 'bg-blue-600' 
    },
    { 
      name: 'Toplam Bölüm', 
      value: episodes.length.toString(), 
      icon: Film, 
      color: 'bg-purple-600' 
    },
    { 
      name: 'Aktif Evrenler', 
      value: universes.filter(u => u.status === 'active').length.toString(), 
      icon: CheckCircle, 
      color: 'bg-emerald-600' 
    },
  ]

  // Format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Bilinmiyor'
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch {
      return 'Bilinmiyor'
    }
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
            <Globe className="h-8 w-8 text-indigo-400" />
            EVRENLER
          </h1>
          <p className="text-gray-400 mt-1">Hikaye evrenlerini yönetin ve düzenleyin</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['episodes'] })
              queryClient.invalidateQueries({ queryKey: ['characters'] })
            }}
            className="btn btn-secondary"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </button>
          
          <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
            <DialogTrigger asChild>
              <button className="btn btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Yeni Evren
              </button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-indigo-400" />
                  Yeni Evren Oluştur
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  Yeni bir hikaye evreni oluşturun
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Evren ID (Slug)</label>
                  <Input
                    placeholder="seferverse, kadersizler, eco-os..."
                    value={newUniverse.id}
                    onChange={(e) => setNewUniverse({ ...newUniverse, id: e.target.value.toLowerCase() })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                  <p className="text-xs text-gray-500">Küçük harf, tire ile ayrılmış (örn: seferverse)</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Evren Adı</label>
                  <Input
                    placeholder="SeferVerse, Kadersizler..."
                    value={newUniverse.name}
                    onChange={(e) => setNewUniverse({ ...newUniverse, name: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Açıklama</label>
                  <textarea
                    placeholder="Evrenin kısa açıklaması..."
                    value={newUniverse.description}
                    onChange={(e) => setNewUniverse({ ...newUniverse, description: e.target.value })}
                    className="w-full h-24 bg-gray-800 border border-gray-700 rounded-md p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Stil</label>
                  <Input
                    placeholder="cyberpunk, noir, fantasy..."
                    value={newUniverse.style}
                    onChange={(e) => setNewUniverse({ ...newUniverse, style: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setCreateModalOpen(false)}
                    className="btn btn-secondary"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={createMutation.isPending || !newUniverse.id || !newUniverse.name}
                    className="btn btn-primary"
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Oluştur
                  </button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Evren ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Universes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUniverses.map((universe) => {
          const universeColor = universeColors[universe.id] || universeColors.default
          const universeEpisodes = episodes.filter((e: any) => e.universe === universe.id)
          const universeCharacters = characters.filter((c: any) => (c.universe || c.universe_id) === universe.id)
          
          return (
            <div
              key={universe.id}
              onClick={() => handleUniverseClick(universe)}
              className="group relative bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-900/20 transition-all duration-300 cursor-pointer"
            >
              {/* Header with Gradient */}
              <div className={`relative h-32 bg-gradient-to-br ${universeColor.gradient} opacity-20`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Globe className={`h-16 w-16 ${universeColor.text} opacity-30`} />
                </div>
                <div className="absolute top-4 right-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${universeColor.bg} ${universeColor.text} ${universeColor.border} border`}>
                    {universe.status || 'active'}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Title */}
                <div>
                  <h3 className="text-xl font-bold text-gray-100 group-hover:text-indigo-400 transition-colors mb-1">
                    {universe.name || universe.title || universe.id}
                  </h3>
                  <p className="text-xs font-mono text-gray-500">{universe.id}</p>
                </div>

                {/* Description */}
                {universe.description && (
                  <p className="text-sm text-gray-400 line-clamp-2">
                    {universe.description}
                  </p>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-xs text-gray-500">Karakterler</div>
                      <div className="text-lg font-bold text-gray-100">
                        {universeCharacters.length}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Film className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-xs text-gray-500">Bölümler</div>
                      <div className="text-lg font-bold text-gray-100">
                        {universeEpisodes.length}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Style */}
                {universe.style && (
                  <div className="flex items-center gap-2 text-sm">
                    <Palette className="h-3.5 w-3.5 text-gray-500" />
                    <span className="text-gray-400">Stil:</span>
                    <span className="text-gray-300 font-medium">
                      {typeof universe.style === 'object' 
                        ? (universe.style as any).name || 'Varsayılan'
                        : String(universe.style || 'Varsayılan')
                      }
                    </span>
                  </div>
                )}

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUniverseClick(universe)
                    }}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-indigo-400 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    Detayları Gör
                  </button>
                  <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-indigo-400 transition-colors" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredUniverses.length === 0 && (
        <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700">
          <Globe className="h-12 w-12 mx-auto mb-4 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-300">Evren bulunamadı</h3>
          <p className="text-gray-500 mt-2">
            {searchQuery ? 'Arama kriterlerinize uygun evren yok.' : 'Henüz evren oluşturulmamış.'}
          </p>
        </div>
      )}

      {/* Universe Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Globe className="h-6 w-6 text-indigo-400" />
              {selectedUniverse?.name || selectedUniverse?.title || selectedUniverse?.id}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedUniverse?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedUniverse && (
            <div className="space-y-6 py-4">
              {/* Description */}
              {selectedUniverse.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Açıklama</h4>
                  <p className="text-gray-300">{selectedUniverse.description}</p>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                  <div className="text-xs text-gray-500 uppercase mb-1">Karakterler</div>
                  <div className="text-2xl font-bold text-gray-100">
                    {characters.filter((c: any) => (c.universe || c.universe_id) === selectedUniverse.id).length}
                  </div>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                  <div className="text-xs text-gray-500 uppercase mb-1">Bölümler</div>
                  <div className="text-2xl font-bold text-gray-100">
                    {episodes.filter((e: any) => e.universe === selectedUniverse.id).length}
                  </div>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                  <div className="text-xs text-gray-500 uppercase mb-1">Stil</div>
                  <div className="text-lg font-bold text-gray-100 truncate">
                    {typeof selectedUniverse.style === 'object' 
                      ? (selectedUniverse.style as any).name || 'Varsayılan'
                      : String(selectedUniverse.style || 'Varsayılan')
                    }
                  </div>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                  <div className="text-xs text-gray-500 uppercase mb-1">Durum</div>
                  <div className="text-lg font-bold text-gray-100">
                    {selectedUniverse.status || 'active'}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-800">
                <button
                  onClick={() => {
                    navigate(`/universe/${selectedUniverse.id}`)
                    setDetailOpen(false)
                  }}
                  className="btn btn-primary flex-1"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Evreni Yönet
                </button>
                <button
                  onClick={() => {
                    navigate(`/universe/${selectedUniverse.id}/character`)
                    setDetailOpen(false)
                  }}
                  className="btn btn-secondary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Karakter Ekle
                </button>
                <button
                  onClick={() => {
                    navigate(`/universe/${selectedUniverse.id}/episode`)
                    setDetailOpen(false)
                  }}
                  className="btn btn-secondary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Bölüm Ekle
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
