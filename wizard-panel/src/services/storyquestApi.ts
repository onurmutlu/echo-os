import axios from 'axios'

const normalizeBaseURL = (base: string) => base.replace(/\/+$/, '')

// StoryQuest API
// - Default: same-origin (/api/storyquest) so Vite proxy can handle it in dev (avoids CORS)
// - Override with VITE_STORYQUEST_BASE_URL when needed (e.g. direct remote)
const getStoryquestBaseURL = () => {
  const envBase = import.meta.env?.VITE_STORYQUEST_BASE_URL as string | undefined
  return normalizeBaseURL(envBase || '/api/storyquest')
}

export const storyquestApi = axios.create({
  baseURL: getStoryquestBaseURL(),
  timeout: 60000,
})

// Types
export interface StoryRun {
  run_id: string
  user_id?: number
  user_identifier: string
  universe: string
  status: 'active' | 'completed' | 'abandoned'
  step_count: number
  started_at: string
  ended_at?: string
  is_canonical: boolean
}

export interface StoryRunStep {
  id: number
  run_id: string
  step_index: number
  question_id: string
  choice_id: string
  scene_id: string
  prompt: string
  asset_url?: string
  duration_sec: number
  created_at: string
}

export interface CTAOption {
  id: string
  label: string
}

export interface StartResponse {
  run_id: string
  file_url?: string
  caption: string
  meta?: any
  cta?: {
    question_id: string
    question: string
    options: CTAOption[]
  }
}

export interface ChoiceResponse {
  run_id: string
  file_url?: string
  caption: string
  meta?: any
  cta?: {
    question_id: string
    question: string
    options: CTAOption[]
  }
  is_final?: boolean
  ending_type?: string
  reward?: {
    nasip: number
    xp: number
    badge?: string
  }
}

export interface BranchingConfig {
  id: string
  universe: string
  entry_id: string
  title: string
  scenes: Record<string, any>
  meta: Record<string, any>
}

export interface EndingInfo {
  scene_key: string
  scene_id: string
  ending_type: string
  mood: string
}

export interface SceneInfo {
  scene_key: string
  scene_id: string
  type: 'start' | 'scene' | 'question' | 'ending' | 'flashback'
  caption: string
  prompt?: string
  image_url?: string
  mood?: string
  ending_type?: string
}

export interface AIQuestRequest {
  universe: string
  character_name: string
  theme: string
  prompt: string
  model: string
}

export interface AIQuestChoiceRequest {
  run_id: string
  choice_id: string
  choice_label?: string
}

export interface StoryStats {
  universe: string
  total_runs: number
  active_runs: number
  completed_runs: number
  total_steps: number
  avg_duration_sec: number
}

// API Methods
export const storyquestApiService = {
  getStats: (universe: string): Promise<{ data: StoryStats }> =>
    storyquestApi.get(`/stats/${universe}`),

  // Terminal Esintisi
  terminal: {
    start: (userIdentifier: string, seed = 2025): Promise<{ data: StartResponse }> =>
      storyquestApi.post('/terminal/start', {
        user_identifier: userIdentifier,
        seed,
      }),

    choice: (runId: string, questionId: string, choiceId: string): Promise<{ data: ChoiceResponse }> =>
      storyquestApi.post('/terminal/choice', {
        run_id: runId,
        question_id: questionId,
        choice_id: choiceId,
      }),

    getConfig: (): Promise<{ data: BranchingConfig }> =>
      storyquestApi.get('/terminal/config'),

    getEndings: (): Promise<{ data: { endings: EndingInfo[], canonical_path: string } }> =>
      storyquestApi.get('/terminal/endings'),

    getScenes: (): Promise<{ data: { scenes: SceneInfo[], canonical_path: string } }> =>
      storyquestApi.get('/terminal/scenes'),

    getSceneAssets: (sceneId: string, universe: string = 'seferverse'): Promise<{ data: { assets: any[] } }> =>
      storyquestApi.get(`/terminal/scenes/${sceneId}/assets`, { params: { universe } }),

    scoreReply: (runId: string, userReply: string): Promise<{ data: any }> =>
      storyquestApi.post('/terminal/score_reply', {
        run_id: runId,
        user_reply: userReply,
      }),

    getAssets: (universe?: string, limit?: number, prefix?: string): Promise<{ data: any }> =>
      storyquestApi.get('/terminal/assets', {
        params: { universe, limit, prefix },
      }),
      
    startAI: (request: AIQuestRequest): Promise<{ data: any }> =>
      storyquestApi.post('/terminal/ai/start', request),

    aiChoice: (request: AIQuestChoiceRequest): Promise<{ data: any }> =>
      storyquestApi.post('/terminal/ai/choice', request),

    getChoiceAnalytics: (universe: string = 'seferverse'): Promise<{ data: { choice_stats: Record<string, { total: number, choices: Record<string, { count: number, percent: number }> }> } }> =>
      storyquestApi.get(`/terminal/analytics/choices/${universe}`),

    // Sora Video Generation
    generateSoraVideo: (request: {
      prompt: string
      duration?: number
      resolution?: string
      model?: string
      seed?: number
      input_image_url?: string
      wait_for_completion?: boolean
    }): Promise<{ data: {
      job_id: string
      status: string
      prompt: string
      duration?: number
      resolution?: string
      seed?: number
      video_url?: string
      error?: string
    } }> =>
      storyquestApi.post('/terminal/sora/generate', request),

    getSoraJobStatus: (jobId: string): Promise<{ data: {
      job_id: string
      status: string
      progress: number
      assets: Array<{ type: string; url: string }>
      error: string | null
      metadata: any
    } }> =>
      storyquestApi.get(`/terminal/sora/job/${jobId}/status`),
  },

  // Neon Awakening
  neon: {
    start: (userIdentifier: string, seed = 2025): Promise<{ data: StartResponse }> =>
      storyquestApi.post('/neon/start', {
        user_identifier: userIdentifier,
        seed,
      }),

    choice: (runId: string, questionId: string, choiceId: string): Promise<{ data: ChoiceResponse }> =>
      storyquestApi.post('/neon/choice', {
        run_id: runId,
        question_id: questionId,
        choice_id: choiceId,
      }),

    getConfig: (): Promise<{ data: any }> =>
      storyquestApi.get('/neon/config'),
  },

  // Runs
  runs: {
    getAll: (): Promise<{ data: StoryRun[] }> =>
      storyquestApi.get('/runs'),

    getById: (runId: string): Promise<{ data: StoryRun }> =>
      storyquestApi.get(`/runs/${runId}`),

    getSteps: (runId: string): Promise<{ data: StoryRunStep[] }> =>
      storyquestApi.get(`/runs/${runId}/steps`),

    export: (runId: string): Promise<{ data: any }> =>
      storyquestApi.post(`/runs/${runId}/export`),

    markCanonical: (runId: string): Promise<{ data: any }> =>
      storyquestApi.post(`/runs/${runId}/mark-canonical`),

    toSequence: (runId: string): Promise<{ data: any }> =>
      storyquestApi.post(`/runs/${runId}/to-sequence`),
  },
}

export default storyquestApiService
