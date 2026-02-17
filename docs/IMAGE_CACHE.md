# Image Caching System

## Overview

The image caching system stores book cover images locally for fast access and offline functionality. Images are automatically downloaded and cached on first view.

## Architecture

### Components

1. **ImageCacheService** ([src/services/imageCacheService.js](../src/services/imageCacheService.js))
   - Singleton service that manages image cache
   - Uses `expo-file-system` for file storage
   - Uses `AsyncStorage` for index and metadata

2. **SafeImage** ([src/components/SafeImage.jsx](../src/components/SafeImage.jsx))
   - Wrapper component to display images with automatic caching
   - Error handling with fallback UI
   - Web and mobile compatible

3. **useImagePreload** ([src/hooks/useImagePreload.js](../src/hooks/useImagePreload.js))
   - Custom hook to preload images in background
   - Used in lists to improve performance

4. **CacheManagementScreen** ([src/screens/CacheManagementScreen.jsx](../src/screens/CacheManagementScreen.jsx))
   - User interface to manage cache
   - Shows statistics and allows clearing cache

## Features

### Automatic caching
- Images are automatically cached on first display
- No configuration or user action required

### Intelligent storage management
- Cache limit: **50 MB** by default
- Automatic cleanup when limit is reached
- LRU (Least Recently Used) strategy: removes oldest images

### Offline access
- Once cached, images are accessible without Internet connection
- Graceful fallback to original URL if cache fails

### Preloading
- Images are preloaded in background in lists
- Improves user experience with instant display

## Usage

### Display an image with cache

```jsx
import SafeImage from '../components/SafeImage';

<SafeImage
  source={{ uri: imageUrl }}
  style={{ width: 100, height: 150 }}
  resizeMode="cover"
  useCache={true} // Enable cache (true by default)
/>
```

### Preload images

```jsx
import { useImagePreload } from '../hooks/useImagePreload';

const MyComponent = ({ books }) => {
  // Preload all book covers
  const imageUrls = books.map(book => book.cover).filter(Boolean);
  useImagePreload(imageUrls);

  return (
    // ... render books
  );
};
```

### Use the service directly

```javascript
import imageCacheService from '../services/imageCacheService';

// Get an image (downloads and caches if necessary)
const localUri = await imageCacheService.getImage(imageUrl);

// Preload multiple images
await imageCacheService.preloadImages([url1, url2, url3]);

// Get cache statistics
const stats = await imageCacheService.getCacheStats();
console.log(`Cache: ${stats.sizeMB} MB, ${stats.itemCount} images`);

// Clear cache
await imageCacheService.clearCache();
```

## Configuration

### Modify maximum cache size

In [src/services/imageCacheService.js](../src/services/imageCacheService.js):

```javascript
const MAX_CACHE_SIZE_MB = 50; // Modify this value
```

### Disable cache for a specific image

```jsx
<SafeImage
  source={{ uri: imageUrl }}
  useCache={false} // Disable cache
/>
```

## Data Structure

### Cache index (AsyncStorage)
```json
{
  "image_key_hash": {
    "url": "https://example.com/image.jpg",
    "size": 45678,
    "cachedAt": 1732704000000,
    "lastAccess": 1732708000000
  }
}
```

### Cached files
- Location: `${FileSystem.cacheDirectory}images/`
- Format: `{cache_key}.jpg`
- Naming: Hash of source URL

## Performance

### Expected metrics
- **First load**: Normal network download time
- **Subsequent loads**: ~10-50ms (read from local filesystem)
- **Memory impact**: Minimal (AsyncStorage index ~1KB per image)
- **Storage impact**: Maximum 50 MB configurable

### Optimizations
- Images are preloaded in background (non-blocking)
- Web uses native browser HTTP cache
- Automatic cleanup to prevent saturation

## Compatibility

| Platform | Image Cache | Storage Limit |
|----------|-------------|---------------|
| iOS      | ✅ Yes      | 50 MB (configurable) |
| Android  | ✅ Yes      | 50 MB (configurable) |
| Web      | ⚠️ Native HTTP cache | Browser-managed |

**Note**: On web, the system uses native browser HTTP cache instead of filesystem.

## Maintenance

### Automatic cleanup
Cache automatically cleans up in the following cases:
- When size exceeds 50 MB (keeps 80% of limit)
- Removes least recently used images

### Manual cleanup
Users can manually clear cache via:
- Cache management screen (CacheManagementScreen)
- Or programmatically: `imageCacheService.clearCache()`

## Debugging

### Enable logs
Logs are automatically displayed in console during development:
```javascript
console.log('Image cached:', url);
console.warn('Failed to cache image:', error);
```

### Check cache state
```javascript
const stats = await imageCacheService.getCacheStats();
console.log('Cache stats:', stats);
```

### Inspect cached files
```javascript
import * as FileSystem from 'expo-file-system';

const cacheDir = `${FileSystem.cacheDirectory}images/`;
const files = await FileSystem.readDirectoryAsync(cacheDir);
console.log('Cached files:', files);
```

## Limitations

1. **Maximum size**: 50 MB by default (configurable)
2. **Supported formats**: All image formats supported by React Native
3. **Web**: Uses native HTTP cache (no granular control)
4. **Expiration**: No automatic expiration (LRU only)

## Future Improvements

- [ ] Image compression support (WebP)
- [ ] Time-based automatic expiration
- [ ] Cross-device synchronization
- [ ] Smart preloading based on user habits
- [ ] Support for different image sizes (thumbnails vs full)
