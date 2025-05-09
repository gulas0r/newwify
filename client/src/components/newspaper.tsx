import { useRef, forwardRef, useState } from "react";
import html2canvas from "html2canvas";
import { useTranslation } from "react-i18next";
import { SpotifyUserData } from "@/hooks/use-spotify";
import LanguageSwitcher from "./language-switcher";
import ShareButtons from "./share-buttons";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface NewspaperProps {
  userData?: SpotifyUserData;
  onLogin: () => void;
  isLoading: boolean;
}

// Use forwardRef to pass the ref to the div element
const Newspaper = forwardRef<HTMLDivElement, NewspaperProps>(
  ({ userData, onLogin, isLoading }, ref) => {
    const { t } = useTranslation();
    const [exporting, setExporting] = useState(false);
    const newspaperRef = useRef<HTMLDivElement | null>(null);
    
    // Export newspaper as PNG
    const exportAsPng = async () => {
      if (!newspaperRef.current) return;
      
      setExporting(true);
      
      try {
        const canvas = await html2canvas(newspaperRef.current, {
          scale: 2, // Higher scale for better quality
          useCORS: true, // Allow loading cross-origin images
          allowTaint: true,
          backgroundColor: "#f5f0e1", // Sepia background
          onclone: (document, element) => {
            // Make sure all text elements maintain their position in the cloned document
            const allTextElements = element.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, li');
            allTextElements.forEach(el => {
              // Force text to stay in place by setting overflow and word-wrap properties
              (el as HTMLElement).style.overflow = 'visible';
              (el as HTMLElement).style.wordWrap = 'break-word';
              (el as HTMLElement).style.wordBreak = 'keep-all';
              (el as HTMLElement).style.whiteSpace = 'normal';
            });
          }
        });
        
        // Create download link
        const link = document.createElement("a");
        link.download = "newify-newspaper.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
      } catch (error) {
        console.error("Error exporting newspaper:", error);
      } finally {
        setExporting(false);
      }
    };
    
    return (
      <div className="min-h-screen p-4 flex flex-col items-center justify-center bg-sepia">
        
        <div 
          ref={(el) => {
            // Set both refs
            if (ref) {
              if (typeof ref === 'function') {
                ref(el);
              } else {
                ref.current = el;
              }
            }
            newspaperRef.current = el;
          }}
          className="newspaper max-w-md w-full mx-auto overflow-hidden shadow-lg bg-sepia border border-newspaper-border"
          style={{ aspectRatio: "9/16" }}
        >
          {userData ? (
            <>
              {/* Header with borders */}
              <div className="border-b-2 border-newspaper-black">
                <h1 className="text-4xl font-extrabold text-center uppercase font-newspaper-title tracking-tighter pt-2 pb-1">
                  {t("app.title")}
                </h1>
              </div>
              
              <div className="flex justify-between px-3 py-1 text-xs font-secondary border-b-2 border-newspaper-black">
                <div>{t("app.subtitle")}</div>
                <div className="flex items-center justify-between">
                  <span>DATE: {format(new Date(), "MM/dd/yyyy")}</span>
                </div>
              </div>
              
              <div className="flex justify-end px-3 py-1 text-xs font-secondary border-b border-newspaper-black">
                <div>{t("app.price")}</div>
              </div>
              
              {/* Main headline - User name */}
              <div className="px-4 pt-3 pb-1 text-center">
                <h2 className="text-4xl font-black uppercase font-newspaper-title leading-none tracking-tighter">
                  {userData.user.displayName || "USER"}'S<br />
                  EARS ARE ON FIRE!
                </h2>
                <p className="text-sm mt-1 font-secondary italic">
                  {t("headline.subtext")}
                </p>
                <div className="border-b border-newspaper-black mt-2"></div>
              </div>
              
              {/* User identity and top tracks/artists */}
              <div className="flex flex-row border-b border-newspaper-black">
                {/* Left column - User identity */}
                <div className="w-1/3 border-r border-newspaper-black px-3 py-2">
                  <h3 className="text-base font-bold uppercase font-newspaper-title mb-1">HERO'S IDENTITY:</h3>
                  <div className="text-xs mb-1">
                    <span className="font-bold">{t("username.label")}: </span>
                    {userData.user.displayName || "—"}
                  </div>
                  <div className="text-xs mb-1">
                    <span className="font-bold">{t("mood.label")}: </span>
                    {userData.mood ? (
                      <span className="italic">
                        {userData.mood.primary}/{userData.mood.secondary}
                      </span>
                    ) : "—"}
                  </div>
                  
                  <div className="text-xs mb-1">
                    <span className="font-bold">{t("minutes.label")}: </span>
                    {userData.totalListeningTime ? (
                      <span className="italic">
                        {userData.totalListeningTime}
                      </span>
                    ) : "—"}
                  </div>
                  
                  {/* Profile image */}
                  <div className="flex items-center justify-center my-2">
                    {userData.user.profileImage ? (
                      <img 
                        src={userData.user.profileImage} 
                        alt={userData.user.displayName || "User"} 
                        className="w-16 h-16 rounded-full border border-newspaper-black"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full border border-newspaper-black flex items-center justify-center bg-gray-200">
                        <span className="text-xs">No image</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Mood Description */}
                  {userData.mood && (
                    <div className="mt-1 mb-2">
                      <p className="text-2xs italic font-body">
                        {userData.mood.description}
                      </p>
                    </div>
                  )}
                  
                  {/* Headline story */}
                  <h4 className="text-sm font-bold uppercase font-newspaper-title mt-2">
                    {t("union.title")}
                  </h4>
                  <p className="text-2xs italic">
                    {t("union.text")}
                  </p>
                </div>
                
                {/* Right column - Top tracks/artists */}
                <div className="w-2/3 px-3 py-2">
                  <h3 className="text-xl font-bold uppercase font-newspaper-title mb-2">
                    {t("tracks.title")}
                  </h3>
                  
                  <ol className="list-decimal text-xs pl-5 mb-4">
                    {userData.topTracks.slice(0, 5).map((track, index) => (
                      <li key={track.id} className="mb-0.5 font-body">
                        <span className="font-medium">{track.trackName}</span>
                        <span className="text-2xs"> - {track.artistName}</span>
                      </li>
                    ))}
                  </ol>
                  
                  <h3 className="text-xl font-bold uppercase font-newspaper-title mb-2 mt-3">
                    {t("artists.title")}
                  </h3>
                  
                  {userData.topArtists ? (
                    <ol className="list-decimal text-xs pl-5 mb-2">
                      {userData.topArtists.slice(0, 5).map((artist, index) => (
                        <li key={artist.id} className="mb-0.5 font-body">
                          <span className="font-medium">{artist.name}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-xs italic">Artist information unavailable</p>
                  )}
                  
                  {/* Genres Section */}
                  <h3 className="text-xl font-bold uppercase font-newspaper-title mb-2 mt-3">
                    {t("genres.title")}
                  </h3>
                  
                  {userData.genres && userData.genres.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {userData.genres.map((genre, index) => (
                        <span 
                          key={index} 
                          className="text-xs bg-gray-100 px-2 py-0.5 border border-newspaper-black rounded font-body"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs italic">Genre information unavailable</p>
                  )}
                  
                  {/* Most Listened Track Section with Album Cover */}
                  {userData.mostListenedTrack && (
                    <div className="mt-3 border-t border-newspaper-black pt-2">
                      <h3 className="text-lg font-bold uppercase font-newspaper-title mb-2">
                        {t("mostListened.title")}
                      </h3>
                      
                      <div className="flex items-start">
                        {userData.mostListenedTrack.albumImage ? (
                          <img 
                            src={userData.mostListenedTrack.albumImage} 
                            alt={userData.mostListenedTrack.albumName || "Album cover"} 
                            className="w-16 h-16 object-cover border border-newspaper-black mr-2 grayscale"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 border border-newspaper-black flex items-center justify-center mr-2">
                            <span className="text-2xs">No cover</span>
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <p className="text-xs font-bold">{userData.mostListenedTrack.trackName}</p>
                          <p className="text-2xs">{userData.mostListenedTrack.artistName}</p>
                          {userData.mostListenedTrack.albumName && (
                            <p className="text-2xs italic">{userData.mostListenedTrack.albumName}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Footer quote */}
              <div className="px-4 py-2 text-xs text-center">
                <p className="font-body">
                  {t("footer.quote")}
                </p>
                
                {/* Credits */}
                <p className="text-2xs mt-1 font-secondary">
                  {t("footer.credits")}
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="animate-pulse w-20 h-20 mx-auto rounded-full bg-gray-300"></div>
                  <p className="text-lg font-secondary">{t("loading")}</p>
                </div>
              ) : (
                <>
                  {/* Modern login design */}
                  <div className="border-b-2 border-newspaper-black">
                    <h1 className="text-4xl font-extrabold text-center uppercase font-newspaper-title tracking-tighter pt-2 pb-1">
                      {t("app.title")}
                    </h1>
                  </div>
                  
                  <div className="mt-8 flex flex-col items-center">
                    <img 
                      src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_Green.png" 
                      alt="Spotify Logo" 
                      className="w-32 mb-6" 
                    />
                    
                    <div className="w-16 h-1 bg-[#1DB954] my-4"></div>
                    
                    <h2 className="text-2xl font-newspaper-title mb-3">YOUR MUSIC STORY</h2>
                    
                    <p className="text-base font-secondary mb-8 max-w-xs">
                      {t("login.instruction")}
                    </p>
                    
                    <Button 
                      onClick={onLogin}
                      className="bg-[#1DB954] text-white hover:bg-[#1aa34a] rounded-full px-8 py-3 font-bold text-sm transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                      {t("button.login")}
                    </Button>
                    
                    <p className="text-xs mt-6 text-gray-600 font-secondary">
                      Discover your musical profile in a vintage newspaper format
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        
        {/* Export, Share and Spotify login buttons */}
        <div className="mt-5 flex flex-col items-center gap-4">
          {userData && (
            <>
              <div className="flex space-x-3">
                <Button
                  onClick={exportAsPng}
                  disabled={exporting}
                  className="vintage-btn bg-vintage-red text-sepia hover:bg-[#7a2a2a] font-bold"
                >
                  {exporting ? t("loading") : t("button.download")}
                </Button>
                
                <Button
                  onClick={() => {
                    const sharePanel = document.getElementById("share-panel");
                    if (sharePanel) {
                      sharePanel.classList.toggle("hidden");
                      
                      // Set focus on first button for accessibility
                      if (!sharePanel.classList.contains("hidden")) {
                        const firstButton = sharePanel.querySelector("button");
                        if (firstButton) {
                          firstButton.focus();
                        }
                      }
                    }
                  }}
                  className="vintage-btn bg-[#1DB954] text-white hover:bg-[#1aa34a] font-bold flex items-center gap-1"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                  </svg>
                  <span>{t("button.share")}</span>
                </Button>
              </div>
              
              {/* Share buttons */}
              <div id="share-panel" className="hidden bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg border border-newspaper-border w-full max-w-md shadow-lg transition-all duration-300 ease-in-out">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-center text-sm font-secondary">{t("share.title", { username: userData?.user?.displayName || t("share.anonymous") })}</h3>
                  <button 
                    onClick={() => {
                      const sharePanel = document.getElementById("share-panel");
                      if (sharePanel) {
                        sharePanel.classList.add("hidden");
                      }
                    }}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label="Close share panel"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
                <ShareButtons userData={userData} className="justify-center" />
              </div>
            </>
          )}
          
          {!userData && !isLoading && (
            <Button 
              onClick={onLogin}
              className="newspaper-btn bg-sepia border border-newspaper-black text-newspaper-black hover:bg-[#e5e0d1] font-secondary"
            >
              {t("button.login")}
            </Button>
          )}
        </div>
      </div>
    );
  }
);

Newspaper.displayName = "Newspaper";

export default Newspaper;
