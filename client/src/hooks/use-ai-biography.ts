import { useTranslation } from "react-i18next";
import { UserBiography } from "./use-spotify";

export function useAiBiography(biography: UserBiography | undefined) {
  const { i18n } = useTranslation();
  
  if (!biography) {
    return null;
  }
  
  // Return biography text based on current language
  const getBiographyForCurrentLanguage = () => {
    const currentLanguage = i18n.language;
    
    if (currentLanguage === 'tr') {
      return biography.biographyTr;
    } else if (currentLanguage === 'ku') {
      return biography.biographyKu;
    } else {
      return biography.biographyEn; // Default to English
    }
  };
  
  // Format text for better readability
  const formatBiographyText = (text: string): string => {
    if (!text) return "";
    
    // Clean up any AI-generated formatting artifacts
    let cleanedText = text
      .replace(/^"|"$/g, "") // Remove quotes that sometimes appear at beginning/end
      .replace(/\\n/g, " ")  // Replace escaped newlines with spaces
      .trim();
    
    // If text is very short, return as is
    if (cleanedText.length < 100) return cleanedText;
    
    return cleanedText;
  };
  
  const rawText = getBiographyForCurrentLanguage();
  const formattedText = formatBiographyText(rawText);
  
  return {
    text: formattedText,
    rawText: rawText
  };
}
