import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const CACHE_KEY_PREFIX = '@image_cache_';
const CACHE_INDEX_KEY = '@image_cache_index';
const MAX_CACHE_SIZE_MB = 50; // Limite de 50MB pour le cache
const MAX_CACHE_SIZE_BYTES = MAX_CACHE_SIZE_MB * 1024 * 1024;

/**
 * Service de gestion du cache d'images
 * Stocke les images localement pour un accès hors ligne
 */
class ImageCacheService {
  constructor() {
    this.cacheDir = `${FileSystem.cacheDirectory}images/`;
    this.initializeCache();
  }

  /**
   * Initialise le répertoire de cache
   */
  async initializeCache() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
      }
    } catch (error) {
      console.error('Error initializing image cache directory:', error);
    }
  }

  /**
   * Génère une clé de cache à partir d'une URL
   */
  _getCacheKey(url) {
    // Utilise l'URL comme base pour la clé, en remplaçant les caractères non valides
    return url.replace(/[^a-zA-Z0-9]/g, '_');
  }

  /**
   * Récupère le chemin du fichier en cache
   */
  _getCacheFilePath(cacheKey) {
    return `${this.cacheDir}${cacheKey}.jpg`;
  }

  /**
   * Récupère l'index du cache (métadonnées)
   */
  async _getCacheIndex() {
    try {
      const indexJson = await AsyncStorage.getItem(CACHE_INDEX_KEY);
      return indexJson ? JSON.parse(indexJson) : {};
    } catch (error) {
      console.error('Error reading cache index:', error);
      return {};
    }
  }

  /**
   * Met à jour l'index du cache
   */
  async _updateCacheIndex(index) {
    try {
      await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(index));
    } catch (error) {
      console.error('Error updating cache index:', error);
    }
  }

  /**
   * Calcule la taille totale du cache
   */
  async _getCacheSize() {
    try {
      const index = await this._getCacheIndex();
      return Object.values(index).reduce((total, item) => total + (item.size || 0), 0);
    } catch (error) {
      console.error('Error calculating cache size:', error);
      return 0;
    }
  }

  /**
   * Nettoie les anciennes entrées du cache si la taille dépasse la limite
   */
  async _cleanupCache() {
    try {
      const index = await this._getCacheIndex();
      const entries = Object.entries(index);

      // Trie par date d'accès (plus ancien en premier)
      entries.sort((a, b) => (a[1].lastAccess || 0) - (b[1].lastAccess || 0));

      let currentSize = await this._getCacheSize();

      // Supprime les anciennes entrées jusqu'à ce que la taille soit acceptable
      for (const [cacheKey, metadata] of entries) {
        if (currentSize <= MAX_CACHE_SIZE_BYTES * 0.8) break; // Garde 80% de la limite

        try {
          const filePath = this._getCacheFilePath(cacheKey);
          await FileSystem.deleteAsync(filePath, { idempotent: true });
          delete index[cacheKey];
          currentSize -= metadata.size || 0;
        } catch (error) {
          console.error('Error deleting cached file:', error);
        }
      }

      await this._updateCacheIndex(index);
    } catch (error) {
      console.error('Error cleaning up cache:', error);
    }
  }

  /**
   * Récupère une image depuis le cache ou la télécharge
   * @param {string} url - URL de l'image
   * @returns {Promise<string>} - URI locale de l'image
   */
  async getImage(url) {
    if (!url) return null;

    // Pour le web, retourne directement l'URL
    if (Platform.OS === 'web') {
      return url;
    }

    const cacheKey = this._getCacheKey(url);
    const filePath = this._getCacheFilePath(cacheKey);

    try {
      // Vérifie si l'image existe déjà en cache
      const fileInfo = await FileSystem.getInfoAsync(filePath);

      if (fileInfo.exists) {
        // Met à jour la date du dernier accès
        const index = await this._getCacheIndex();
        if (index[cacheKey]) {
          index[cacheKey].lastAccess = Date.now();
          await this._updateCacheIndex(index);
        }
        return filePath;
      }

      // Télécharge l'image
      const downloadResult = await FileSystem.downloadAsync(url, filePath);

      if (downloadResult.status === 200) {
        // Met à jour l'index avec les métadonnées
        const index = await this._getCacheIndex();
        const fileInfo = await FileSystem.getInfoAsync(filePath);

        index[cacheKey] = {
          url,
          size: fileInfo.size || 0,
          cachedAt: Date.now(),
          lastAccess: Date.now(),
        };

        await this._updateCacheIndex(index);

        // Vérifie la taille du cache et nettoie si nécessaire
        const cacheSize = await this._getCacheSize();
        if (cacheSize > MAX_CACHE_SIZE_BYTES) {
          await this._cleanupCache();
        }

        return filePath;
      } else {
        console.warn('Failed to download image:', url, downloadResult.status);
        return url; // Fallback sur l'URL originale
      }
    } catch (error) {
      console.error('Error getting cached image:', error);
      return url; // Fallback sur l'URL originale
    }
  }

  /**
   * Précharge plusieurs images en arrière-plan
   * @param {string[]} urls - Liste d'URLs à précharger
   */
  async preloadImages(urls) {
    if (Platform.OS === 'web') return;

    const promises = urls
      .filter(url => url && typeof url === 'string')
      .map(url => this.getImage(url).catch(err => {
        console.warn('Failed to preload image:', url, err);
        return null;
      }));

    await Promise.allSettled(promises);
  }

  /**
   * Vide complètement le cache
   */
  async clearCache() {
    try {
      // Supprime tous les fichiers du répertoire de cache
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(this.cacheDir, { idempotent: true });
        await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
      }

      // Réinitialise l'index
      await AsyncStorage.removeItem(CACHE_INDEX_KEY);

      console.log('Image cache cleared successfully');
    } catch (error) {
      console.error('Error clearing image cache:', error);
    }
  }

  /**
   * Récupère des statistiques sur le cache
   */
  async getCacheStats() {
    try {
      const index = await this._getCacheIndex();
      const cacheSize = await this._getCacheSize();
      const itemCount = Object.keys(index).length;

      return {
        size: cacheSize,
        sizeMB: (cacheSize / (1024 * 1024)).toFixed(2),
        maxSizeMB: MAX_CACHE_SIZE_MB,
        itemCount,
        items: Object.entries(index).map(([key, metadata]) => ({
          key,
          ...metadata,
        })),
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        size: 0,
        sizeMB: '0.00',
        maxSizeMB: MAX_CACHE_SIZE_MB,
        itemCount: 0,
        items: [],
      };
    }
  }
}

// Export une instance singleton
export default new ImageCacheService();
