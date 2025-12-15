import { useEffect, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { 
  Play, 
  RefreshCw, 
  Star, 
  Clock, 
  Users, 
  TrendingUp,
  ChevronRight,
  Image as ImageIcon,
  Instagram,
  Copy,
  ExternalLink,
  Grid3x3,
  Map,
  Home,
  HelpCircle,
  Repeat,
  Trash2,
  Flame,
  Heart,
  MicOff,
  User,
  Phone,
  Wind,
  Plus,
  Wand2,
  Bot,
  ChevronDown,
  Film,
  BookOpen,
  X,
  Download
} from 'lucide-react'
import storyquestApiService, { SceneInfo } from '../services/storyquestApi'
import toast from 'react-hot-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../components/ui/dialog'
import { formatCaption } from '../utils/htmlSanitizer'
import { Input } from '../components/ui/input'

// Visual Tree Components
const TreeNode = ({ type, title, id, mood, icon: Icon, stats }: any) => {
  const bgColors: Record<string, string> = {
    start: 'bg-blue-600 border-blue-400',
    question: 'bg-purple-600 border-purple-400',
    scene: 'bg-gray-700 border-gray-500',
    ending: 'bg-emerald-900/50 border-emerald-500',
    logic: 'bg-orange-700/50 border-orange-500',
    flashback: 'bg-indigo-900/50 border-indigo-500'
  }

  return (
    <div className={`flex flex-col items-center p-3 rounded-lg border-2 shadow-lg min-w-[120px] relative z-10 transition-transform hover:scale-105 ${bgColors[type] || bgColors.scene}`}>
      {Icon && <Icon className="w-5 h-5 mb-1 text-white/80" />}
      <span className="text-xs font-bold text-white text-center">{title}</span>
      <span className="text-[10px] font-mono text-white/50 mt-1 max-w-[100px] truncate">{id}</span>
      {mood && (
        <span className="text-[9px] mt-1 px-1.5 py-0.5 rounded-full bg-black/30 text-white/70">
          {mood}
        </span>
      )}
      {/* Choice Stat Badge */}
      {stats && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-red-400 shadow-sm">
          %{stats.percent}
        </div>
      )}
    </div>
  )
}

const ChoiceLine = ({ label, stats }: { label: string, stats?: { percent: number, count: number } }) => (
  <div className="flex flex-col items-center relative z-20">
    <div className="h-4 w-px bg-gray-600 -mt-4 mb-1"></div>
    <span className={`text-[10px] px-2 py-0.5 rounded border mb-1 whitespace-nowrap flex items-center gap-1 ${
      stats && stats.percent > 50 ? 'bg-green-900/50 border-green-500 text-green-200' :
      'bg-gray-800 border-gray-700 text-gray-300'
    }`}>
      {label}
      {stats && (
        <span className="font-bold text-[9px] bg-black/30 px-1 rounded ml-1">
          %{stats.percent}
        </span>
      )}
    </span>
    <div className="h-4 w-px bg-gray-600 mb-1"></div>
  </div>
)

const BranchingVisualizer = ({ stats }: { stats?: any }) => {
  const getStat = (qid: string, cid: string) => {
    if (!stats || !stats[qid] || !stats[qid].choices[cid]) return undefined;
    return stats[qid].choices[cid];
  }

  return (
    <div className="flex flex-col items-center p-8 min-w-max">
      {/* Level 1: Start */}
      <TreeNode type="start" title="Başlangıç" id="q1_mektup" icon={Map} />
      
      {/* Connector to Level 2 */}
      <div className="relative mt-1">
        <div className="h-8 w-px bg-gray-600 mx-auto"></div>
        {/* Horizontal bar spanning children */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[80%] h-px bg-gray-600"></div>
      </div>

      {/* Level 2: Main Choices */}
      <div className="flex justify-center gap-16 mt-4 relative">
        {/* Branch 1: Open */}
        <div className="flex flex-col items-center">
          <ChoiceLine label="Zarfı Aç" stats={getStat('sv_terminal_q1', 'open_letter')} />
          <TreeNode type="question" title="Okuduktan Sonra" id="q2_after_open" icon={HelpCircle} />
          
          {/* Level 3: Open Choices */}
          <div className="relative mt-1">
            <div className="h-8 w-px bg-gray-600 mx-auto"></div>
            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[90%] h-px bg-gray-600"></div>
          </div>
          
          <div className="flex gap-4 mt-4">
            {/* Sınır */}
            <div className="flex flex-col items-center">
              <ChoiceLine label="Sınıra Git" stats={getStat('sv_terminal_q2_open', 'go_border')} />
              <TreeNode type="ending" title="Yolculuk" id="final_journey" mood="Umutlu" icon={Map} />
            </div>
            {/* Ev */}
            <div className="flex flex-col items-center">
              <ChoiceLine label="Eve Dön" stats={getStat('sv_terminal_q2_open', 'go_home')} />
              <TreeNode type="ending" title="Dönüş" id="final_return" mood="Buruk" icon={Home} />
            </div>
            {/* Cevap Yaz */}
            <div className="flex flex-col items-center">
              <ChoiceLine label="Cevap Yaz" stats={getStat('sv_terminal_q2_open', 'write_reply')} />
              <TreeNode type="logic" title="GPT Puanlama" id="gpt_scoring" icon={Bot} />
            </div>
            {/* Yak */}
            <div className="flex flex-col items-center">
              <ChoiceLine label="Yak" stats={getStat('sv_terminal_q2_open', 'burn_letter')} />
              <TreeNode type="ending" title="Küller" id="final_ashes" mood="Karanlık" icon={Flame} />
            </div>
          </div>
        </div>

        {/* Branch 2: Sealed */}
        <div className="flex flex-col items-center">
          <ChoiceLine label="Mühürlü Tut" stats={getStat('sv_terminal_q1', 'keep_waiting')} />
          <TreeNode type="question" title="Açılmamış Zarf" id="q2_after_sealed" icon={HelpCircle} />
          
          {/* Sealed Choices */}
          <div className="relative mt-1">
            <div className="h-8 w-px bg-gray-600 mx-auto"></div>
            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[80%] h-px bg-gray-600"></div>
          </div>
          
          <div className="flex gap-4 mt-4">
            <div className="flex flex-col items-center">
              <ChoiceLine label="Git (Açmadan)" stats={getStat('sv_terminal_q2_closed', 'leave_closed')} />
              <TreeNode type="ending" title="Gizem" id="final_mystery" mood="Endişeli" icon={HelpCircle} />
            </div>
            <div className="flex flex-col items-center">
              <ChoiceLine label="Bekle" stats={getStat('sv_terminal_q2_closed', 'wait_more')} />
              <TreeNode type="ending" title="Döngü" id="final_loop" mood="Statik" icon={Repeat} />
            </div>
          </div>
        </div>

        {/* Branch 3: Throw */}
        <div className="flex flex-col items-center">
          <ChoiceLine label="Çöpe At" stats={getStat('sv_terminal_q1', 'exit_terminal')} />
          <div className="h-16 w-px bg-gray-600 mb-1"></div>
          <TreeNode type="ending" title="Pişmanlık" id="final_regret" mood="Karanlık" icon={Trash2} />
        </div>
      </div>
    </div>
  )
}

export function StoryQuestManager() {
  const [activeUniverse, setActiveUniverse] = useState('seferverse')
  const [testMode, setTestMode] = useState(false)
  const [testRunId, setTestRunId] = useState<string | null>(null)
  const [testCaption, setTestCaption] = useState('')
  const [testFileUrl, setTestFileUrl] = useState('')
  const [testOptions, setTestOptions] = useState<any[]>([])
  const [testQuestionId, setTestQuestionId] = useState('')
  const [testMeta, setTestMeta] = useState<any>(null)
  const [scenesFilter, setScenesFilter] = useState<'all' | 'ending'>('all')
  
  // AI Quest State
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiCharacter, setAiCharacter] = useState('')
  const [aiTheme, setAiTheme] = useState('')

  // Scene Detail State
  const [selectedScene, setSelectedScene] = useState<SceneInfo | null>(null)
  const [sceneDetailsOpen, setSceneDetailsOpen] = useState(false)

  const isTerminalQuest = activeUniverse === 'seferverse'
  const isNeonQuest = activeUniverse === 'neondreams'

  // Evren değişince state karışmasını engelle (run/scenes/selection reset)
  useEffect(() => {
    setSelectedScene(null)
    setSceneDetailsOpen(false)
    setTestRunId(null)
    setTestCaption('')
    setTestFileUrl('')
    setTestOptions([])
    setTestQuestionId('')
    setTestMeta(null)
  }, [activeUniverse])

  // Fetch scenes info
  const { data: scenesData, refetch: refetchScenes } = useQuery({
    queryKey: ['storyquest-scenes', activeUniverse],
    queryFn: async () => {
      if (isTerminalQuest) return storyquestApiService.terminal.getScenes()
      if (isNeonQuest) {
        // Neon config endpoint already returns scenes
        const cfg = await storyquestApiService.neon.getConfig()
        return { data: { scenes: cfg.data?.scenes || [], canonical_path: cfg.data?.canonical_path || '' } }
      }
      return { data: { scenes: [], canonical_path: '' } }
    },
  })

  // Fetch config
  const { data: configData } = useQuery({
    queryKey: ['storyquest-config', activeUniverse],
    queryFn: async () => {
      if (isTerminalQuest) return storyquestApiService.terminal.getConfig()
      if (isNeonQuest) return storyquestApiService.neon.getConfig()
      return { data: null }
    },
  })

  // Fetch Stats
  const { data: statsData } = useQuery({
    queryKey: ['storyquest-stats', activeUniverse],
    queryFn: () => storyquestApiService.getStats(activeUniverse),
    refetchInterval: 30000,
  })

  // Fetch Scene Assets (only when selected)
  const { data: sceneAssetsData, isLoading: isAssetsLoading } = useQuery({
    queryKey: ['storyquest-scene-assets', activeUniverse, selectedScene?.scene_id],
    queryFn: () => storyquestApiService.terminal.getSceneAssets(selectedScene!.scene_id, activeUniverse),
    enabled: !!selectedScene && isTerminalQuest,
  })

  // Fetch Choice Analytics
  const { data: analyticsData } = useQuery({
    queryKey: ['storyquest-analytics', activeUniverse],
    queryFn: () => storyquestApiService.terminal.getChoiceAnalytics(activeUniverse),
    refetchInterval: 10000,
  })

  // Start a test run
  const startTestMutation = useMutation({
    mutationFn: () => {
      if (isTerminalQuest) return storyquestApiService.terminal.start(`wizard_test_${Date.now()}`, 2025)
      if (isNeonQuest) return storyquestApiService.neon.start(`wizard_test_${Date.now()}`, 2025)
      // Fallback: disable test runs for universes without a fixed branching quest
      return Promise.reject(new Error('Bu evrende sabit StoryQuest testi yok. AI Quest kullan.'))
    },
    onSuccess: (response) => {
      const data = response.data
      setTestRunId(data.run_id)
      setTestCaption(data.caption)
      setTestFileUrl(data.file_url || '')
      setTestOptions(Array.isArray(data.cta?.options) ? data.cta.options : [])
      setTestQuestionId(data.cta?.question_id || '')
      setTestMeta(data.meta || null)
      toast.success('Test başlatıldı!')
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail
      toast.error(`Hata: ${detail || error.message}`)
    }
  })

  const [aiModel, setAiModel] = useState('grok')

  // Start AI Quest
  const startAIQuestMutation = useMutation({
    mutationFn: () => storyquestApiService.terminal.startAI({
      universe: activeUniverse,
      character_name: aiCharacter || 'Bilinmeyen',
      theme: aiTheme || 'Gizem',
      prompt: aiPrompt || 'Hikayeyi başlat...',
      model: aiModel
    }),
    onSuccess: (response) => {
      const data = response.data
      setTestRunId(data.run_id)
      setTestCaption(data.caption)
      setTestFileUrl(data.file_url || '')
      setTestOptions(Array.isArray(data.cta?.options) ? data.cta.options : [])
      setTestQuestionId(data.cta?.question_id || '') 
      setTestMeta(data.meta || null)
      setTestMode(true)
      setAiModalOpen(false)
      toast.success(`AI Hikaye Başlatıldı! (${aiModel === 'gemini' ? 'Gemini' : aiModel === 'openai' ? 'GPT-4o' : 'Grok'})`)
    },
    onError: (error: any) => {
      const detail =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        'Bilinmeyen hata'

      if (String(detail).toLowerCase().includes('network error')) {
        toast.error('AI Hata: Network Error (API erişimi/CORS). /api proxy ve backend bağlantısını kontrol et.')
        return
      }

      toast.error(`AI Hata: ${detail}`)
    }
  })

  // Make a choice
  const choiceMutation = useMutation({
    mutationFn: ({ questionId, choiceId }: { questionId: string, choiceId: string }) => 
      (testRunId?.startsWith('AI-QUEST-'))
        ? storyquestApiService.terminal.aiChoice({
            run_id: testRunId!,
            choice_id: choiceId,
            choice_label: (testOptions || []).find((o: any) => o?.id === choiceId)?.label,
          })
        : storyquestApiService.terminal.choice(testRunId!, questionId, choiceId),
    onSuccess: (response) => {
      const data = response.data
      setTestCaption(data.caption)
      setTestFileUrl(data.file_url || '')
      setTestOptions(Array.isArray(data.cta?.options) ? data.cta.options : [])
      setTestQuestionId(data.cta?.question_id || '')
      setTestMeta(data.meta || null)
      
      if (data.is_final) {
        toast.success(`Hikaye tamamlandı: ${data.ending_type}`)
      }
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail
      toast.error(`Hata: ${detail || error.message}`)
    }
  })

  const scenesRaw = scenesData?.data?.scenes
  const scenes = Array.isArray(scenesRaw) ? scenesRaw : []
  const config = configData?.data

  const filteredScenes = scenesFilter === 'all' 
    ? scenes 
    : scenes.filter((s: SceneInfo) => s.type === 'ending')

  // Stats
  const stats = [
    { name: 'Toplam Sahne', value: statsData?.data?.total_steps?.toString() || scenes.length.toString(), icon: Film, color: 'bg-purple-600' },
    { name: 'Aktif Seanslar', value: statsData?.data?.active_runs?.toString() || '0', icon: Users, color: 'bg-blue-600' },
    { name: 'Tamamlanan', value: statsData?.data?.completed_runs?.toString() || '0', icon: Star, color: 'bg-yellow-600' },
    { name: 'Ort. Süre', value: statsData?.data?.avg_duration_sec ? `${Math.round(statsData.data.avg_duration_sec)}s` : '0s', icon: Clock, color: 'bg-orange-600' },
  ]

  const handleSceneClick = (scene: SceneInfo) => {
    setSelectedScene(scene)
    setSceneDetailsOpen(true)
  }

  // Fetch characters
  const { data: charactersData } = useQuery({
    queryKey: ['characters'],
    queryFn: async () => {
      const response = await fetch('/api/characters/');
      const data = await response.json();
      // API can return array directly or wrapped in object
      if (Array.isArray(data)) return data
      if (Array.isArray((data as any)?.characters)) return (data as any).characters
      return []
    }
  });

  const characters = Array.isArray(charactersData) ? charactersData : []

  return (
    <div className="space-y-6">
      {/* Header & Story Selector */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
            <Wand2 className="h-8 w-8 text-indigo-400" />
            StoryQuest Manager
          </h1>
          <p className="text-gray-400 mt-1">Etkileşimli Hikaye Yönetimi ve AI Üretimi</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* Universe Selector */}
          <div className="relative">
            <select 
              value={activeUniverse}
              onChange={(e) => setActiveUniverse(e.target.value)}
              className="appearance-none bg-gray-800 border border-gray-700 text-white py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="seferverse">SeferVerse (Terminal)</option>
              <option value="neondreams">Neon Dreams (Awakening)</option>
              <option value="kadersizler">Kadersizler</option>
              <option value="eco-os">Eco-OS</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
            <DialogTrigger asChild>
              <button className="btn btn-primary bg-gradient-to-r from-indigo-600 to-purple-600 border-none">
                <Bot className="h-4 w-4 mr-2" />
                Yeni Quest (AI)
              </button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-800 text-white">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-indigo-400" />
                  AI ile Hikaye Başlat
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Evren</label>
                  <select 
                    value={activeUniverse}
                    onChange={(e) => setActiveUniverse(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 text-white py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="seferverse">SeferVerse</option>
                    <option value="neondreams">Neon Dreams</option>
                    <option value="kadersizler">Kadersizlers</option>
                    <option value="eco-os">Eco-OS</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">AI Model</label>
                  <select 
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 text-white py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="grok">xAI Grok</option>
                    <option value="gemini">Google Gemini 2.0 Flash</option>
                    <option value="openai">OpenAI GPT-4o</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Karakter</label>
                  <select 
                    value={aiCharacter}
                    onChange={(e) => setAiCharacter(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 text-white py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Karakter Seçin veya Yazın...</option>
                    {characters.map((char: any) => (
                      <option key={char.id} value={char.name}>{char.name} ({char.universe_id || char.universe})</option>
                    ))}
                  </select>
                  <Input 
                    placeholder="Veya manuel karakter adı yazın..." 
                    value={aiCharacter}
                    onChange={(e) => setAiCharacter(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white mt-2"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Tema / Tür</label>
                  <Input 
                    placeholder="Örn: Gizem, Cyberpunk, Soft Romantik..." 
                    value={aiTheme}
                    onChange={(e) => setAiTheme(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Başlangıç Durumu (Prompt)</label>
                  <textarea 
                    placeholder="Hikaye nasıl başlasın?" 
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="w-full h-24 bg-gray-800 border border-gray-700 rounded-md p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button 
                  onClick={() => startAIQuestMutation.mutate()}
                  disabled={startAIQuestMutation.isPending}
                  className="w-full btn btn-primary bg-indigo-600 hover:bg-indigo-700"
                >
                  {startAIQuestMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4 mr-2" />
                  )}
                  Hikayeyi Yaz ve Başlat
                </button>
              </div>
            </DialogContent>
          </Dialog>

          <button 
            onClick={() => setTestMode(!testMode)}
            className={`btn ${testMode ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Play className="h-4 w-4 mr-2" />
            {testMode ? 'Test Modunda' : 'Manuel Test'}
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

      {/* Test Mode */}
      {testMode && (
        <div className="card p-6 border-indigo-500/30">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
            <Play className="h-5 w-5 text-indigo-400" />
            Aktif Hikaye Simülasyonu
          </h2>
          
          {!testRunId ? (
            <button 
              onClick={() => startTestMutation.mutate()}
              disabled={startTestMutation.isPending}
              className="btn btn-primary"
            >
              {startTestMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Hikayeyi Başlat (Varsayılan)
            </button>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Visual */}
              <div className="space-y-4">
                {/* Scene Card */}
                <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
                  {/* Image Area */}
                  <div className="relative aspect-video bg-black">
                    {testFileUrl ? (
                      <img src={testFileUrl} alt="Scene" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2 px-6 text-center">
                        <ImageIcon className="h-12 w-12 opacity-20" />
                        <div className="text-sm text-gray-400">
                          Görsel üretilmedi (fallback/cache yok).
                        </div>
                        {testMeta?.asset_source && (
                          <div className="text-[11px] font-mono text-gray-500">
                            asset_source: {String(testMeta.asset_source)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Text Area */}
                  <div className="p-6 bg-gray-800/50 border-t border-gray-700">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-indigo-500/10 rounded-lg shrink-0">
                        <Bot className="h-5 w-5 text-indigo-400" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-gray-200 text-base leading-relaxed font-medium whitespace-pre-wrap">
                          {formatCaption(testCaption)}
                        </p>
                        {testOptions.length === 0 && (
                          <p className="text-sm text-indigo-400 font-medium animate-pulse">
                            Hikaye sonuna ulaşıldı.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Controls */}
              <div className="space-y-6">
                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                  <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">
                    Seçenekler
                  </h3>
                  <div className="space-y-3">
                    {testOptions.length > 0 ? (
                      testOptions.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => choiceMutation.mutate({ 
                            questionId: testQuestionId, 
                            choiceId: opt.id 
                          })}
                          disabled={choiceMutation.isPending}
                          className="w-full p-4 bg-gray-700 hover:bg-gray-600 border border-gray-600 hover:border-indigo-500 rounded-lg text-left transition-all flex items-center justify-between group"
                        >
                          <span className="text-gray-200 group-hover:text-white">{opt.label}</span>
                          <ChevronRight className="h-4 w-4 text-gray-500 group-hover:text-indigo-400" />
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        Hikaye sonu veya seçenek yok.
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setTestRunId(null)
                      setTestCaption('')
                      setTestFileUrl('')
                      setTestOptions([])
                    }}
                    className="btn btn-secondary flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sıfırla
                  </button>
                  {testFileUrl && (
                    <a 
                      href={testFileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-ghost flex-1"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Görseli Aç
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scenes Grid */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-400" />
            Hikaye Sahneleri
          </h2>
          
          <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
            <button
              onClick={() => setScenesFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                scenesFilter === 'all' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setScenesFilter('ending')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                scenesFilter === 'ending' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Sadece Sonlar
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredScenes.map((scene: SceneInfo) => (
            <div 
              key={scene.scene_key}
              onClick={() => handleSceneClick(scene)}
              className="group relative overflow-hidden rounded-xl border border-gray-700 bg-gray-800 aspect-[4/3] hover:border-indigo-500/50 transition-all cursor-pointer"
            >
              {/* Background Image */}
              {scene.image_url ? (
                <div className="absolute inset-0">
                  <img 
                    src={scene.image_url} 
                    alt={scene.scene_id} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90 group-hover:opacity-80 transition-opacity" />
                </div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-gray-700" />
                </div>
              )}

              {/* Content */}
              <div className="absolute inset-0 p-5 flex flex-col justify-end">
                <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      scene.type === 'ending' ? 'bg-yellow-500/20 text-yellow-200' :
                      scene.type === 'start' ? 'bg-blue-500/20 text-blue-200' :
                      'bg-gray-500/20 text-gray-200'
                    }`}>
                      {scene.ending_type || scene.type}
                    </span>
                    {scene.mood && (
                      <span className="text-[10px] text-gray-300 bg-black/30 px-2 py-0.5 rounded-full backdrop-blur-sm">
                        {scene.mood}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">
                    {scene.scene_id}
                  </h3>
                  
                  <p className="text-sm text-gray-300 line-clamp-2 leading-snug mb-3 opacity-0 group-hover:opacity-100 transition-opacity delay-100 whitespace-pre-wrap">
                    {formatCaption(scene.caption)}
                  </p>
                  
                  {scene.image_url && (
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(scene.image_url!);
                          toast.success('URL kopyalandı');
                        }}
                        className="p-1.5 bg-white/10 hover:bg-white/20 rounded-md backdrop-blur-md text-white transition-colors"
                        title="URL Kopyala"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <a 
                        href={scene.image_url}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-1.5 bg-white/10 hover:bg-white/20 rounded-md backdrop-blur-md text-white transition-colors"
                        title="Büyüt"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scene Details Dialog */}
      <Dialog open={sceneDetailsOpen} onOpenChange={setSceneDetailsOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Film className="h-5 w-5 text-indigo-400" />
              {selectedScene?.scene_id}
            </DialogTitle>
            <DialogDescription className="text-gray-400 mt-2 whitespace-pre-wrap">
              {formatCaption(selectedScene?.caption)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Prompt Info */}
            {selectedScene?.prompt && (
              <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Prompt</h4>
                <p className="text-xs text-gray-400 font-mono whitespace-pre-wrap bg-black/30 p-3 rounded max-h-32 overflow-y-auto">
                  {selectedScene.prompt}
                </p>
              </div>
            )}

            {/* Asset Gallery */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center justify-between">
                <span>Üretilen Varyasyonlar ({sceneAssetsData?.data?.assets?.length || 0})</span>
                <span className="text-xs text-gray-500">Tüm zamanlar</span>
              </h4>
              
              {isAssetsLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-6 w-6 text-indigo-500 animate-spin" />
                </div>
              ) : sceneAssetsData?.data?.assets && sceneAssetsData.data.assets.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {sceneAssetsData.data.assets.map((asset: any) => (
                    <div key={asset.key} className="group relative aspect-square rounded-lg overflow-hidden border border-gray-800 bg-black">
                      <img src={asset.url} alt={asset.key} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <div className="flex gap-2">
                          <a 
                            href={asset.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md text-white"
                            title="Büyüt"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(asset.url)
                              toast.success('URL kopyalandı')
                            }}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md text-white"
                            title="Kopyala"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <button 
                          onClick={() => {
                            // TODO: Implement best asset selection API
                            toast.success('Bu görsel "En İyi" olarak işaretlendi (Demo)')
                          }}
                          className="mt-2 px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 rounded-full text-xs font-bold text-white flex items-center gap-1 backdrop-blur-md transition-all transform hover:scale-105"
                        >
                          <Star className="h-3 w-3 fill-current" />
                          Bunu Seç
                        </button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent text-[10px] text-gray-400 truncate">
                        {new Date(asset.last_modified).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 border border-dashed border-gray-800 rounded-lg">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p>Henüz görsel üretilmemiş.</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Instagram Export (Fixed) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">
            <Instagram className="h-5 w-5 inline mr-2 text-pink-500" />
            Instagram Export
          </h2>
          
          <div className="space-y-4">
            {testFileUrl && (
              <div>
                <p className="text-sm text-gray-400 mb-2">Aktif Sahne:</p>
                <div className="relative rounded-lg overflow-hidden max-w-xs border border-gray-700">
                  <img src={testFileUrl} alt="Export" className="w-full" />
                </div>
              </div>
            )}
            
            <div>
              <p className="text-sm text-gray-400 mb-2">Story Caption:</p>
              <div className="bg-gray-800 rounded-lg p-4 text-sm border border-gray-700">
                <p className="text-gray-200 whitespace-pre-line">
{`🌌 SeferVerse

${testCaption ? testCaption : 'Ardında yanmış toprak.\nÖnünde bilinmeyen.'}

Kaderi yazan sensin.

🔗 Bio'daki linkten hikayeye katıl`}
                </p>
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`🌌 SeferVerse\n\n${testCaption}\n\nKaderi yazan sensin.\n\n🔗 Bio'daki linkten hikayeye katıl`)
                  toast.success('Caption kopyalandı!')
                }}
                className="btn btn-ghost text-sm mt-2 w-full"
              >
                <Copy className="h-4 w-4 mr-2" />
                Caption Kopyala
              </button>
            </div>

            <button 
              className="btn btn-primary w-full bg-gradient-to-r from-purple-600 to-pink-600 border-none"
              onClick={() => toast.success('Story paketi hazırlanıyor... (Demo)')}
            >
              <Instagram className="h-4 w-4 mr-2" />
              Story Paketi İndir (ZIP)
            </button>
          </div>
        </div>

        {/* Branching Diagram */}
        {config && (
          <div className="card p-0 overflow-hidden h-fit">
            <div className="p-6 border-b border-gray-700 bg-gray-800/50">
              <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
                <Grid3x3 className="h-5 w-5 text-purple-400" />
                Hikaye Dallanma Haritası
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Evren: {config.universe || config.universe_id} • Entry: {config.entry_id}
              </p>
            </div>
            
            <div className="bg-gray-900/50 overflow-x-auto custom-scrollbar">
              <BranchingVisualizer stats={analyticsData?.data?.choice_stats} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default StoryQuestManager;
