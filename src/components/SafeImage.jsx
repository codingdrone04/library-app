import React, { useState } from 'react';
import { View, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

const SafeImage = ({ 
  source, 
  style, 
  onError, 
  fallbackIcon = 'image',
  fallbackText = '📖',
  resizeMode = 'cover',
  ...props 
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = (error) => {
    setHasError(true);
    setIsLoading(false);
    if (onError) onError(error);
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

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

  if (Platform.OS === 'web') {
    // Version Web - utiliser une approche React Native Web compatible
    const WebImageComponent = () => (
      <View style={[style, { overflow: 'hidden' }]}>
        <img
          src={source.uri}
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
        source={source}
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