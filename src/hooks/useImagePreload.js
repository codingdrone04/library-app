import { useEffect } from 'react';
import imageCacheService from '../services/imageCacheService';

/**
 * Hook personnalisé pour précharger les images en arrière-plan
 * Utile pour les listes de livres où on veut mettre en cache
 * les images avant même qu'elles soient affichées
 *
 * @param {string|string[]} urls - URL(s) des images à précharger
 * @param {boolean} enabled - Active/désactive le préchargement
 */
export const useImagePreload = (urls, enabled = true) => {
  useEffect(() => {
    if (!enabled || !urls) return;

    const urlArray = Array.isArray(urls) ? urls : [urls];
    const validUrls = urlArray.filter(url => url && typeof url === 'string');

    if (validUrls.length === 0) return;

    // Précharge les images en arrière-plan
    imageCacheService.preloadImages(validUrls).catch(err => {
      console.warn('Failed to preload images:', err);
    });
  }, [urls, enabled]);
};

export default useImagePreload;
