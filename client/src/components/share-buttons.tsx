import { FC } from "react";
import { useTranslation } from "react-i18next";
import { 
  FaTwitter, 
  FaFacebook, 
  FaWhatsapp,
  FaLink,
  FaTumblr,
  FaReddit
} from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface ShareButtonsProps {
  className?: string;
  userData?: {
    user: {
      displayName: string | null;
    };
  };
}

const ShareButtons: FC<ShareButtonsProps> = ({ className = "", userData }) => {
  const { t } = useTranslation();
  const baseUrl = window.location.origin;
  
  // Create share URL with user data encoded in query parameters if available
  const getShareUrl = () => {
    const url = new URL(baseUrl);
    
    // Add user data as query parameters
    if (userData?.user?.displayName) {
      url.searchParams.append("name", userData.user.displayName);
    }
    
    // Add a pre-generated share ID for tracking
    const shareId = Math.random().toString(36).substring(2, 8);
    url.searchParams.append("share", shareId);
    
    return url.toString();
  };
  
  const shareUrl = getShareUrl();
  const shareTitle = t("share.title", { username: userData?.user?.displayName || t("share.anonymous") });
  const shareMessage = t("share.message");
  
  // Track share event
  const trackShare = (platform: string) => {
    try {
      // Log share event
      console.log(`Shared on ${platform}: ${shareUrl}`);
      
      // If we had analytics, we would send the event data here
      // Example: sendAnalytics('share', { platform, url: shareUrl });
    } catch (error) {
      console.error('Error tracking share:', error);
    }
  };
  
  // Share to Twitter
  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank");
    trackShare('twitter');
  };
  
  // Share to Facebook
  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareTitle)}`;
    window.open(url, "_blank");
    trackShare('facebook');
  };
  
  // Share to WhatsApp
  const shareToWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareTitle + " " + shareUrl)}`;
    window.open(url, "_blank");
    trackShare('whatsapp');
  };
  
  // Share to Tumblr
  const shareToTumblr = () => {
    const url = `https://www.tumblr.com/widgets/share/tool?posttype=link&title=${encodeURIComponent(shareTitle)}&caption=${encodeURIComponent(shareMessage)}&content=${encodeURIComponent(shareUrl)}&canonicalUrl=${encodeURIComponent(shareUrl)}&shareSource=tumblr_share_button`;
    window.open(url, "_blank");
    trackShare('tumblr');
  };
  
  // Share to Reddit
  const shareToReddit = () => {
    const url = `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}`;
    window.open(url, "_blank");
    trackShare('reddit');
  };
  
  // Copy link to clipboard
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: t("share.copied"),
        description: t("share.copiedMessage"),
      });
      trackShare('clipboard');
    } catch (err) {
      toast({
        title: t("share.error"),
        description: t("share.errorCopying"),
        variant: "destructive",
      });
      console.error("Failed to copy link:", err);
    }
  };
  
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-1 bg-[#1DA1F2] text-white hover:bg-[#1A91DA]"
        onClick={shareToTwitter}
      >
        <FaTwitter className="w-4 h-4" />
        <span className="hidden md:inline">{t("share.twitter")}</span>
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-1 bg-[#4267B2] text-white hover:bg-[#365899]"
        onClick={shareToFacebook}
      >
        <FaFacebook className="w-4 h-4" />
        <span className="hidden md:inline">{t("share.facebook")}</span>
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-1 bg-[#25D366] text-white hover:bg-[#20BD5C]"
        onClick={shareToWhatsApp}
      >
        <FaWhatsapp className="w-4 h-4" />
        <span className="hidden md:inline">{t("share.whatsapp")}</span>
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-1 bg-[#36465D] text-white hover:bg-[#2E3C4F]"
        onClick={shareToTumblr}
      >
        <FaTumblr className="w-4 h-4" />
        <span className="hidden md:inline">{t("share.tumblr")}</span>
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-1 bg-[#FF5700] text-white hover:bg-[#E24D00]"
        onClick={shareToReddit}
      >
        <FaReddit className="w-4 h-4" />
        <span className="hidden md:inline">{t("share.reddit")}</span>
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-1 bg-gray-600 text-white hover:bg-gray-700"
        onClick={copyLink}
      >
        <FaLink className="w-4 h-4" />
        <span className="hidden md:inline">{t("share.copy")}</span>
      </Button>
    </div>
  );
};

export default ShareButtons;