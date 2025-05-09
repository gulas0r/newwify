import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

export interface SpotifyUserProfile {
  id: number;
  spotifyId: string;
  displayName: string | null;
  profileImage: string | null;
}

export interface SpotifyTopTrack {
  id: number;
  userId: number;
  spotifyTrackId: string;
  trackName: string;
  artistName: string;
  albumName: string | null;
  albumImage: string | null;
  popularity: number | null;
}

export interface UserBiography {
  id: number;
  userId: number;
  biographyEn: string;
  biographyTr: string;
  biographyKu: string;
  createdAt: string;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  images: Array<{ url: string }>;
  popularity: number;
}

export interface SpotifyUserMood {
  primary: string;
  secondary: string;
  description: string;
  recommendation?: string;
}

export interface SpotifyUserData {
  user: SpotifyUserProfile;
  topTracks: SpotifyTopTrack[];
  biography: UserBiography;
  topArtists?: SpotifyArtist[];
  genres?: string[];
  mood?: SpotifyUserMood;
  totalListeningTime?: number; // Total listening time in minutes
  mostListenedTrack?: SpotifyTopTrack; // Most frequently listened track
}

export function useSpotifyAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiateLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest("GET", "/api/auth/spotify", undefined);
      const data = await response.json();
      
      // Store Spotify ID in localStorage to retrieve user data later
      window.location.href = data.authUrl;
    } catch (error) {
      setError("Failed to connect to Spotify. Please try again.");
      console.error("Spotify auth error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    initiateLogin,
    isLoading,
    error
  };
}

export function useSpotifyUser(spotifyId: string | null) {
  return useQuery<SpotifyUserData>({
    queryKey: ["/api/me", spotifyId],
    enabled: !!spotifyId,
    queryFn: async ({ queryKey }) => {
      const [endpoint, id] = queryKey;
      const res = await fetch(`${endpoint}?spotifyId=${id}`, {
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Failed to fetch user data");
      }
      
      return await res.json();
    }
  });
}

export function persistSpotifyId(spotifyId: string) {
  localStorage.setItem("spotify_id", spotifyId);
}

export function getPersistedSpotifyId(): string | null {
  return localStorage.getItem("spotify_id");
}

export function clearPersistedSpotifyId() {
  localStorage.removeItem("spotify_id");
}

export function useSpotifySession() {
  const [spotifyId, setSpotifyId] = useState<string | null>(null);
  
  useEffect(() => {
    // Check URL for auth success
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get('auth');
    const id = urlParams.get('id');
    
    if (authStatus === 'success') {
      // If auth is successful, try to get spotifyId from URL parameter first
      if (id) {
        // Save the ID to localStorage and set it in state
        persistSpotifyId(id);
        setSpotifyId(id);
      } else {
        // Fall back to localStorage if no ID in URL
        const persistedId = getPersistedSpotifyId();
        if (persistedId) {
          setSpotifyId(persistedId);
        } else {
          console.error("Auth success but no Spotify ID available");
        }
      }
      
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      // On initial load, check if we have a persisted ID
      const persistedId = getPersistedSpotifyId();
      if (persistedId) {
        setSpotifyId(persistedId);
      }
    }
  }, []);
  
  return {
    spotifyId,
    setSpotifyId: (id: string) => {
      persistSpotifyId(id);
      setSpotifyId(id);
    },
    clearSession: () => {
      clearPersistedSpotifyId();
      setSpotifyId(null);
    },
    isLoggedIn: !!spotifyId
  };
}
