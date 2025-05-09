import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";

interface LanguageSwitcherProps {
  className?: string;
}

export default function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const [activeLanguage, setActiveLanguage] = useState(i18n.language || "tr");
  
  // Update active language when i18n language changes
  useEffect(() => {
    setActiveLanguage(i18n.language);
  }, [i18n.language]);
  
  const languages = [
    { code: "tr", label: "Türkçe" },
    { code: "en", label: "English" },
    { code: "ku", label: "Kurdî" }
  ];
  
  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    setActiveLanguage(lang);
  };
  
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-xs mr-1 font-secondary italic">Language:</span>
      {languages.map((lang) => (
        <Button
          key={lang.code}
          variant="ghost"
          size="sm"
          className={`px-3 py-1 text-xs font-secondary bg-sepia border border-newspaper-border hover:bg-newspaper-black hover:text-sepia transition-colors ${
            activeLanguage === lang.code ? "font-bold bg-newspaper-black text-sepia" : ""
          }`}
          onClick={() => handleLanguageChange(lang.code)}
        >
          {lang.label}
        </Button>
      ))}
    </div>
  );
}
