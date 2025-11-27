import React, { useState, useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import imageCacheService from '../services/imageCacheService';

const SafeImage = ({
  source,
  style,
  onError,
  fallbackIcon = 'image',
  fallbackText = '📖',
  resizeMode = 'cover',
  useCache = true,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cachedUri, setCachedUri] = useState(null);

  const handleError = (error) => {
    setHasError(true);
    setIsLoading(false);
    if (onError) onError(error);
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  // Charge l'image depuis le cache si disponible
  useEffect(() => {
    let isMounted = true;

    const loadCachedImage = async () => {
      if (!source?.uri || !useCache) {
        setCachedUri(source?.uri);
        return;
      }

      try {
        const cached = await imageCacheService.getImage(source.uri);
        if (isMounted) {
          setCachedUri(cached);
        }
      } catch (error) {
        console.warn('Error loading cached image:', error);
        if (isMounted) {
          setCachedUri(source?.uri);
        }
      }
    };

    loadCachedImage();

    return () => {
      isMounted = false;
    };
  }, [source?.uri, useCache]);

  // Fallback component pour les erreurs
  const FallbackComponent = () => (
    <View style={[
      style,
      {
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: style?.borderRadius || 8,
      }
    ]}>
      <Ionicons name={fallbackIcon} size={30} color={COLORS.textMuted} />
      <Text style={{ color: COLORS.textMuted, fontSize: 10, marginTop: 4 }}>
        Image non disponible
      </Text>
    </View>
  );

  // Si pas d'URL ou erreur, afficher fallback
  if (!source?.uri || hasError) {
    return <FallbackComponent />;
  }

  // Attend que l'image soit chargée depuis le cache
  if (!cachedUri) {
    return <FallbackComponent />;
  }

  if (Platform.OS === 'web') {
    // Version Web - utiliser une approche React Native Web compatible
    const WebImageComponent = () => (
      <View style={[style, { overflow: 'hidden' }]}>
        <img
          src={cachedUri}
          style={{
            width: '100%',
            height: '100%',
            objectFit: resizeMode === 'cover' ? 'cover' : 
                      resizeMode === 'contain' ? 'contain' : 'cover',
            borderRadius: style?.borderRadius || 0,
          }}
          onError={handleError}
          onLoad={handleLoad}
          alt=""
        />
      </View>
    );
    
    return <WebImageComponent />;
  } else {
    // Version Mobile avec Image React Native
    const { Image } = require('react-native');

    return (
      <Image
        source={{ uri: cachedUri }}
        style={style}
        resizeMode={resizeMode}
        onError={handleError}
        onLoad={handleLoad}
        {...props}
      />
    );
  }
};

export default SafeImage;