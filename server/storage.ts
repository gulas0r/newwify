import { 
  users, type User, type InsertUser, 
  topTracks, type TopTrack, type InsertTopTrack,
  userBiographies, type UserBiography, type InsertUserBiography
} from "@shared/schema";

// Full storage interface for our application
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserBySpotifyId(spotifyId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User>;
  
  // Top tracks methods
  getUserTopTracks(userId: number): Promise<TopTrack[]>;
  createTopTrack(track: InsertTopTrack): Promise<TopTrack>;
  clearUserTopTracks(userId: number): Promise<void>;
  
  // Biography methods
  getUserBiography(userId: number): Promise<UserBiography | undefined>;
  createUserBiography(biography: InsertUserBiography): Promise<UserBiography>;
  updateUserBiography(userId: number, biography: Partial<InsertUserBiography>): Promise<UserBiography>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tracks: Map<number, TopTrack>;
  private biographies: Map<number, UserBiography>;
  private userId: number;
  private trackId: number;
  private biographyId: number;

  constructor() {
    this.users = new Map();
    this.tracks = new Map();
    this.biographies = new Map();
    this.userId = 1;
    this.trackId = 1;
    this.biographyId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserBySpotifyId(spotifyId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.spotifyId === spotifyId
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    // Ensure required fields are properly set
    const user: User = {
      id,
      spotifyId: insertUser.spotifyId,
      displayName: insertUser.displayName || null,
      accessToken: insertUser.accessToken,
      refreshToken: insertUser.refreshToken,
      tokenExpiry: insertUser.tokenExpiry,
      profileImage: insertUser.profileImage || null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Top tracks methods
  async getUserTopTracks(userId: number): Promise<TopTrack[]> {
    return Array.from(this.tracks.values()).filter(
      (track) => track.userId === userId
    );
  }

  async createTopTrack(insertTrack: InsertTopTrack): Promise<TopTrack> {
    const id = this.trackId++;
    // Ensure required fields are properly set
    const track: TopTrack = {
      id,
      userId: insertTrack.userId,
      spotifyTrackId: insertTrack.spotifyTrackId,
      trackName: insertTrack.trackName,
      artistName: insertTrack.artistName,
      albumName: insertTrack.albumName || null,
      albumImage: insertTrack.albumImage || null,
      popularity: insertTrack.popularity || null
    };
    this.tracks.set(id, track);
    return track;
  }

  async clearUserTopTracks(userId: number): Promise<void> {
    const userTracks = Array.from(this.tracks.entries()).filter(
      ([_, track]) => track.userId === userId
    );
    
    for (const [id] of userTracks) {
      this.tracks.delete(id);
    }
  }

  // Biography methods
  async getUserBiography(userId: number): Promise<UserBiography | undefined> {
    return Array.from(this.biographies.values()).find(
      (bio) => bio.userId === userId
    );
  }

  async createUserBiography(insertBiography: InsertUserBiography): Promise<UserBiography> {
    const id = this.biographyId++;
    const createdAt = new Date();
    const biography: UserBiography = { ...insertBiography, id, createdAt };
    this.biographies.set(id, biography);
    return biography;
  }

  async updateUserBiography(userId: number, biographyData: Partial<InsertUserBiography>): Promise<UserBiography> {
    const biography = Array.from(this.biographies.values()).find(
      (bio) => bio.userId === userId
    );
    
    if (!biography) {
      throw new Error(`Biography for user ID ${userId} not found`);
    }
    
    const updatedBiography = { ...biography, ...biographyData };
    this.biographies.set(biography.id, updatedBiography);
    return updatedBiography;
  }
}

export const storage = new MemStorage();
