/*
 * Decorative tech-department seal for printable documents.
 */
import { useTranslation } from '../utils/i18n';

interface DocStampSealProps {
  workspaceName?: string;
}

export default function DocStampSeal({ workspaceName }: DocStampSealProps) {
  const { t } = useTranslation();
  const orgLine = workspaceName?.trim() || '';

  return (
    <div className="doc-stamp-seal" aria-hidden="true">
      <span className="doc-stamp-seal__title">{t('ТЕХОТДЕЛ')}</span>
      {orgLine ? <span className="doc-stamp-seal__org">{orgLine.toUpperCase()}</span> : null}
      <span className="doc-stamp-seal__sub">{t('ДЛЯ ДОКУМЕНТОВ')}</span>
    </div>
  );
}
