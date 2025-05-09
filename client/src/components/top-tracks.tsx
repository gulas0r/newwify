import { useTranslation } from "react-i18next";
import { SpotifyTopTrack } from "@/hooks/use-spotify";

interface TopTracksProps {
  tracks: SpotifyTopTrack[];
  className?: string;
}

export default function TopTracks({ tracks, className = "" }: TopTracksProps) {
  const { t } = useTranslation();
  
  // Show up to 5 tracks as requested
  const displayTracks = tracks.slice(0, 5);
  
  // Get top artist (most frequent in top tracks)
  const topArtistMap = new Map<string, number>();
  tracks.forEach(track => {
    const count = topArtistMap.get(track.artistName) || 0;
    topArtistMap.set(track.artistName, count + 1);
  });
  
  let topArtist = "";
  let maxCount = 0;
  topArtistMap.forEach((count, artist) => {
    if (count > maxCount) {
      maxCount = count;
      topArtist = artist;
    }
  });
  
  return (
    <div className={`px-4 py-3 ${className}`}>
      <h3 className="text-center font-bold text-2xl font-newspaper-title border-b-2 border-newspaper-black pb-1 mb-4">
        {t("tracks.title")}
      </h3>
      
      <div className="flex flex-col md:flex-row">
        {/* Left column - Track list */}
        <div className="w-full md:w-1/2 pr-0 md:pr-3 column-rule">
          <div className="mb-3 text-xs font-body font-semibold italic text-center">
            {t("tracks.subtitle")}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-1 gap-x-4">
            {/* List of 5 tracks */}
            <ol className="list-decimal pl-5 text-sm font-body">
              {displayTracks.map((track) => (
                <li key={track.id} className="mb-2">
                  <span className="font-bold">{track.trackName}</span>
                  <span className="text-xs block mt-0.5 italic">by {track.artistName}</span>
                  {track.albumName && (
                    <span className="text-xs block mt-0.5 text-gray-600">from "{track.albumName}"</span>
                  )}
                </li>
              ))}
              
              {/* If we have fewer than 5 tracks, fill with empty list items */}
              {Array.from({ length: Math.max(0, 5 - displayTracks.length) }).map((_, index) => (
                <li key={`empty-${index}`} className="mb-2 text-gray-400">
                  <span className="font-medium">-</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        
        {/* Right column - Music sidebars */}
        <div className="w-full md:w-1/2 pl-0 md:pl-3 border-l border-newspaper-border">
          <div className="border border-newspaper-border p-2 mb-3 bg-newspaper-badge/20">
            <h4 className="text-center font-bold text-sm font-newspaper-title border-b border-newspaper-border/50 pb-1 mb-1">
              {t("musicDiary.title")}
            </h4>
            <p className="text-xs font-body leading-relaxed">
              {t("musicDiary.text")}
            </p>
          </div>
          
          <div className="border border-newspaper-border p-2 mb-3 bg-newspaper-badge/20">
            <h4 className="text-center font-bold text-sm font-newspaper-title border-b border-newspaper-border/50 pb-1 mb-1">
              {t("tapeRewound.title")}
            </h4>
            <p className="text-xs font-body leading-relaxed">
              {topArtist ? t("tapeRewound.textWithArtist", { artist: topArtist }) : t("tapeRewound.text")}
            </p>
          </div>
          
          <div className="border border-newspaper-border p-2 bg-newspaper-badge/20">
            <h4 className="text-center font-bold text-sm font-newspaper-title border-b border-newspaper-border/50 pb-1 mb-1">
              {t("genreSpotlight.title")}
            </h4>
            <p className="text-xs font-body leading-relaxed">
              {t("genreSpotlight.text")}
            </p>
            <div className="text-right text-xs italic mt-2">
              <span>{t("newify.staff")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
