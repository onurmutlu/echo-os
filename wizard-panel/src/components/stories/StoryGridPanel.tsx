import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Activity, Grid3x3, Play, AlertTriangle, CheckCircle, FileText } from "lucide-react";
import { formatCaption } from "../../utils/htmlSanitizer";

interface StoryGridPanelProps {
  universe?: string;
  sceneCode?: string;
}

interface SVResult {
  sv: number[];
  resonance: {
    tier: string;
    score: number;
    debt: any;
  };
  anomaly: {
    score: number;
    reasons: string[];
  };
}

interface GridResult {
  grid: {
    layout: string;
    caption: string;
    hashtags: string[];
    cells: Array<{
      id: string;
      type: string;
    }>;
  };
}

const API_BASE_URL = "/api";

export default function StoryGridPanel({ universe = "kadersizler", sceneCode = "S1E1" }: StoryGridPanelProps) {
  const [text, setText] = useState("Galata'da teslimat, KD NULL okudum.");
  const [grid, setGrid] = useState<GridResult | null>(null);
  const [sv, setSv] = useState<SVResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function runProbe() {
    setLoading(true);
    try {
      // Step 1: Ingest intent and get SV
      const svResponse = await fetch(`${API_BASE_URL}/stories/${universe}/ingest-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      
      if (!svResponse.ok) {
        throw new Error(`SV analizi başarısız: ${svResponse.status}`);
      }
      
      const svData: SVResult = await svResponse.json();
      setSv(svData);

      // Step 2: Generate 9-grid
      const gridResponse = await fetch(`${API_BASE_URL}/stories/${universe}/grid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          sceneCode, 
          sv: svData.sv 
        })
      });
      
      if (!gridResponse.ok) {
        throw new Error(`Grid oluşturma başarısız: ${gridResponse.status}`);
      }
      
      const gridData: GridResult = await gridResponse.json();
      setGrid(gridData);
      
    } catch (error) {
      console.error("Probe failed:", error);
      alert(`İşlem başarısız: ${error}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
          <Activity className="h-5 w-5 text-emerald-400" />
          SV Analizi + 9-Grid Oluşturucu
        </h2>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Intent Metni (Senaryo / Fikir)
          </label>
          <textarea
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-100 focus:outline-none focus:border-violet-500 min-h-[100px]"
            value={text}
            onChange={e => setText(e.target.value)}
            rows={3}
            placeholder="Buraya bir sahne fikri veya senaryo parçası yazın..."
          />
        </div>
        
        <div className="flex items-center justify-between bg-gray-800/50 p-3 rounded-xl border border-gray-700">
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span>Evren: <span className="text-gray-200 font-medium ml-1">{universe}</span></span>
            <span className="text-gray-600">|</span>
            <span>Sahne: <span className="text-gray-200 font-medium ml-1">{sceneCode}</span></span>
          </div>
          
          <button 
            onClick={runProbe} 
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Analiz Ediliyor...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Analiz Et + Grid Oluştur
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SV Results */}
        {sv && (
          <div className="card p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-400" />
              Spectral Vector Analizi
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  Rezonans
                </h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Seviye:</span>
                    <span className={`font-mono font-bold ${sv.resonance.tier === 'IV' ? 'text-red-400' : 'text-emerald-400'}`}>
                      {sv.resonance.tier}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Skor:</span>
                    <span className="font-mono text-gray-200">{sv.resonance.score.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Borç:</span>
                    <span className="text-xs text-gray-400">{sv.resonance.debt.type}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  Anomali
                </h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Skor:</span>
                    <span className="font-mono text-gray-200">{sv.anomaly.score.toFixed(3)}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-700">
                    {sv.anomaly.reasons.length > 0 ? sv.anomaly.reasons.join(", ") : "Anomali yok"}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
              <h4 className="text-sm font-medium text-gray-400 mb-2">SV Vektörü</h4>
              <div className="text-xs font-mono text-gray-500 break-all">
                [{sv.sv.map(v => v.toFixed(3)).join(", ")}]
              </div>
            </div>
          </div>
        )}

        {/* 9-Grid Results */}
        {grid && (
          <div className="card p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
              <Grid3x3 className="h-5 w-5 text-violet-400" />
              9-Grid Önizleme
            </h3>
            
            {/* Grid Layout */}
            <div className="flex justify-center bg-gray-900/50 p-4 rounded-xl border border-gray-700">
              <div className="grid grid-cols-3 gap-2 max-w-[300px] w-full">
                {grid.grid.cells.map((cell, i) => (
                  <div 
                    key={i} 
                    className="aspect-square border border-gray-700 bg-gray-800 rounded-lg flex flex-col items-center justify-center text-xs hover:border-violet-500 hover:bg-gray-750 transition-all group cursor-pointer"
                  >
                    <div className="font-bold text-violet-400 group-hover:text-violet-300 text-lg">{cell.id}</div>
                    <div className="text-[10px] text-gray-500 group-hover:text-gray-400 uppercase tracking-tighter">{cell.type}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Caption & Hashtags */}
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 space-y-3">
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-1 flex items-center gap-2">
                  <FileText className="h-3 w-3" />
                  Caption
                </h4>
                <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{formatCaption(grid.grid.caption)}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Etiketler</h4>
                <div className="flex flex-wrap gap-1.5">
                  {grid.grid.hashtags.map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 bg-violet-900/30 border border-violet-500/30 rounded text-xs text-violet-300">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
