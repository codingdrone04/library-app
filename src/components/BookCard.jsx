import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles, mixins } from '../styles/globalStyles';
import { COLORS, SPACING } from '../constants';

const BookCard = ({ 
  book, 
  onPress,
  variant = 'default', // 'default', 'horizontal', 'compact'
  showLocation = true,
  showStatus = true
}) => {
  // ✅ Extraction des données avec fallbacks (amélioré)
  const bookData = {
    title: book?.title || 'Titre non disponible',
    author: book?.authors?.[0] || book?.author || 'Auteur inconnu',
    cover: book?.cover || book?.googleBooks?.imageLinks?.thumbnail || null,
    status: book?.status || 'available',
    location: book?.library?.location || book?.location || null,
    genre: book?.genre || book?.categories?.[0] || null,
  };

  // ✅ Logique du badge de statut (centralisée)
  const getStatusInfo = (status) => {
    switch (status) {
      case 'available':
        return {
          color: COLORS.success,
          text: 'Disponible',
          icon: 'checkmark-circle'
        };
      case 'borrowed':
        return {
          color: COLORS.warning,
          text: 'Emprunté',
          icon: 'time'
        };
      case 'reserved':
        return {
          color: COLORS.info,
          text: 'Réservé',
          icon: 'bookmark'
        };
      case 'damaged':
        return {
          color: COLORS.error,
          text: 'Endommagé',
          icon: 'warning'
        };
      default:
        return {
          color: COLORS.success,
          text: 'Disponible',
          icon: 'checkmark-circle'
        };
    }
  };

  const statusInfo = getStatusInfo(bookData.status);

  // ✅ Rendu de l'image (amélioré)
  const renderCover = () => {
    const coverStyle = variant === 'compact' ? styles.compactCover :
                      variant === 'horizontal' ? styles.horizontalCover : 
                      styles.cover;

    if (bookData.cover) {
      return (
        <Image 
          source={{ uri: bookData.cover }} 
          style={coverStyle}
          resizeMode="cover"
        />
      );
    }
    
    return (
      <View style={[coverStyle, styles.placeholderCover]}>
        <Ionicons 
          name="book" 
          size={variant === 'compact' ? 20 : variant === 'horizontal' ? 24 : 30} 
          color={COLORS.textPrimary} 
        />
      </View>
    );
  };

  // ✅ Rendu du badge de statut
  const renderStatusBadge = () => {
    if (!showStatus) return null;

    return (
      <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
        <Ionicons name={statusInfo.icon} size={12} color={statusInfo.color} />
        <Text style={[styles.statusText, { color: statusInfo.color }]}>
          {statusInfo.text}
        </Text>
      </View>
    );
  };

  // ✅ NOUVELLES VARIANTES (en plus de votre variante par défaut)

  // Variante horizontale (pour les listes de résultats)
  if (variant === 'horizontal') {
    return (
      <TouchableOpacity onPress={() => onPress?.(book)} style={styles.horizontalCard}>
        {renderCover()}
        
        <View style={styles.horizontalTextContainer}>
          <Text style={styles.horizontalTitle} numberOfLines={2}>
            {bookData.title}
          </Text>
          <Text style={styles.horizontalAuthor} numberOfLines={1}>
            {bookData.author}
          </Text>
          
          {bookData.genre && (
            <Text style={styles.horizontalGenre} numberOfLines={1}>
              {bookData.genre}
            </Text>
          )}
          
          {renderStatusBadge()}
          
          {showLocation && bookData.location && (
            <Text style={styles.locationText}>📍 {bookData.location}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // Variante compacte (pour les grilles horizontales)
  if (variant === 'compact') {
    return (
      <TouchableOpacity onPress={() => onPress?.(book)} style={styles.compactCard}>
        {renderCover()}
        
        <View style={styles.compactTextContainer}>
          <Text style={styles.compactTitle} numberOfLines={2}>
            {bookData.title}
          </Text>
          <Text style={styles.compactAuthor} numberOfLines={1}>
            {bookData.author}
          </Text>
          
          {renderStatusBadge()}
          
          {showLocation && bookData.location && (
            <Text style={styles.locationText}>📍 {bookData.location}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // ✅ VARIANTE PAR DÉFAUT (votre code original amélioré)
  return (
    <TouchableOpacity onPress={() => onPress?.(book)} style={styles.card}>
      <View style={globalStyles.row}>
        {renderCover()}
        
        <View style={styles.textContainer}>
          <Text style={globalStyles.title}>{bookData.title}</Text>
          <Text style={globalStyles.subtitle}>{bookData.author}</Text>
          
          {bookData.genre && (
            <Text style={globalStyles.caption}>{bookData.genre}</Text>
          )}
          
          {renderStatusBadge()}
          
          {showLocation && bookData.location && (
            <Text style={styles.locationText}>📍 {bookData.location}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // ✅ Votre style existant (conservé)
  card: {
    ...mixins.card(true),
    marginHorizontal: SPACING.containerPadding,
  },
  
  cover: {
    width: 80,
    height: 100,
    borderRadius: 5,
    marginRight: SPACING.md,
  },
  
  textContainer: {
    flex: 1,
  },
  
  // ✅ NOUVEAUX STYLES pour les variantes

  // Variante horizontale
  horizontalCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.md,
    marginHorizontal: SPACING.containerPadding,
    marginBottom: SPACING.sm,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  horizontalCover: {
    width: 60,
    height: 80,
    borderRadius: SPACING.imageRadius,
    marginRight: SPACING.md,
  },
  horizontalTextContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  horizontalTitle: {
    ...globalStyles.title,
    fontSize: 16,
    marginBottom: SPACING.xs,
  },
  horizontalAuthor: {
    ...globalStyles.subtitle,
    fontSize: 14,
    marginBottom: SPACING.xs,
  },
  horizontalGenre: {
    ...globalStyles.caption,
    marginBottom: SPACING.sm,
  },

  // Variante compacte  
  compactCard: {
    width: 130,
    marginRight: SPACING.md,
  },
  compactCover: {
    width: 130,
    height: 170,
    borderRadius: SPACING.cardRadius,
    marginBottom: SPACING.sm,
  },
  compactTextContainer: {
    flex: 1,
  },
  compactTitle: {
    ...globalStyles.subtitle,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    lineHeight: 18,
  },
  compactAuthor: {
    ...globalStyles.caption,
    marginBottom: SPACING.sm,
  },

  // Styles communs
  placeholderCover: {
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  statusBadge: {
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.success,
    marginLeft: 4,
  },

  locationText: {
    ...globalStyles.caption,
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: SPACING.xs,
  },
});

export default BookCard;