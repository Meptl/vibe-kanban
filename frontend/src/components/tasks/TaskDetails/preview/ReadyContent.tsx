import { useTranslation } from 'react-i18next';

interface ReadyContentProps {
  url?: string;
  iframeKey: string;
  onIframeError: () => void;
  onIframeLoad?: (url: string) => void;
}

export function ReadyContent({
  url,
  iframeKey,
  onIframeError,
  onIframeLoad,
}: ReadyContentProps) {
  const { t } = useTranslation('tasks');

  return (
    <div className="flex-1">
      <iframe
        key={iframeKey}
        src={url}
        title={t('preview.iframe.title')}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        referrerPolicy="no-referrer"
        onError={onIframeError}
        onLoad={(e) => {
          const iframe = e.currentTarget;

          try {
            const loadedUrl = iframe.contentWindow?.location.href;
            if (loadedUrl) {
              onIframeLoad?.(loadedUrl);
              return;
            }
          } catch {
            // Cross-origin iframe, ignore and keep the last known URL.
          }

          if (iframe.src) {
            onIframeLoad?.(iframe.src);
          }
        }}
      />
    </div>
  );
}
