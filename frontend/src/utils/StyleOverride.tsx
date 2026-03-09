import { useEffect } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { ThemeMode } from 'shared/types';

interface VibeStyleOverrideMessage {
  type: 'VIBE_STYLE_OVERRIDE';
  payload:
    | {
        kind: 'cssVars';
        variables: Record<string, string>;
      }
    | {
        kind: 'theme';
        theme: ThemeMode;
      };
}

interface VibeIframeReadyMessage {
  type: 'VIBE_IFRAME_READY';
}

interface VibeIframeNavigationMessage {
  type: 'VIBE_IFRAME_NAVIGATION';
  payload: {
    url: string;
  };
}

// Component that adds postMessage listener for style overrides
export function AppWithStyleOverride({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setTheme } = useTheme();

  useEffect(() => {
    function handleStyleMessage(event: MessageEvent) {
      if (event.data?.type !== 'VIBE_STYLE_OVERRIDE') return;

      // Origin validation (only if VITE_PARENT_ORIGIN is configured)
      const allowedOrigin = import.meta.env.VITE_PARENT_ORIGIN;
      if (allowedOrigin && event.origin !== allowedOrigin) {
        console.warn(
          '[StyleOverride] Message from unauthorized origin:',
          event.origin
        );
        return;
      }

      const message = event.data as VibeStyleOverrideMessage;

      // CSS variable overrides (only --vibe-* prefixed variables)
      if (
        message.payload.kind === 'cssVars' &&
        typeof message.payload.variables === 'object'
      ) {
        Object.entries(message.payload.variables).forEach(([name, value]) => {
          if (typeof value === 'string') {
            document.documentElement.style.setProperty(name, value);
          }
        });
      } else if (message.payload.kind === 'theme') {
        setTheme(message.payload.theme);
      }
    }

    window.addEventListener('message', handleStyleMessage);
    return () => window.removeEventListener('message', handleStyleMessage);
  }, [setTheme]);

  // Send ready message to parent when component mounts
  useEffect(() => {
    const allowedOrigin = import.meta.env.VITE_PARENT_ORIGIN;

    // Only send if we're in an iframe and have a parent
    if (window.parent && window.parent !== window) {
      const readyMessage: VibeIframeReadyMessage = {
        type: 'VIBE_IFRAME_READY',
      };

      // Send to specific origin if configured, otherwise send to any origin
      const targetOrigin = allowedOrigin || '*';
      window.parent.postMessage(readyMessage, targetOrigin);
    }
  }, []);

  // Send navigation updates so parent preview toolbars can track SPA routes.
  useEffect(() => {
    const allowedOrigin = import.meta.env.VITE_PARENT_ORIGIN;

    if (!window.parent || window.parent === window) {
      return;
    }

    const targetOrigin = allowedOrigin || '*';
    const postNavigation = () => {
      const navigationMessage: VibeIframeNavigationMessage = {
        type: 'VIBE_IFRAME_NAVIGATION',
        payload: {
          url: window.location.href,
        },
      };
      window.parent.postMessage(navigationMessage, targetOrigin);
    };

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function pushStateProxy(...args) {
      originalPushState.apply(window.history, args);
      postNavigation();
    };

    window.history.replaceState = function replaceStateProxy(...args) {
      originalReplaceState.apply(window.history, args);
      postNavigation();
    };

    window.addEventListener('popstate', postNavigation);
    window.addEventListener('hashchange', postNavigation);
    postNavigation();

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', postNavigation);
      window.removeEventListener('hashchange', postNavigation);
    };
  }, []);

  return <>{children}</>;
}
