import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const CACHE_KEY_PREFIX = '@image_cache_';
const CACHE_INDEX_KEY = '@image_cache_index';
const MAX_CACHE_SIZE_MB = 50; // 50MB cache size limit
const MAX_CACHE_SIZE_BYTES = MAX_CACHE_SIZE_MB * 1024 * 1024;

/**
 * Image cache management service
 * Stores images locally for offline access
 */
class ImageCacheService {
  constructor() {
    this.cacheDir = `${FileSystem.cacheDirectory}images/`;
    this.initializeCache();
  }

  /**
   * Initialize the cache directory
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
   * Generate a cache key from a URL
   */
  _getCacheKey(url) {
    // Use the URL as base for the key, replacing invalid characters
    return url.replace(/[^a-zA-Z0-9]/g, '_');
  }

  /**
   * Get the cached file path
   */
  _getCacheFilePath(cacheKey) {
    return `${this.cacheDir}${cacheKey}.jpg`;
  }

  /**
   * Retrieve the cache index (metadata)
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
   * Update the cache index
   */
  async _updateCacheIndex(index) {
    try {
      await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(index));
    } catch (error) {
      console.error('Error updating cache index:', error);
    }
  }

  /**
   * Calculate the total cache size
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
   * Clean up old cache entries if size exceeds the limit
   */
  async _cleanupCache() {
    try {
      const index = await this._getCacheIndex();
      const entries = Object.entries(index);

      // Sort by access date (oldest first)
      entries.sort((a, b) => (a[1].lastAccess || 0) - (b[1].lastAccess || 0));

      let currentSize = await this._getCacheSize();

      // Remove old entries until size is acceptable
      for (const [cacheKey, metadata] of entries) {
        if (currentSize <= MAX_CACHE_SIZE_BYTES * 0.8) break; // Keep 80% of the limit

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
   * Retrieve an image from cache or download it
   * @param {string} url - Image URL
   * @returns {Promise<string>} - Local image URI
   */
  async getImage(url) {
    if (!url) return null;

    // For web, return the URL directly
    if (Platform.OS === 'web') {
      return url;
    }

    const cacheKey = this._getCacheKey(url);
    const filePath = this._getCacheFilePath(cacheKey);

    try {
      // Check if the image already exists in cache
      const fileInfo = await FileSystem.getInfoAsync(filePath);

      if (fileInfo.exists) {
        // Update the last access date
        const index = await this._getCacheIndex();
        if (index[cacheKey]) {
          index[cacheKey].lastAccess = Date.now();
          await this._updateCacheIndex(index);
        }
        return filePath;
      }

      // Download the image
      const downloadResult = await FileSystem.downloadAsync(url, filePath);

      if (downloadResult.status === 200) {
        // Update the index with metadata
        const index = await this._getCacheIndex();
        const fileInfo = await FileSystem.getInfoAsync(filePath);

        index[cacheKey] = {
          url,
          size: fileInfo.size || 0,
          cachedAt: Date.now(),
          lastAccess: Date.now(),
        };

        await this._updateCacheIndex(index);

        // Check cache size and clean up if necessary
        const cacheSize = await this._getCacheSize();
        if (cacheSize > MAX_CACHE_SIZE_BYTES) {
          await this._cleanupCache();
        }

        return filePath;
      } else {
        console.warn('Failed to download image:', url, downloadResult.status);
        return url; // Fallback to original URL
      }
    } catch (error) {
      console.error('Error getting cached image:', error);
      return url; // Fallback to original URL
    }
  }

  /**
   * Preload multiple images in the background
   * @param {string[]} urls - List of URLs to preload
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
   * Clear the entire cache
   */
  async clearCache() {
    try {
      // Delete all files from the cache directory
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(this.cacheDir, { idempotent: true });
        await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
      }

      // Reset the index
      await AsyncStorage.removeItem(CACHE_INDEX_KEY);

      console.log('Image cache cleared successfully');
    } catch (error) {
      console.error('Error clearing image cache:', error);
    }
  }

  /**
   * Get cache statistics
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

// Export a singleton instance
export default new ImageCacheService();
