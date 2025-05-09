import { useTranslation } from "react-i18next";

interface NewspaperMastheadProps {
  className?: string;
}

export default function NewspaperMasthead({ className = "" }: NewspaperMastheadProps) {
  const { t } = useTranslation();
  
  return (
    <div className={`py-3 px-4 text-center border-t-2 border-b-2 border-newspaper-black ${className}`}>
      <p className="text-xs font-secondary">
        {t("app.date")}
        <span className="float-right">
          {t("app.price")}
        </span>
      </p>
      <h1 className="text-4xl font-newspaper-title uppercase tracking-wide leading-tight mt-2 mb-1">
        {t("app.title")}
      </h1>
      <p className="text-xs font-secondary italic">
        {t("app.subtitle")}
      </p>
    </div>
  );
}
