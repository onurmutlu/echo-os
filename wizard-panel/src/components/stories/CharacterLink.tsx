import { useState } from "react";
import { ArrowRight, User, MapPin, RefreshCw, Clock, CheckCircle, AlertTriangle, MoveRight } from "lucide-react";
import toast from "react-hot-toast";

interface CharacterLinkProps {
  refId: string; // verse:entityType:slug
  to: string;    // verse:entityType:slug
  onVisit?: (from: string, to: string) => void;
}

const API_BASE_URL = "/api";

export function CharacterLink({ refId, to, onVisit }: CharacterLinkProps) {
  const [loading, setLoading] = useState(false);
  const [lastVisit, setLastVisit] = useState<string | null>(null);

  async function handleVisit() {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/stories/visit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actor: refId,
          target: to,
          reason: "echo_test",
          constraints: { cooldownMin: 300 }
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || `Ziyaret başarısız: ${response.status}`);
      }

      if (result.status === "VISIT_OK") {
        setLastVisit(new Date().toLocaleTimeString());
        onVisit?.(refId, to);
        toast.success(`Ziyaret başarılı: ${parseRefId(refId).slug} → ${parseRefId(to).verse}`);
      } else if (result.status === "VISIT_BLOCKED") {
        toast.error(`Ziyaret engellendi: ${result.message}`);
      } else {
        toast(result.message, { icon: '⚠️' });
      }
    } catch (error: any) {
      console.error("Visit failed:", error);
      toast.error(`Ziyaret hatası: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  const parseRefId = (ref: string) => {
    const parts = ref.split(":");
    return {
      verse: parts[0] || "Bilinmeyen",
      type: parts[1] || "entity", 
      slug: parts[2] || "isimsiz"
    };
  };

  const from = parseRefId(refId);
  const target = parseRefId(to);

  const getTypeIcon = (type: string) => {
    if (type === "char" || type === "character") return <User className="h-3 w-3" />;
    if (type === "loc" || type === "location") return <MapPin className="h-3 w-3" />;
    return <div className="h-3 w-3 rounded-full bg-current" />;
  };

  const getVerseColor = (verse: string) => {
    switch(verse.toLowerCase()) {
      case "kadersizler": return "text-amber-400 bg-amber-900/20 border-amber-500/30";
      case "seferverse": return "text-blue-400 bg-blue-900/20 border-blue-500/30";
      case "baronverse": return "text-purple-400 bg-purple-900/20 border-purple-500/30";
      default: return "text-gray-400 bg-gray-800 border-gray-700";
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-xl bg-gray-800 border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:shadow-lg hover:shadow-violet-900/10">
      <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* FROM Node */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className={`p-2 rounded-lg border ${getVerseColor(from.verse)}`}>
            {getTypeIcon(from.type)}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider opacity-70 text-gray-400">{from.verse}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-100">{from.slug}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-400 border border-gray-600 capitalize">{from.type}</span>
            </div>
          </div>
        </div>

        {/* Action Arrow */}
        <div className="flex flex-col items-center justify-center mx-2">
          <div className="relative">
            <div className="absolute inset-0 bg-violet-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <button
              onClick={handleVisit}
              disabled={loading}
              className="relative z-10 p-2 rounded-full bg-gray-700 border border-gray-600 text-gray-400 hover:text-violet-400 hover:border-violet-500 hover:bg-gray-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
            >
              {loading ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <MoveRight className="h-5 w-5 group-hover/btn:translate-x-0.5 transition-transform" />
              )}
            </button>
          </div>
          {lastVisit && (
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-max opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-gray-900 px-2 py-0.5 rounded border border-gray-700">
                <CheckCircle className="h-3 w-3" />
                {lastVisit}
              </span>
            </div>
          )}
        </div>

        {/* TO Node */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end sm:justify-start">
          <div className="flex flex-col items-end sm:items-start text-right sm:text-left">
            <span className="text-xs font-bold uppercase tracking-wider opacity-70 text-gray-400">{target.verse}</span>
            <div className="flex items-center gap-2 flex-row-reverse sm:flex-row">
              <span className="text-sm font-bold text-gray-100">{target.slug}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-400 border border-gray-600 capitalize">{target.type}</span>
            </div>
          </div>
          <div className={`p-2 rounded-lg border ${getVerseColor(target.verse)}`}>
            {getTypeIcon(target.type)}
          </div>
        </div>

      </div>
      
      {/* Animated Progress Bar (Loading State) */}
      {loading && (
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-700 overflow-hidden">
          <div className="h-full bg-violet-500 animate-progress-indeterminate"></div>
        </div>
      )}
    </div>
  );
}

// Example usage component
export function CrossVerseExample() {
  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div className="bg-blue-900/20 border border-blue-500/20 p-4 rounded-xl flex items-start gap-3">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <RefreshCw className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h4 className="text-sm font-medium text-blue-300">Cross-Verse Transferleri</h4>
          <p className="text-xs text-blue-400/70 mt-1">
            Karakter ve nesnelerin evrenler arası geçişini simüle edin. 
            Her geçiş <strong>Lore-Check</strong> ve <strong>Consistency-Check</strong> süreçlerinden geçer.
          </p>
        </div>
      </div>

      {/* Links List */}
      <div className="grid gap-3">
        <CharacterLink 
          refId="kadersizler:char:baran" 
          to="seferverse:loc:terminal"
          onVisit={(from, to) => console.log(`Transfer: ${from} → ${to}`)}
        />
        
        <CharacterLink 
          refId="kadersizler:char:devran" 
          to="baronverse:loc:manor"
          onVisit={(from, to) => console.log(`Transfer: ${from} → ${to}`)}
        />
        
        <CharacterLink 
          refId="seferverse:char:baron" 
          to="kadersizler:loc:galata"
          onVisit={(from, to) => console.log(`Transfer: ${from} → ${to}`)}
        />
      </div>
    </div>
  );
}
