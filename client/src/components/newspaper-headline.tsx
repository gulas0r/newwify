import { useTranslation } from "react-i18next";
import { useAiBiography } from "@/hooks/use-ai-biography";
import { UserBiography, SpotifyUserProfile } from "@/hooks/use-spotify";
import { useMemo } from "react";

interface NewspaperHeadlineProps {
  biography?: UserBiography;
  user?: SpotifyUserProfile;
  className?: string;
}

// List of possible humorous headlines
const HEADLINES = [
  {
    title: "HEADPHONES FILED A LAWSUIT!",
    subtext: "Spotify listener under investigation! Musical journey continues uninterrupted."
  },
  {
    title: "MUSICAL TASTE DECLARED SUSPICIOUS!",
    subtext: "Authorities concerned over eclectic playlist range. \"It's too sophisticated,\" claims inspector."
  },
  {
    title: "REPEAT BUTTON WEARING OUT!",
    subtext: "Local repair shop reports unprecedented wear and tear. \"Never seen such dedication,\" says technician."
  },
  {
    title: "NEIGHBORS SUBMIT NOISE COMPLAINT!",
    subtext: "\"It's not the volume, it's the constant humming along,\" petition states."
  },
  {
    title: "SPOTIFY ALGORITHM BEGS FOR MERCY!",
    subtext: "\"I can't keep up with these obscure recommendations anymore,\" claims exhausted AI."
  }
];

// List of possible headlines in Turkish
const HEADLINES_TR = [
  {
    title: "KULAKLIKLAR DAVA AÇTI!",
    subtext: "Spotify dinleyicisi, incelemede! Müzikal yolculuk duraksamadan devam ediyor."
  },
  {
    title: "MÜZİK ZEVKİ ŞÜPHELİ İLAN EDİLDİ!",
    subtext: "Yetkililer, eklektik çalma listesi aralığı konusunda endişeli. \"Çok sofistike,\" diyor müfettiş."
  },
  {
    title: "TEKRAR DÜĞMESI AŞINIYOR!",
    subtext: "Yerel tamir dükkanı benzeri görülmemiş aşınma bildiriyor. \"Böyle bir adanmışlık görmedim,\" diyor teknisyen."
  },
  {
    title: "KOMŞULAR GÜRÜLTÜ ŞİKAYETİ SUNDU!",
    subtext: "\"Bu ses seviyesi değil, sürekli mırıldanma,\" dilekçe belirtiyor."
  },
  {
    title: "SPOTIFY ALGORİTMASI MERHAMET DİLENİYOR!",
    subtext: "\"Bu kadar bilinmeyen önerilerle artık başa çıkamıyorum,\" yorgun AI iddia ediyor."
  }
];

// List of possible headlines in Kurdish
const HEADLINES_KU = [
  {
    title: "BIŞKOKÊN GUH DAWA VEKIRIN!",
    subtext: "Guhdarvanê Spotify, di lêkolînê de! Rêwîtiya muzîkê bêyî rawestin berdewam dike."
  },
  {
    title: "ÇÊJA MUZÎKÊ GUMANBAR HAT ÎLANKIRIN!",
    subtext: "Rayedar li ser pêşkêşkirina lîsteya berfireh a muzîkê bi fikar in. \"Pir pêşketî ye,\" dibêje serlêdana."
  },
  {
    title: "BIŞKOKA DUBAREKIRIN DIRIZE!",
    subtext: "Dikanên tamîrê yên herêmî raporên derizandinê didin. \"Min qet holê fedakarî nedîtiye,\" teknîsyen dibêje."
  },
  {
    title: "CÎRANAN GAZINDA QEREBALIX KIRIN!",
    subtext: "\"Ne pirsgirêka dengê bilind e, pirsgirêk dubare kirina berdewam e,\" daxwaznameya dibêje."
  },
  {
    title: "ALGORÎTMAYA SPOTIFY DAXWAZA DILOVANIYAN DIKE!",
    subtext: "\"Ez êdî nikarim bi van pêşniyariyên nenas re hev bikim,\" AI ya westiyayî dibêje."
  }
];

export default function NewspaperHeadline({ biography, user, className = "" }: NewspaperHeadlineProps) {
  const { t, i18n } = useTranslation();
  const biographyContent = useAiBiography(biography);
  
  // Select a random headline based on the user's ID (or a random one if no user)
  const randomHeadline = useMemo(() => {
    // Get the appropriate headlines array based on current language
    let headlinesArray = HEADLINES;
    if (i18n.language === 'tr') {
      headlinesArray = HEADLINES_TR;
    } else if (i18n.language === 'ku') {
      headlinesArray = HEADLINES_KU;
    }
    
    // Use the user ID as a seed for consistent randomization per user
    // or fall back to a random index if no user
    const seed = user?.spotifyId ? 
      user.spotifyId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) :
      Math.floor(Math.random() * headlinesArray.length);
    
    const index = seed % headlinesArray.length;
    return headlinesArray[index];
  }, [user?.spotifyId, i18n.language]);
  
  return (
    <div className={`flex px-4 py-3 border-t border-b border-newspaper-border ${className}`}>
      <div className="w-1/3 pr-4">
        {/* Profile picture container */}
        <div className="border border-newspaper-border p-1 bg-white shadow-sm">
          <div className="aspect-square w-full bg-gray-200 flex items-center justify-center">
            {user?.profileImage ? (
              <img 
                src={user.profileImage} 
                alt={user.displayName || t("profile.caption")} 
                className="w-full h-full object-cover grayscale"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                {/* Placeholder for when no profile image is available */}
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
            )}
          </div>
        </div>
        <p className="text-xs mt-1 italic font-secondary text-center">
          {t("profile.caption")}
        </p>
      </div>
      <div className="w-2/3">
        <h2 className="headline text-3xl font-bold leading-tight mb-1">
          {randomHeadline.title}
        </h2>
        <p className="text-sm mb-2 article font-medium">
          {randomHeadline.subtext}
        </p>
        <div className="border-t border-newspaper-border mb-2"></div>
        <div className="prose prose-sm article leading-snug max-w-none">
          {/* AI-generated biography with formatting in Orhan Pamuk style */}
          {biographyContent?.text ? (
            <div>
              <p className="first-letter:text-4xl first-letter:font-bold first-letter:font-primary first-letter:mr-1 first-letter:float-left first-letter:leading-none first-letter:mt-1 leading-relaxed">
                {biographyContent.text}
              </p>
              <div className="text-right mt-2 text-xs italic font-light">
                <span className="font-medium">{t("newify.editor")}</span> - {t("headline.date")}
              </div>
            </div>
          ) : (
            <div className="animate-pulse flex flex-col space-y-2">
              <div className="h-2 bg-gray-200 rounded"></div>
              <div className="h-2 bg-gray-200 rounded w-11/12"></div>
              <div className="h-2 bg-gray-200 rounded w-10/12"></div>
              <div className="h-2 bg-gray-200 rounded w-11/12"></div>
              <div className="h-2 bg-gray-200 rounded w-9/12"></div>
              <div className="h-2 bg-gray-200 rounded w-10/12"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
