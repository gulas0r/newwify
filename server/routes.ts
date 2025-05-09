import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import { storage } from "./storage";
import { 
  getSpotifyAuthUrl, 
  getSpotifyToken, 
  getSpotifyUserProfile, 
  getSpotifyTopTracks,
  getSpotifyTopArtists,
  getSpotifyUserPlaylists,
  getSpotifyRecentlyPlayed,
  getSpotifyListeningStats,
  refreshSpotifyToken
} from "./spotify";
import { generateAllBiographies } from "./ai";
import { insertUserSchema, insertTopTrackSchema, insertUserBiographySchema } from "@shared/schema";
import { z } from "zod";
import { SpotifyTopTrack } from "../client/src/hooks/use-spotify";

/**
 * Generate a mood based on the user's top tracks and genres
 * This is a simplified version that categorizes mood based on popularity and genres
 */
function generateMoodFromMusic(tracks: SpotifyTopTrack[], genres: string[]): { primary: string; secondary: string; description: string } {
  // Default mood if we can't determine anything
  const defaultMood = {
    primary: "Nostalgic",
    secondary: "Thoughtful", 
    description: "You find comfort in songs that remind you of meaningful moments."
  };
  
  if (!tracks || tracks.length === 0) {
    return defaultMood;
  }
  
  // Check if certain genres appear
  const genreCheckList = {
    // Energetic moods
    energetic: ["dance", "edm", "electronic", "house", "techno", "pop", "party", "club"],
    happy: ["pop", "happy", "feel-good", "summer", "tropical", "disney"],
    intense: ["metal", "hardcore", "punk", "rock", "alternative", "grunge"],
    
    // Chill moods
    relaxed: ["ambient", "chill", "study", "piano", "sleep", "meditation", "acoustic"],
    melancholic: ["sad", "rain", "emotional", "soul", "blues", "indie"],
    thoughtful: ["folk", "singer-songwriter", "acoustic", "indie", "alternative"],
    
    // Specialized moods
    romantic: ["love", "romance", "r&b", "soul", "wedding"],
    nostalgic: ["80s", "90s", "oldies", "classic", "retro", "vintage"],
    adventurous: ["soundtrack", "epic", "trailer", "movie", "adventure", "game"],
  };
  
  // Count genre matches for each mood
  const moodCounts: Record<string, number> = {};
  
  Object.entries(genreCheckList).forEach(([mood, keywords]) => {
    moodCounts[mood] = 0;
    
    genres.forEach(genre => {
      const lowerGenre = genre.toLowerCase();
      for (const keyword of keywords) {
        if (lowerGenre.includes(keyword)) {
          moodCounts[mood]++;
          break; // Count each genre only once per mood
        }
      }
    });
  });
  
  // Calculate energy level based on track popularity (0-100)
  const averagePopularity = tracks.reduce((sum, track) => sum + (track.popularity || 50), 0) / tracks.length;
  
  // Add popularity bias to certain moods
  if (averagePopularity > 75) {
    moodCounts.energetic = (moodCounts.energetic || 0) + 2;
    moodCounts.happy = (moodCounts.happy || 0) + 1;
  } else if (averagePopularity < 50) {
    moodCounts.thoughtful = (moodCounts.thoughtful || 0) + 1;
    moodCounts.melancholic = (moodCounts.melancholic || 0) + 1;
  }
  
  // Find primary and secondary moods (highest counts)
  let primaryMood = "nostalgic";
  let secondaryMood = "thoughtful";
  
  let highestCount = -1;
  let secondHighestCount = -1;
  
  Object.entries(moodCounts).forEach(([mood, count]) => {
    if (count > highestCount) {
      secondHighestCount = highestCount;
      secondaryMood = primaryMood;
      highestCount = count;
      primaryMood = mood;
    } else if (count > secondHighestCount) {
      secondHighestCount = count;
      secondaryMood = mood;
    }
  });
  
  // If we don't have clear winners, use defaults based on popularity
  if (highestCount === 0) {
    if (averagePopularity > 70) {
      primaryMood = "energetic";
      secondaryMood = "happy";
    } else if (averagePopularity > 50) {
      primaryMood = "nostalgic";
      secondaryMood = "adventurous";
    } else {
      primaryMood = "thoughtful";
      secondaryMood = "melancholic";
    }
  }
  
  // Generate mood descriptions and song recommendations
  const moodDescriptions: Record<string, { description: string, recommendation: string }> = {
    energetic: {
      description: "Our analysis suggests you enjoy high-energy tracks with dynamic beats.",
      recommendation: "Try listening to 'Blinding Lights' by The Weeknd or 'Don't Stop Me Now' by Queen."
    },
    happy: {
      description: "Your musical choices suggest a preference for uplifting and positive sounds.",
      recommendation: "You might enjoy 'Happy' by Pharrell Williams or 'Walking on Sunshine' by Katrina & The Waves."
    },
    intense: {
      description: "Your taste leans toward music with emotional depth and powerful soundscapes.",
      recommendation: "Consider 'Welcome to the Black Parade' by My Chemical Romance or 'Knights of Cydonia' by Muse."
    },
    relaxed: {
      description: "Your listening patterns indicate appreciation for calming and peaceful sounds.",
      recommendation: "You might enjoy 'Weightless' by Marconi Union or 'Comptine d'un Autre Été' by Yann Tiersen."
    },
    melancholic: {
      description: "Your music choices reveal an appreciation for the beauty in melancholy and introspection.",
      recommendation: "Try 'Vienna' by Billy Joel or 'Liability' by Lorde for more emotional depth."
    },
    thoughtful: {
      description: "Our analysis shows you enjoy music that stimulates reflection and deep thinking.",
      recommendation: "Consider 'Hallelujah' by Leonard Cohen or 'Imagine' by John Lennon to match your thoughtful style."
    },
    romantic: {
      description: "Your playlist suggests a taste for music that evokes emotional connection.",
      recommendation: "You might enjoy 'At Last' by Etta James or 'Can't Help Falling in Love' by Elvis Presley."
    },
    nostalgic: {
      description: "Your preferences point toward music that creates a sense of reminiscence.",
      recommendation: "Try 'Yesterday' by The Beatles or 'The Sound of Silence' by Simon & Garfunkel."
    },
    adventurous: {
      description: "Your musical journey indicates an openness to diverse and exploratory sounds.",
      recommendation: "Consider 'Bohemian Rhapsody' by Queen or 'Stairway to Heaven' by Led Zeppelin."
    }
  };
  
  return {
    primary: primaryMood.charAt(0).toUpperCase() + primaryMood.slice(1),
    secondary: secondaryMood.charAt(0).toUpperCase() + secondaryMood.slice(1),
    description: moodDescriptions[primaryMood]?.description || defaultMood.description,
    recommendation: moodDescriptions[primaryMood]?.recommendation || "Try exploring more music to get personalized recommendations."
  };
}

// Utility to handle async route handlers
const asyncHandler = (fn: (req: Request, res: Response) => Promise<void>) => {
  return async (req: Request, res: Response) => {
    try {
      await fn(req, res);
    } catch (error) {
      console.error("Route error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Internal server error" 
      });
    }
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);

  // API Routes
  app.get("/api/auth/spotify", asyncHandler(async (req, res) => {
    // Generate a random state for CSRF protection
    const state = crypto.randomBytes(16).toString("hex");
    
    // Get the redirect URI from environment or use default
    const domains = process.env.REPLIT_DOMAINS?.split(",") || [];
    const domain = domains.length > 0 ? domains[0] : "localhost:5000";
    const protocol = domain.includes("localhost") ? "http" : "https";
    const redirectUri = `${protocol}://${domain}/api/auth/callback`;
    
    // Get the Spotify auth URL
    const authUrl = getSpotifyAuthUrl(redirectUri, state);
    
    // Send the auth URL to the client
    res.json({ authUrl });
  }));

  app.get("/api/auth/callback", asyncHandler(async (req, res) => {
    const { code, state } = req.query;
    
    if (!code) {
      return res.status(400).json({ message: "Missing authorization code" });
    }
    
    // Get the redirect URI from environment or use default
    const domains = process.env.REPLIT_DOMAINS?.split(",") || [];
    const domain = domains.length > 0 ? domains[0] : "localhost:5000";
    const protocol = domain.includes("localhost") ? "http" : "https";
    const redirectUri = `${protocol}://${domain}/api/auth/callback`;
    
    try {
      // Exchange code for token
      const tokenResponse = await getSpotifyToken(code.toString(), redirectUri);
      
      // Get user profile
      const userProfile = await getSpotifyUserProfile(tokenResponse.access_token);
      
      // Calculate token expiry time
      const expiresIn = tokenResponse.expires_in;
      const tokenExpiry = new Date(Date.now() + expiresIn * 1000);
      
      // Prepare user data
      const userData = {
        spotifyId: userProfile.id,
        displayName: userProfile.display_name,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        tokenExpiry,
        profileImage: userProfile.images[0]?.url || null,
      };
      
      // Validate user data
      const validatedUserData = insertUserSchema.parse(userData);
      
      // Check if user exists
      const existingUser = await storage.getUserBySpotifyId(userProfile.id);
      
      let user;
      if (existingUser) {
        // Update existing user
        user = await storage.updateUser(existingUser.id, validatedUserData);
      } else {
        // Create new user
        user = await storage.createUser(validatedUserData);
      }
      
      // Get user's data from Spotify
      const [topTracksResponse, topArtistsResponse, playlistsResponse] = await Promise.all([
        getSpotifyTopTracks(tokenResponse.access_token),
        getSpotifyTopArtists(tokenResponse.access_token),
        getSpotifyUserPlaylists(tokenResponse.access_token)
      ]);
      
      // Clear existing top tracks for this user
      await storage.clearUserTopTracks(user.id);
      
      // Save top tracks
      for (const track of topTracksResponse.items) {
        const trackData = {
          userId: user.id,
          spotifyTrackId: track.id,
          trackName: track.name,
          artistName: track.artists[0]?.name || "Unknown Artist",
          albumName: track.album.name,
          albumImage: track.album.images[0]?.url || null,
          popularity: track.popularity,
        };
        
        const validatedTrackData = insertTopTrackSchema.parse(trackData);
        await storage.createTopTrack(validatedTrackData);
      }
      
      // Prepare tracks for AI generation
      const tracks = topTracksResponse.items.map(track => ({
        name: track.name,
        artist: track.artists[0]?.name || "Unknown Artist"
      }));
      
      // Extract genres from top artists
      const genres = topArtistsResponse.items.reduce<string[]>((acc, artist) => {
        artist.genres.forEach(genre => {
          if (!acc.includes(genre)) {
            acc.push(genre);
          }
        });
        return acc;
      }, []).slice(0, 5); // Get top 5 genres
      
      // Extract artist names
      const artistNames = topArtistsResponse.items.map(artist => artist.name).slice(0, 5);
      
      // Extract playlist names
      const playlistNames = playlistsResponse.items.map(playlist => playlist.name).slice(0, 5);
      
      // Get most played song if available
      const mostPlayedSong = topTracksResponse.items.length > 0 
        ? `${topTracksResponse.items[0].name} by ${topTracksResponse.items[0].artists[0]?.name || "Unknown Artist"}`
        : undefined;
      
      // Generate AI biographies with richer data
      const biographies = await generateAllBiographies(tracks, {
        artistGenres: genres,
        topArtists: artistNames,
        playlists: playlistNames,
        mostPlayedSong,
        userDisplayName: userProfile.display_name || undefined
      });
      
      // Save or update biography
      const biographyData = {
        userId: user.id,
        biographyEn: biographies.en,
        biographyTr: biographies.tr,
        biographyKu: biographies.ku,
      };
      
      const validatedBiographyData = insertUserBiographySchema.parse(biographyData);
      
      // Check if biography exists
      const existingBiography = await storage.getUserBiography(user.id);
      
      if (existingBiography) {
        // Update existing biography
        await storage.updateUserBiography(user.id, validatedBiographyData);
      } else {
        // Create new biography
        await storage.createUserBiography(validatedBiographyData);
      }
      
      // Redirect to frontend with the user's Spotify ID
      res.redirect(`/?auth=success&id=${user.spotifyId}`);
    } catch (error) {
      console.error("Spotify callback error:", error);
      res.redirect("/?auth=error");
    }
  }));

  app.get("/api/me", asyncHandler(async (req, res) => {
    const spotifyId = req.query.spotifyId as string;
    
    if (!spotifyId) {
      return res.status(400).json({ message: "Missing Spotify ID" });
    }
    
    const user = await storage.getUserBySpotifyId(spotifyId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Check if token is expired and refresh if necessary
    const now = new Date();
    if (now > user.tokenExpiry) {
      try {
        const tokenResponse = await refreshSpotifyToken(user.refreshToken);
        
        // Calculate new token expiry time
        const expiresIn = tokenResponse.expires_in;
        const tokenExpiry = new Date(Date.now() + expiresIn * 1000);
        
        // Update user with new token
        await storage.updateUser(user.id, {
          ...user,
          accessToken: tokenResponse.access_token,
          tokenExpiry,
        });
        
        // Update access token
        user.accessToken = tokenResponse.access_token;
        user.tokenExpiry = tokenExpiry;
      } catch (error) {
        console.error("Error refreshing token:", error);
        return res.status(401).json({ message: "Failed to refresh token" });
      }
    }
    
    // Get top tracks
    const topTracks = await storage.getUserTopTracks(user.id);
    
    // Get biography
    const biography = await storage.getUserBiography(user.id);
    
    // Get additional data from Spotify APIs
    try {
      // Get top artists
      const topArtistsResponse = await getSpotifyTopArtists(user.accessToken);
      
      // Get listening stats
      const listeningStats = await getSpotifyListeningStats(user.accessToken);
      
      // Extract genres from top artists
      const genres = topArtistsResponse.items.reduce<string[]>((acc, artist) => {
        artist.genres.forEach(genre => {
          if (!acc.includes(genre)) {
            acc.push(genre);
          }
        });
        return acc;
      }, []).slice(0, 5); // Get top 5 genres
      
      // Generate a mood based on top tracks and genres
      const mood = generateMoodFromMusic(topTracks, genres);
      
      // Find most listened track from top tracks if Spotify API most played track is available
      let mostListenedTrack = null;
      if (listeningStats.mostPlayedTrack) {
        // Find matching track in our database if it exists
        mostListenedTrack = topTracks.find(track => 
          track.spotifyTrackId === listeningStats.mostPlayedTrack?.id
        ) || {
          id: 0,
          userId: user.id,
          spotifyTrackId: listeningStats.mostPlayedTrack.id,
          trackName: listeningStats.mostPlayedTrack.name,
          artistName: listeningStats.mostPlayedTrack.artists[0]?.name || "Unknown Artist",
          albumName: listeningStats.mostPlayedTrack.album.name,
          albumImage: listeningStats.mostPlayedTrack.album.images[0]?.url || null,
          popularity: listeningStats.mostPlayedTrack.popularity || 50
        };
      } else if (topTracks.length > 0) {
        // If no most played track from Spotify API, use the first top track
        mostListenedTrack = topTracks[0];
      }
      
      // Return user data without sensitive information
      res.json({
        user: {
          id: user.id,
          spotifyId: user.spotifyId,
          displayName: user.displayName,
          profileImage: user.profileImage,
        },
        topTracks,
        biography,
        topArtists: topArtistsResponse.items.slice(0, 5), // Return top 5 artists
        genres,
        mood,
        totalListeningTime: listeningStats.totalListeningMinutes,
        mostListenedTrack
      });
    } catch (error) {
      console.error("Error getting additional data:", error);
      
      // Even if we can't get data from Spotify API directly,
      // we can still create some basic data from the tracks we already have
      
      // Get artist names from tracks
      const artistsFromTracks = topTracks.reduce<{[key: string]: number}>((acc, track) => {
        if (track.artistName) {
          if (acc[track.artistName]) {
            acc[track.artistName]++;
          } else {
            acc[track.artistName] = 1;
          }
        }
        return acc;
      }, {});
      
      // Sort artists by play count and format top 5
      const topArtistsFromTracks = Object.entries(artistsFromTracks)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name], index) => ({
          id: `artist-${index}`,
          name,
          genres: [],
          images: [{ url: "" }], 
          popularity: 50
        }));
      
      // Generate a mood based only on track popularity
      const basicMood = generateMoodFromMusic(topTracks, []);
      
      // If we can't get data from Spotify, set default listening time 
      // and use the first top track as most listened
      const totalListeningTime = 180; // 3 hours default
      const mostListenedTrack = topTracks.length > 0 ? topTracks[0] : null;
      
      // Return user data with derived enhanced data
      res.json({
        user: {
          id: user.id,
          spotifyId: user.spotifyId,
          displayName: user.displayName,
          profileImage: user.profileImage,
        },
        topTracks,
        biography,
        topArtists: topArtistsFromTracks,
        genres: [],
        mood: basicMood,
        totalListeningTime,
        mostListenedTrack
      });
    }
  }));

  // Get user's top artists
  app.get("/api/top-artists", asyncHandler(async (req, res) => {
    const spotifyId = req.query.spotifyId as string;
    
    if (!spotifyId) {
      return res.status(400).json({ message: "Missing Spotify ID" });
    }
    
    const user = await storage.getUserBySpotifyId(spotifyId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Check token expiry and refresh if necessary
    const now = new Date();
    if (now > user.tokenExpiry) {
      try {
        const tokenResponse = await refreshSpotifyToken(user.refreshToken);
        
        // Calculate new token expiry time
        const expiresIn = tokenResponse.expires_in;
        const tokenExpiry = new Date(Date.now() + expiresIn * 1000);
        
        // Update user with new token
        await storage.updateUser(user.id, {
          ...user,
          accessToken: tokenResponse.access_token,
          tokenExpiry,
        });
        
        // Update access token
        user.accessToken = tokenResponse.access_token;
        user.tokenExpiry = tokenExpiry;
      } catch (error) {
        console.error("Error refreshing token:", error);
        return res.status(401).json({ message: "Failed to refresh token" });
      }
    }
    
    try {
      // Get top artists from Spotify
      const topArtists = await getSpotifyTopArtists(user.accessToken);
      
      // Return top artists
      res.json(topArtists);
    } catch (error) {
      console.error("Error getting top artists:", error);
      res.status(500).json({ message: "Failed to get top artists" });
    }
  }));
  
  // Get user's playlists
  app.get("/api/playlists", asyncHandler(async (req, res) => {
    const spotifyId = req.query.spotifyId as string;
    
    if (!spotifyId) {
      return res.status(400).json({ message: "Missing Spotify ID" });
    }
    
    const user = await storage.getUserBySpotifyId(spotifyId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Check token expiry and refresh if necessary
    const now = new Date();
    if (now > user.tokenExpiry) {
      try {
        const tokenResponse = await refreshSpotifyToken(user.refreshToken);
        
        // Calculate new token expiry time
        const expiresIn = tokenResponse.expires_in;
        const tokenExpiry = new Date(Date.now() + expiresIn * 1000);
        
        // Update user with new token
        await storage.updateUser(user.id, {
          ...user,
          accessToken: tokenResponse.access_token,
          tokenExpiry,
        });
        
        // Update access token
        user.accessToken = tokenResponse.access_token;
        user.tokenExpiry = tokenExpiry;
      } catch (error) {
        console.error("Error refreshing token:", error);
        return res.status(401).json({ message: "Failed to refresh token" });
      }
    }
    
    try {
      // Get playlists from Spotify
      const playlists = await getSpotifyUserPlaylists(user.accessToken);
      
      // Return playlists
      res.json(playlists);
    } catch (error) {
      console.error("Error getting playlists:", error);
      res.status(500).json({ message: "Failed to get playlists" });
    }
  }));
  
  // Get user's recently played tracks
  app.get("/api/recently-played", asyncHandler(async (req, res) => {
    const spotifyId = req.query.spotifyId as string;
    
    if (!spotifyId) {
      return res.status(400).json({ message: "Missing Spotify ID" });
    }
    
    const user = await storage.getUserBySpotifyId(spotifyId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Check token expiry and refresh if necessary
    const now = new Date();
    if (now > user.tokenExpiry) {
      try {
        const tokenResponse = await refreshSpotifyToken(user.refreshToken);
        
        // Calculate new token expiry time
        const expiresIn = tokenResponse.expires_in;
        const tokenExpiry = new Date(Date.now() + expiresIn * 1000);
        
        // Update user with new token
        await storage.updateUser(user.id, {
          ...user,
          accessToken: tokenResponse.access_token,
          tokenExpiry,
        });
        
        // Update access token
        user.accessToken = tokenResponse.access_token;
        user.tokenExpiry = tokenExpiry;
      } catch (error) {
        console.error("Error refreshing token:", error);
        return res.status(401).json({ message: "Failed to refresh token" });
      }
    }
    
    try {
      // Get recently played tracks from Spotify
      const recentlyPlayed = await getSpotifyRecentlyPlayed(user.accessToken);
      
      // Return recently played tracks
      res.json(recentlyPlayed);
    } catch (error) {
      console.error("Error getting recently played tracks:", error);
      res.status(500).json({ message: "Failed to get recently played tracks" });
    }
  }));
  
  // Generate AI biography with extended data
  app.get("/api/generate-biography", asyncHandler(async (req, res) => {
    const spotifyId = req.query.spotifyId as string;
    
    if (!spotifyId) {
      return res.status(400).json({ message: "Missing Spotify ID" });
    }
    
    const user = await storage.getUserBySpotifyId(spotifyId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Check token expiry and refresh if necessary
    const now = new Date();
    if (now > user.tokenExpiry) {
      try {
        const tokenResponse = await refreshSpotifyToken(user.refreshToken);
        
        // Calculate new token expiry time
        const expiresIn = tokenResponse.expires_in;
        const tokenExpiry = new Date(Date.now() + expiresIn * 1000);
        
        // Update user with new token
        await storage.updateUser(user.id, {
          ...user,
          accessToken: tokenResponse.access_token,
          tokenExpiry,
        });
        
        // Update access token
        user.accessToken = tokenResponse.access_token;
        user.tokenExpiry = tokenExpiry;
      } catch (error) {
        console.error("Error refreshing token:", error);
        return res.status(401).json({ message: "Failed to refresh token" });
      }
    }
    
    try {
      // Get user's data from Spotify
      const [topTracks, topArtists, playlists, recentlyPlayed] = await Promise.all([
        getSpotifyTopTracks(user.accessToken),
        getSpotifyTopArtists(user.accessToken),
        getSpotifyUserPlaylists(user.accessToken),
        getSpotifyRecentlyPlayed(user.accessToken)
      ]);
      
      // Get existing tracks from database
      const existingTracks = await storage.getUserTopTracks(user.id);
      
      // Prepare tracks for AI generation
      const tracks = topTracks.items.map(track => ({
        name: track.name,
        artist: track.artists[0]?.name || "Unknown Artist"
      }));
      
      // Extract genres from top artists
      const genres = topArtists.items.reduce<string[]>((acc, artist) => {
        artist.genres.forEach(genre => {
          if (!acc.includes(genre)) {
            acc.push(genre);
          }
        });
        return acc;
      }, []).slice(0, 5); // Get top 5 genres
      
      // Extract artist names
      const artistNames = topArtists.items.map(artist => artist.name).slice(0, 5);
      
      // Extract playlist names
      const playlistNames = playlists.items.map(playlist => playlist.name).slice(0, 5);
      
      // Get most played song if available
      const mostPlayedSong = topTracks.items.length > 0 
        ? `${topTracks.items[0].name} by ${topTracks.items[0].artists[0]?.name || "Unknown Artist"}`
        : undefined;
      
      // Generate AI biographies with richer data
      const biographies = await generateAllBiographies(tracks, {
        artistGenres: genres,
        topArtists: artistNames,
        playlists: playlistNames,
        mostPlayedSong,
        userDisplayName: user.displayName || undefined
      });
      
      // Save or update biography
      const biographyData = {
        userId: user.id,
        biographyEn: biographies.en,
        biographyTr: biographies.tr,
        biographyKu: biographies.ku,
      };
      
      const validatedBiographyData = insertUserBiographySchema.parse(biographyData);
      
      // Check if biography exists
      const existingBiography = await storage.getUserBiography(user.id);
      
      let biography;
      if (existingBiography) {
        // Update existing biography
        biography = await storage.updateUserBiography(user.id, validatedBiographyData);
      } else {
        // Create new biography
        biography = await storage.createUserBiography(validatedBiographyData);
      }
      
      // Return the generated biographies
      res.json({
        biography,
        stats: {
          tracksCount: topTracks.items.length,
          artistsCount: topArtists.items.length,
          playlistsCount: playlists.items.length
        }
      });
    } catch (error) {
      console.error("Error generating biography:", error);
      res.status(500).json({ message: "Failed to generate biography" });
    }
  }));
  
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  return httpServer;
}
