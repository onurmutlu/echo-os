import { useEffect, useState } from "react";
import { Badge } from "lucide-react"; // Using lucide icon as placeholder if Badge UI component is not standard

interface Story {
  id: string;
  title: string;
  status: string;
  description: string;
}

interface StoriesTabsProps {
  initial?: string;
  onStoryChange?: (storyId: string) => void;
}

const API_BASE_URL = "/api";

export default function StoriesTabs({ initial = "kadersizler", onStoryChange }: StoriesTabsProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [active, setActive] = useState(initial);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/stories/`)
      .then(r => {
        if (!r.ok) throw new Error("Failed to fetch stories");
        return r.json();
      })
      .then(data => {
        const storiesList = (data.stories || []).map((s: any) => ({
          id: s.id,
          title: s.title,
          status: s.status,
          description: s.description
        }));
        setStories(storiesList);
        setLoading(false);
        
        // If no stories found, use defaults for UI testing
        if (storiesList.length === 0) {
            setStories([
                { id: "kadersizler", title: "Kadersizler", status: "active", description: "Ana Evren" },
                { id: "seferverse", title: "SeferVerse", status: "active", description: "Yan Evren" },
                { id: "lighthouse", title: "Lighthouse", status: "active", description: "Deneme" }
            ]);
        }
      })
      .catch(err => {
        console.error("Failed to load stories:", err);
        // Fallback for development/offline
        setStories([
            { id: "kadersizler", title: "Kadersizler", status: "active", description: "Ana Evren" },
            { id: "seferverse", title: "SeferVerse", status: "active", description: "Yan Evren" },
            { id: "lighthouse", title: "Lighthouse", status: "active", description: "Deneme" }
        ]);
        setLoading(false);
      });
  }, []);

  const handleStoryChange = (storyId: string) => {
    setActive(storyId);
    onStoryChange?.(storyId);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4">
        <div className="animate-pulse bg-gray-700 h-10 w-32 rounded-xl"></div>
        <div className="animate-pulse bg-gray-700 h-10 w-32 rounded-xl"></div>
        <div className="animate-pulse bg-gray-700 h-10 w-32 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-4 overflow-x-auto custom-scrollbar">
      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-4 hidden sm:block">
        Evrenler:
      </div>
      {stories.map(story => (
        <button
          key={story.id}
          onClick={() => handleStoryChange(story.id)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap
            ${
              active === story.id 
                ? "bg-violet-600 text-white shadow-lg shadow-violet-900/20 scale-[1.02]" 
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200 border border-gray-700"
            }`}
        >
          {story.title}
          {story.status === "placeholder" && (
            <span className="px-1.5 py-0.5 rounded bg-gray-700 text-[10px] text-gray-400 ml-1">
              Yakında
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
