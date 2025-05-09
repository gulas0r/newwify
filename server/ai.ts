import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

// Initialize AI models
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

// Log warnings if API keys are missing
if (!GEMINI_API_KEY) {
  console.warn("Gemini API key not found. Primary biography generation will fall back to alternative model.");
}

if (!OPENAI_API_KEY) {
  console.warn("OpenAI API key not found. Fallback biography generation will not work.");
}

// Initialize Gemini
let genAI: GoogleGenerativeAI | null = null;

try {
  if (GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
} catch (error) {
  console.error("Failed to initialize Google Generative AI:", error);
}

// Initialize OpenAI client for DeepSeek
let openai: OpenAI | null = null;

try {
  if (OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
      baseURL: "https://api.deepseek.com/v1", // DeepSeek API compatible with OpenAI
    });
  }
} catch (error) {
  console.error("Failed to initialize OpenAI client for DeepSeek:", error);
}

interface TrackInfo {
  name: string;
  artist: string;
}

interface BiographyOptions {
  tracks: TrackInfo[];
  language: "en" | "tr" | "ku";
  artistGenres?: string[];
  playlists?: string[];
  topArtists?: string[];
  mostPlayedSong?: string;
  userDisplayName?: string;
}

/**
 * Generate a biography based on user's top tracks
 * @param options The options for the biography
 * @returns A promise that resolves to the biography
 */
export async function generateBiography(options: BiographyOptions): Promise<string> {
  // Check if any AI model is available
  if (!genAI && !openai) {
    throw new Error("No AI models available for biography generation");
  }

  const { tracks, language, artistGenres = [], playlists = [], topArtists = [], mostPlayedSong, userDisplayName } = options;

  // Convert tracks to text
  const tracksText = tracks.map((track, index) => `${index + 1}. "${track.name}" by ${track.artist}`).join("\n");
  
  // Add more user context if available
  const userContext = [];
  if (artistGenres.length > 0) {
    userContext.push(`Favorite music genres: ${artistGenres.join(", ")}`);
  }
  if (topArtists.length > 0) {
    userContext.push(`Top artists: ${topArtists.join(", ")}`);
  }
  if (mostPlayedSong) {
    userContext.push(`Most played song: ${mostPlayedSong}`);
  }
  if (playlists.length > 0) {
    userContext.push(`Playlist themes: ${playlists.join(", ")}`);
  }
  
  const userContextText = userContext.length > 0 ? "\n\nAdditional context about the listener:\n" + userContext.join("\n") : "";

  // Prepare prompt based on language
  let prompt = "";
  
  if (language === "en") {
    prompt = `Write in the exact literary style of Nobel Prize-winning Turkish author Orhan Pamuk based on these top songs a person listens to:
${tracksText}${userContextText}

Craft a melancholic and introspective music biography (500-600 characters) that explores the intersection of memory, identity, and nostalgia through their music taste.
Your writing should feature the following Orhan Pamuk characteristics:
- Rich, layered descriptions that build a sensory atmosphere
- Melancholic tone with philosophical musings about music and identity
- Nostalgic reflections on the past with a sense of hüzün (Turkish melancholy)
- Long, meandering sentences with multiple clauses interspersed with short, impactful observations
- Subtle references to Istanbul's music culture or East-West tensions when appropriate
- Delicate weaving of personal and collective memory into a unified narrative

IMPORTANT RESTRICTIONS:
- Never directly mention song titles, artist names, or playlist names in your text
- Never use the person's actual name even if provided
- Never sound like AI - mimic Pamuk's distinctive literary voice precisely while focusing on music and identity
- Include subtle references to their music taste as part of the personal narrative without naming songs/artists
- Set the narrative in the early 1970s music scene - do not reference modern technology or years beyond the 1970s`;
  } else if (language === "tr") {
    prompt = `Nobel ödüllü Türk yazar Orhan Pamuk'un edebi tarzını kullarak, bir kişinin dinlediği şu şarkılara dayanarak yazı yaz:
${tracksText}${userContextText}

Bu kişinin müzik zevkinden yola çıkarak bellek, kimlik ve nostalji kesişimini inceleyen melankolik ve içe dönük bir müzik biyografisi yaz (500-600 karakter).

Yazın şu Orhan Pamuk özelliklerini taşımalı:
- Duyusal bir atmosfer oluşturan zengin, katmanlı betimlemeler
- Müzik ve kimlik üzerine felsefi düşünceler içeren melankolik ton
- Geçmişe dair hüzün dolu nostaljik yansımalar
- Kısa, etkili gözlemlerle kesilen çok yan cümleli, dolambaçlı uzun cümleler
- İstanbul'un müzik kültürüne veya Doğu-Batı gerilimine uygun yerlerde ince göndermeler
- Kişisel ve kolektif belleğin birleşik bir anlatıda ustaca harmanlanması

ÖNEMLİ KISITLAMALAR:
- Metinde asla şarkı başlıklarını, sanatçı adlarını veya çalma listesi adlarını doğrudan belirtme
- Gerçek kişi adını asla kullanma, sağlansa bile
- Asla yapay zeka gibi konuşma - müzik ve kimliğe odaklanırken Pamuk'un ayırt edici edebi sesini tam olarak taklit et
- Şarkı/sanatçı isimleri vermeden müzik zevklerine dair ince göndermeler yap
- Anlatıyı 1970'lerin başındaki müzik sahnesinde kurgula - modern teknolojiden veya 1970'lerin ötesindeki yıllardan bahsetme`;
  } else if (language === "ku") {
    prompt = `Bi şêwaza edebî ya nivîskarê Tirk ê xelata Nobelê Orhan Pamuk, li ser van stranên ku kesek guhdarî dike binivîse:
${tracksText}${userContextText}

Ji xweşbîniya muzîkê ya vî kesî, bîyografiyek muzîkê ya melankolî û fikrî binivîse (500-600 tîp) ku têkiliya navbera bîranîn, nasname û nostaljiyê vedikole.

Nivîsandina te divê van taybetmendiyên Orhan Pamuk hebe:
- Danasînên dewlemend û çîneçîn ên ku atmosferek hestî ava dikin
- Toneke melankolî bi hizrên felsefî li ser muzîk û nasnameyê
- Refleksiyonên nostaljîk ên li ser dema borî bi hişmendiya xemgîniyê (hüzün)
- Hevokên dirêj ên tevlihev bi gelek klozên lawe ku bi çavdêriyên kin û bandordar ve tên qutbûn
- Referansên nazik bo çanda muzîkê ya Stenbolê an jî tengahiyên Rojhilat-Rojava li cihên guncav
- Tevlihevkirina hosta ya bîranînên kesane û kolektîf di nav vegotinek yekgirtî

SÎNORÊN GIRÎNG:
- Di nivîsa xwe de qet navên stranan, navên hunermandan, an navên lîsteyên lêdanê rasterast nebêje
- Navê rastîn ê kesî qet bi kar nîne, tevî ku hatibe dayîn jî
- Qet wekî AI nexuyê - dema ku li ser muzîk û nasnameyê hûr dibî, dengê edebî yê cuda yê Pamuk bi tevahî teqlîd bike
- Bêyî ku navên stranan/hunermandan bibêjî, di nav çîroka kesane de behsa xweşbîniya muzîkê ya wan bike
- Vegotinê di dîmena muzîkê ya destpêka salên 1970an de saz bike - qala teknolojiya modern an salên piştî 1970an neke`;
  }

  // Generate content
  const model = genAI ? genAI.getGenerativeModel({ model: "gemini-1.5-pro" }) : null;
  
  try {
    // First try with Gemini
    if (genAI) {
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Allow longer content (max 600 characters)
        return text.length > 600 ? text.substring(0, 597) + "..." : text;
      } catch (geminiError) {
        console.error("Error generating biography with Gemini:", geminiError);
        
        // If Gemini fails (e.g., rate limit), try with DeepSeek via OpenAI client
        if (openai) {
          console.log("Falling back to DeepSeek for biography generation");
          
          try {
            // DeepSeek integration via OpenAI API
            const completion = await openai.chat.completions.create({
              model: "deepseek-chat", // Use DeepSeek chat model
              messages: [
                { 
                  role: "system", 
                  content: "You are a skilled literary ghostwriter who excels at mimicking the style of Nobel Prize-winning author Orhan Pamuk." 
                },
                { role: "user", content: prompt }
              ],
              temperature: 0.7,
              max_tokens: 1000
            });
            
            const text = completion.choices[0]?.message?.content || "";
            
            // Allow longer content (max 600 characters)
            return text.length > 600 ? text.substring(0, 597) + "..." : text;
          } catch (deepseekError) {
            console.error("Error generating biography with DeepSeek:", deepseekError);
            throw deepseekError; // Rethrow to use fallback responses
          }
        } else {
          throw geminiError; // Rethrow to use fallback responses
        }
      }
    } else if (openai) {
      // If Gemini is not available, try directly with DeepSeek
      console.log("Using DeepSeek for biography generation (Gemini not available)");
      
      try {
        // DeepSeek integration via OpenAI API
        const completion = await openai.chat.completions.create({
          model: "deepseek-chat", // Use DeepSeek chat model
          messages: [
            { 
              role: "system", 
              content: "You are a skilled literary ghostwriter who excels at mimicking the style of Nobel Prize-winning author Orhan Pamuk." 
            },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1000
        });
        
        const text = completion.choices[0]?.message?.content || "";
        
        // Allow longer content (max 600 characters)
        return text.length > 600 ? text.substring(0, 597) + "..." : text;
      } catch (deepseekError) {
        console.error("Error generating biography with DeepSeek:", deepseekError);
        throw deepseekError; // Rethrow to use fallback responses
      }
    } else {
      throw new Error("No AI models available for biography generation");
    }
  } catch (error) {
    console.error("All biography generation methods failed:", error);
    
    // Fallback responses in case of error - styled after Orhan Pamuk's literary voice
    if (language === "en") {
      return "In the melancholic twilight of the early 1970s, when vinyl records still carried the weight of memories yet to be formed, they wandered between the record shops of Istanbul with a peculiar solemnity. Their fingers, stained with cigarette traces and poetry ink, would trace album spines as if reading braille—each melody a forgotten conversation, each rhythm a street they once knew. The music they collected spoke of both East and West; a fractured identity mirrored in the songs that filled their silent apartment overlooking the Bosphorus.";
    } else if (language === "tr") {
      return "1970'lerin melankolik alacakaranlığında, plak kayıtları henüz oluşmamış anıların ağırlığını taşırken, onlar İstanbul'un plakçıları arasında tuhaf bir ciddiyet ile dolaşıyorlardı. Sigara izleri ve şiir mürekkebiyle lekelenmiş parmakları, sanki körler alfabesi okur gibi albüm sırtlarında gezinirdi—her melodi unutulmuş bir sohbet, her ritim bir zamanlar bildikleri bir sokaktı. Topladıkları müzik hem Doğu'dan hem Batı'dan bahsediyordu; Boğaz'a bakan sessiz dairelerini dolduran şarkılarda yansıyan parçalanmış bir kimlik.";
    } else {
      return "Di nîv-tariya melankola destpêka salên 1970an de, dema ku qeydên vînîlê hîn giraniya bîranînên ku hê nehatibin çêkirin hildigirtin, ew di navbera dikanên qeydan ên Stenbolê de bi cidiyetek seyr diçûn û dihatin. Tiliyên wan, bi şopên cigareyan û hubra helbestê lekekirî, wek ku braille dixwînin, li ser pişta albûman diçûn û dihatin—her melodî axaftinek ji bîrkirî, her rîtm kolanek ku demekê ew nas dikirin. Muzîka ku wan berhev dikir, hem ji Rojhilat û hem jî ji Rojava diaxivî; nasnameyek parçebûyî ku di stranên ku xaniyê wan ê bêdeng ê li ser Boğazîçiyê dagirtî de dihat nîşandan.";
    }
  }
}

/**
 * Generate biographies in all supported languages
 * @param tracks The user's top tracks
 * @param extraData Additional data about the user's music preferences
 * @returns A promise that resolves to biographies in all languages
 */
export async function generateAllBiographies(
  tracks: TrackInfo[], 
  extraData?: {
    artistGenres?: string[],
    playlists?: string[],
    topArtists?: string[],
    mostPlayedSong?: string,
    userDisplayName?: string
  }
): Promise<{
  en: string;
  tr: string;
  ku: string;
}> {
  try {
    // Extract extra data or set default empty values
    const artistGenres = extraData?.artistGenres || [];
    const playlists = extraData?.playlists || [];
    const topArtists = extraData?.topArtists || [];
    const mostPlayedSong = extraData?.mostPlayedSong;
    const userDisplayName = extraData?.userDisplayName;
    
    // Try to generate biographies sequentially to avoid rate limits
    const enBio = await generateBiography({ 
      tracks, 
      language: "en", 
      artistGenres,
      playlists,
      topArtists,
      mostPlayedSong,
      userDisplayName 
    });
    
    // Add some delay to avoid hitting rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const trBio = await generateBiography({ 
      tracks, 
      language: "tr",
      artistGenres,
      playlists,
      topArtists,
      mostPlayedSong,
      userDisplayName
    });
    
    // Add some delay to avoid hitting rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const kuBio = await generateBiography({ 
      tracks, 
      language: "ku",
      artistGenres,
      playlists,
      topArtists,
      mostPlayedSong,
      userDisplayName
    });

    return {
      en: enBio,
      tr: trBio,
      ku: kuBio,
    };
  } catch (error) {
    console.error("Failed to generate all biographies:", error);
    
    // Return Orhan Pamuk styled fallback biographies if AI generation fails
    return {
      en: "In the melancholic twilight of the early 1970s, when vinyl records still carried the weight of memories yet to be formed, they wandered between the record shops of Istanbul with a peculiar solemnity. Their fingers, stained with cigarette traces and poetry ink, would trace album spines as if reading braille—each melody a forgotten conversation, each rhythm a street they once knew. The music they collected spoke of both East and West; a fractured identity mirrored in the songs that filled their silent apartment overlooking the Bosphorus.",
      tr: "1970'lerin melankolik alacakaranlığında, plak kayıtları henüz oluşmamış anıların ağırlığını taşırken, onlar İstanbul'un plakçıları arasında tuhaf bir ciddiyet ile dolaşıyorlardı. Sigara izleri ve şiir mürekkebiyle lekelenmiş parmakları, sanki körler alfabesi okur gibi albüm sırtlarında gezinirdi—her melodi unutulmuş bir sohbet, her ritim bir zamanlar bildikleri bir sokaktı. Topladıkları müzik hem Doğu'dan hem Batı'dan bahsediyordu; Boğaz'a bakan sessiz dairelerini dolduran şarkılarda yansıyan parçalanmış bir kimlik.",
      ku: "Di nîv-tariya melankola destpêka salên 1970an de, dema ku qeydên vînîlê hîn giraniya bîranînên ku hê nehatibin çêkirin hildigirtin, ew di navbera dikanên qeydan ên Stenbolê de bi cidiyetek seyr diçûn û dihatin. Tiliyên wan, bi şopên cigareyan û hubra helbestê lekekirî, wek ku braille dixwînin, li ser pişta albûman diçûn û dihatin—her melodî axaftinek ji bîrkirî, her rîtm kolanek ku demekê ew nas dikirin. Muzîka ku wan berhev dikir, hem ji Rojhilat û hem jî ji Rojava diaxivî; nasnameyek parçebûyî ku di stranên ku xaniyê wan ê bêdeng ê li ser Boğazîçiyê dagirtî de dihat nîşandan."
    };
  }
}
