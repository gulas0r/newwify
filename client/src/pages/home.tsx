import { useRef, useEffect, useState } from "react";
import Newspaper from "@/components/newspaper";
import { useSpotifyAuth, useSpotifyUser, useSpotifySession, persistSpotifyId } from "@/hooks/use-spotify";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/language-switcher";
import { FiMusic, FiClock, FiBarChart2, FiHeart } from "react-icons/fi";

export default function HomePage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { initiateLogin, isLoading: authLoading } = useSpotifyAuth();
  const { spotifyId, setSpotifyId, isLoggedIn } = useSpotifySession();
  const { data: userData, isLoading: dataLoading, error: dataError } = useSpotifyUser(spotifyId);
  const newspaperRef = useRef<HTMLDivElement>(null);
  const [showNewspaper, setShowNewspaper] = useState<boolean>(false);
  
  // Check if we have a successful auth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get('auth');
    
    if (authStatus === 'success') {
      // If auth is successful but we somehow don't have userData yet
      if (!userData && !dataLoading) {
        toast({
          title: "Authentication successful",
          description: "Loading your music profile...",
        });
      }
    } else if (authStatus === 'error') {
      toast({
        title: "Authentication failed",
        description: "Could not connect to Spotify. Please try again.",
        variant: "destructive",
      });
      
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [window.location.search]);
  
  // Display error toast if data fetching fails
  useEffect(() => {
    if (dataError) {
      toast({
        title: t("error.title"),
        description: t("error.message"),
        variant: "destructive",
      });
    }
  }, [dataError]);
  
  // Store Spotify ID when user data is loaded
  useEffect(() => {
    if (userData?.user?.spotifyId) {
      setSpotifyId(userData.user.spotifyId);
      setShowNewspaper(true);
    }
  }, [userData]);
  
  const handleLogin = () => {
    initiateLogin();
  };
  
  const isLoading = authLoading || dataLoading;
  
  if (!showNewspaper && !isLoggedIn) {
    return (
      <div className="landing-page min-h-screen flex flex-col">
        {/* Language switcher in the top right */}
        <div className="absolute top-4 right-4 z-10">
          <LanguageSwitcher />
        </div>
        
        {/* Hero section */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div className="text-center mb-8">
            <h1 className="font-newspaper-title text-5xl md:text-7xl mb-4 text-gray-900 leading-tight">
              NEWIFY
            </h1>
            <div className="vintage-divider w-32 mx-auto my-6"></div>
            <h2 className="font-headline text-xl md:text-2xl text-gray-700 italic">
              Your Musical Journey in Nostalgic Print
            </h2>
          </div>
          
          <div className="vintage-card max-w-md w-full mx-auto mb-8">
            <p className="font-body text-center text-gray-700 mb-6">
              {t("login.instruction")}
            </p>
            
            <div className="flex justify-center">
              <button 
                onClick={handleLogin}
                className="vintage-button flex items-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white rounded-full border-t-transparent"></span>
                ) : (
                  <svg viewBox="0 0 24 24" width="24" height="24" className="text-white">
                    <path 
                      fill="currentColor" 
                      d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.36.12-.78-.12-.9-.48-.12-.36.12-.78.48-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.48.66.36 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.24-1.98-8.16-2.58-11.939-1.38-.479.12-.959-.12-1.08-.6-.12-.48.12-.96.6-1.08C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"
                    />
                  </svg>
                )}
                <span>{t("button.login")}</span>
              </button>
            </div>
          </div>
          
          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full mt-8">
            <div className="vintage-card flex items-start">
              <FiMusic className="text-[#852724] text-2xl mr-3 mt-1" />
              <div>
                <h3 className="font-headline text-lg font-bold mb-2">Your Music Story</h3>
                <p className="font-body text-gray-700">See your musical tastes transformed into an authentic 1970s style newspaper with AI-powered storytelling.</p>
              </div>
            </div>
            
            <div className="vintage-card flex items-start">
              <FiClock className="text-[#852724] text-2xl mr-3 mt-1" />
              <div>
                <h3 className="font-headline text-lg font-bold mb-2">Listening Statistics</h3>
                <p className="font-body text-gray-700">View your total listening time and discover which tracks and artists define your musical identity.</p>
              </div>
            </div>
            
            <div className="vintage-card flex items-start">
              <FiBarChart2 className="text-[#852724] text-2xl mr-3 mt-1" />
              <div>
                <h3 className="font-headline text-lg font-bold mb-2">Song Recommendations</h3>
                <p className="font-body text-gray-700">Receive personalized music recommendations based on your unique listening mood and preferences.</p>
              </div>
            </div>
            
            <div className="vintage-card flex items-start">
              <FiHeart className="text-[#852724] text-2xl mr-3 mt-1" />
              <div>
                <h3 className="font-headline text-lg font-bold mb-2">Shareable Memories</h3>
                <p className="font-body text-gray-700">Download your musical newspaper as a PNG or share it on social media to showcase your taste.</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="text-center py-8 border-t border-newspaper-border">
          <p className="font-secondary text-sm text-gray-600">
            © 1973 Newify - Created by Gula Sor
          </p>
        </footer>
      </div>
    );
  }
  
  return (
    <div className="landing-page min-h-screen flex flex-col">
      {/* Language switcher in the top right */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        <Newspaper 
          ref={newspaperRef}
          userData={userData}
          onLogin={handleLogin}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
