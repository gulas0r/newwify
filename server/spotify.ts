import fetch from "node-fetch";
import { URL } from "url";

// Spotify API base URLs
const SPOTIFY_API_URL = "https://api.spotify.com/v1";
const SPOTIFY_ACCOUNTS_URL = "https://accounts.spotify.com/api";

// Spotify API endpoints
export const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
export const SPOTIFY_TOKEN_URL = `${SPOTIFY_ACCOUNTS_URL}/token`;

// Scopes for Spotify API
export const SPOTIFY_SCOPES = [
  "user-read-private", 
  "user-read-email", 
  "user-top-read",
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-read-recently-played",
  "user-library-read"
];

export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token: string;
}

export interface SpotifyUser {
  id: string;
  display_name: string;
  images: Array<{ url: string }>;
  email: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string }>;
  };
  popularity: number;
}

export interface SpotifyTopTracksResponse {
  items: SpotifyTrack[];
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images: Array<{ url: string }>;
  genres: string[];
  popularity: number;
}

export interface SpotifyTopArtistsResponse {
  items: SpotifyArtist[];
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: Array<{ url: string }>;
  owner: {
    display_name: string;
  };
  tracks: {
    total: number;
  };
}

export interface SpotifyPlaylistsResponse {
  items: SpotifyPlaylist[];
}

/**
 * Authorizes a user with Spotify
 * @param code The authorization code returned by Spotify
 * @param redirectUri The redirect URI registered with Spotify
 * @returns A promise that resolves to the token response
 */
export async function getSpotifyToken(code: string, redirectUri: string): Promise<SpotifyTokenResponse> {
  const clientId = process.env.SPOTIFY_CLIENT_ID || "";
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || "";
  
  if (!clientId || !clientSecret) {
    throw new Error("Spotify client ID or secret is missing");
  }

  const params = new URLSearchParams();
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", redirectUri);

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: params,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error getting Spotify token: ${response.status} ${errorText}`);
  }

  return await response.json() as SpotifyTokenResponse;
}

/**
 * Refreshes a Spotify access token
 * @param refreshToken The refresh token
 * @returns A promise that resolves to the new token
 */
export async function refreshSpotifyToken(refreshToken: string): Promise<SpotifyTokenResponse> {
  const clientId = process.env.SPOTIFY_CLIENT_ID || "";
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || "";
  
  if (!clientId || !clientSecret) {
    throw new Error("Spotify client ID or secret is missing");
  }

  const params = new URLSearchParams();
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", refreshToken);

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: params,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error refreshing Spotify token: ${response.status} ${errorText}`);
  }

  return await response.json() as SpotifyTokenResponse;
}

/**
 * Gets the current user's profile
 * @param accessToken The access token
 * @returns A promise that resolves to the user's profile
 */
export async function getSpotifyUserProfile(accessToken: string): Promise<SpotifyUser> {
  const response = await fetch(`${SPOTIFY_API_URL}/me`, {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error getting Spotify user profile: ${response.status} ${errorText}`);
  }

  return await response.json() as SpotifyUser;
}

/**
 * Gets the user's top tracks
 * @param accessToken The access token
 * @param timeRange The time range for the tracks (short_term, medium_term, long_term)
 * @param limit The number of tracks to return
 * @returns A promise that resolves to the user's top tracks
 */
export async function getSpotifyTopTracks(
  accessToken: string, 
  timeRange: "short_term" | "medium_term" | "long_term" = "medium_term",
  limit: number = 5
): Promise<SpotifyTopTracksResponse> {
  const url = new URL(`${SPOTIFY_API_URL}/me/top/tracks`);
  url.searchParams.append("time_range", timeRange);
  url.searchParams.append("limit", limit.toString());

  const response = await fetch(url.toString(), {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error getting Spotify top tracks: ${response.status} ${errorText}`);
  }

  return await response.json() as SpotifyTopTracksResponse;
}

/**
 * Gets the user's top artists
 * @param accessToken The access token
 * @param timeRange The time range for the artists (short_term, medium_term, long_term)
 * @param limit The number of artists to return
 * @returns A promise that resolves to the user's top artists
 */
export async function getSpotifyTopArtists(
  accessToken: string, 
  timeRange: "short_term" | "medium_term" | "long_term" = "medium_term",
  limit: number = 5
): Promise<SpotifyTopArtistsResponse> {
  const url = new URL(`${SPOTIFY_API_URL}/me/top/artists`);
  url.searchParams.append("time_range", timeRange);
  url.searchParams.append("limit", limit.toString());

  const response = await fetch(url.toString(), {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error getting Spotify top artists: ${response.status} ${errorText}`);
  }

  return await response.json() as SpotifyTopArtistsResponse;
}

/**
 * Gets the user's playlists
 * @param accessToken The access token
 * @param limit The number of playlists to return
 * @param offset The offset for pagination
 * @returns A promise that resolves to the user's playlists
 */
export async function getSpotifyUserPlaylists(
  accessToken: string,
  limit: number = 20,
  offset: number = 0
): Promise<SpotifyPlaylistsResponse> {
  const url = new URL(`${SPOTIFY_API_URL}/me/playlists`);
  url.searchParams.append("limit", limit.toString());
  url.searchParams.append("offset", offset.toString());

  const response = await fetch(url.toString(), {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error getting Spotify user playlists: ${response.status} ${errorText}`);
  }

  return await response.json() as SpotifyPlaylistsResponse;
}

/**
 * Gets the currently playing track or recently played tracks
 * @param accessToken The access token
 * @returns A promise that resolves to the user's recently played tracks
 */
export async function getSpotifyRecentlyPlayed(
  accessToken: string,
  limit: number = 50
): Promise<{items: Array<{track: SpotifyTrack, played_at: string}>}> {
  const url = new URL(`${SPOTIFY_API_URL}/me/player/recently-played`);
  url.searchParams.append("limit", limit.toString());

  const response = await fetch(url.toString(), {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error getting Spotify recently played tracks: ${response.status} ${errorText}`);
  }

  return await response.json() as {items: Array<{track: SpotifyTrack, played_at: string}>};
}

/**
 * Gets the user's listening history stats including total listening time estimate and most played track
 * @param accessToken The access token
 * @returns A promise that resolves to the user's listening statistics
 */
export async function getSpotifyListeningStats(
  accessToken: string
): Promise<{ totalListeningMinutes: number, mostPlayedTrack: SpotifyTrack | null }> {
  try {
    // Get recently played tracks with maximum limit
    const recentlyPlayed = await getSpotifyRecentlyPlayed(accessToken, 50);
    
    // Get top tracks to find most played
    const topTracks = await getSpotifyTopTracks(accessToken, "medium_term", 10);
    
    // Estimate total listening time based on number of tracks and average song length (3.5 minutes)
    // This is a rough estimate since Spotify doesn't provide actual listening time
    // We multiply by a factor to account for historical listening beyond the recent tracks
    const recentTrackCount = recentlyPlayed.items.length;
    const estimatedTotalMinutes = Math.round(recentTrackCount * 3.5 * 60); // Multiply by a larger factor for lifetime estimate
    
    // Get the most played track (first track from top tracks)
    const mostPlayedTrack = topTracks.items.length > 0 ? topTracks.items[0] : null;
    
    return {
      totalListeningMinutes: estimatedTotalMinutes,
      mostPlayedTrack
    };
  } catch (error) {
    console.error("Error getting listening stats:", error);
    return {
      totalListeningMinutes: 180, // Default to 3 hours if we can't get real data
      mostPlayedTrack: null
    };
  }
}

export function getSpotifyAuthUrl(redirectUri: string, state: string): string {
  const clientId = process.env.SPOTIFY_CLIENT_ID || "";
  
  if (!clientId) {
    throw new Error("Spotify client ID is missing");
  }

  const url = new URL(SPOTIFY_AUTH_URL);
  url.searchParams.append("client_id", clientId);
  url.searchParams.append("response_type", "code");
  url.searchParams.append("redirect_uri", redirectUri);
  url.searchParams.append("state", state);
  url.searchParams.append("scope", SPOTIFY_SCOPES.join(" "));

  return url.toString();
}
