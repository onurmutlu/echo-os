import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Activity, 
  Clock, 
  CheckCircle, 
  MessageCircle, 
  Globe, 
  Terminal, 
  Search,
  User
} from 'lucide-react';
import { storyquestApiService } from '../services/storyquestApi';

// Player Stats interface matching the API response
interface PlayerStats {
  user_identifier: string;
  user_display_name?: string;
  user_username?: string;
  user_photo_url?: string;
  total_runs: number;
  completed_runs: number;
  last_active: string | null;
  first_active: string | null;
  total_duration: number;
  platforms: string[];
}

export const PlayerList: React.FC = () => {
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [universe, setUniverse] = useState('seferverse');

  useEffect(() => {
    fetchPlayers();
  }, [universe]);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      // We use the service method directly if we add it, or we can use fetch.
      // Since getPlayers is not yet in the typed service interface (I need to add it),
      // I'll use a direct axios call using the imported instance if available,
      // but for now let's assume I'll update the service properly in next step.
      
      // Or even better, let's use fetch with correct URL construction since I can't access storyquestApi.BASE_URL easily if not exported.
      // Actually, I exported storyquestApi in the previous step.
      // But let's stick to the pattern.
      
      const response = await fetch(`/api/storyquest/terminal/players/${universe}`);
      if (response.ok) {
        const data = await response.json();
        setPlayers(data.players || []);
      }
    } catch (error) {
      console.error('Failed to fetch players:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlayers = players.filter(player => 
    player.user_identifier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('tr-TR');
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'telegram': return <MessageCircle className="h-4 w-4 text-blue-400" />;
      case 'discord': return <Activity className="h-4 w-4 text-indigo-400" />;
      case 'web/api': return <Globe className="h-4 w-4 text-green-400" />;
      default: return <Terminal className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="h-8 w-8 text-echo-500" />
            Oyuncular
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {universe === 'seferverse' ? 'SeferVerse' : universe} evrenindeki aktif hikaye yolcuları
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Oyuncu ID ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-sm w-64"
          />
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">Toplam Oyuncu</div>
          <div className="text-2xl font-bold">{players.length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">Toplam Oturum</div>
          <div className="text-2xl font-bold text-blue-500">
            {players.reduce((acc, p) => acc + p.total_runs, 0)}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">Tamamlanan</div>
          <div className="text-2xl font-bold text-green-500">
            {players.reduce((acc, p) => acc + p.completed_runs, 0)}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">Toplam Süre</div>
          <div className="text-2xl font-bold text-purple-500">
            {formatDuration(players.reduce((acc, p) => acc + p.total_duration, 0))}
          </div>
        </div>
      </div>

      {/* Player Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Yükleniyor...</div>
        ) : filteredPlayers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">Oyuncu bulunamadı.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-xs uppercase text-gray-500">
                  <th className="px-6 py-3 font-medium">Oyuncu ID</th>
                  <th className="px-6 py-3 font-medium">Platform</th>
                  <th className="px-6 py-3 font-medium text-center">Oturumlar</th>
                  <th className="px-6 py-3 font-medium text-center">Tamamlanan</th>
                  <th className="px-6 py-3 font-medium">Toplam Süre</th>
                  <th className="px-6 py-3 font-medium">Son Aktivite</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPlayers.map((player) => (
                  <tr 
                    key={player.user_identifier}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {player.user_photo_url ? (
                          <img 
                            src={player.user_photo_url} 
                            alt={player.user_display_name || player.user_identifier} 
                            className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600 shadow-sm"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-echo-100 dark:bg-echo-900/30 flex items-center justify-center text-echo-600 border border-gray-200 dark:border-gray-600">
                            <User className="h-5 w-5" />
                          </div>
                        )}
                        <div className="flex flex-col">
                          {player.user_display_name ? (
                            <>
                              <span className="font-bold text-sm text-gray-900 dark:text-white">
                                {player.user_display_name}
                              </span>
                              <span className="text-xs text-gray-500 font-mono">
                                {player.user_username ? `@${player.user_username}` : player.user_identifier}
                              </span>
                            </>
                          ) : (
                            <span className="font-medium font-mono text-sm">
                              {player.user_identifier}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {player.platforms.map(p => (
                          <div key={p} className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                            {getPlatformIcon(p)}
                            <span>{p}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold">{player.total_runs}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-bold ${player.completed_runs > 0 ? 'text-green-500' : 'text-gray-400'}`}>
                        {player.completed_runs}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDuration(player.total_duration)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(player.last_active)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerList;

