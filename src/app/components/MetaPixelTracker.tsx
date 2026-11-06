import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initializeMetaPixel, trackPageView } from '../lib/metaPixel';

export const MetaPixelTracker = () => {
  const { pathname, search } = useLocation();
  const currentPath = `${pathname}${search}`;

  useEffect(() => {
    if (!initializeMetaPixel()) {
      return;
    }
    // Base snippet in index.html already tracks initial PageView.
    window._metaLastPageViewPath = currentPath;
  }, []);

  useEffect(() => {
    if (!initializeMetaPixel()) {
      return;
    }
    if (window._metaLastPageViewPath === currentPath) {
      return;
    }
    trackPageView();
    window._metaLastPageViewPath = currentPath;
  }, [currentPath]);

  return null;
};
