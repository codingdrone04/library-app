import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles, mixins } from '../styles/globalStyles';
import { COLORS, SPACING } from '../constants';
import SafeImage from './SafeImage';
import { useImagePreload } from '../hooks/useImagePreload';

const BookCard = ({
  book,
  onPress,
  variant = 'default', // 'default', 'horizontal', 'compact'
  showLocation = true,
  showStatus = true
}) => {
  const bookData = {
    title: book?.title || 'Titre non disponible',
    author: book?.authors?.[0] || book?.author || 'Auteur inconnu',
    cover: book?.cover || book?.googleBooks?.imageLinks?.thumbnail || null,
    status: book?.status || 'available',
    location: book?.library?.location || book?.location || null,
    genre: book?.genre || book?.categories?.[0] || null,
  };

  // Précharge l'image en arrière-plan
  useImagePreload(bookData.cover);

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

  const renderCover = () => {
    const coverStyle = variant === 'compact' ? styles.compactCover :
                      variant === 'horizontal' ? styles.horizontalCover :
                      styles.cover;

    if (bookData.cover) {
      return (
        <SafeImage
          source={{ uri: bookData.cover }}
          style={coverStyle}
          resizeMode="cover"
          fallbackIcon="book"
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

  const renderStatusBadge = (iconOnly = false) => {
    if (!showStatus) return null;

    if (iconOnly) {
      return (
        <View style={styles.statusIconOnly}>
          <Ionicons name={statusInfo.icon} size={16} color={statusInfo.color} />
        </View>
      );
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
        <Ionicons name={statusInfo.icon} size={12} color={statusInfo.color} />
        <Text style={[styles.statusText, { color: statusInfo.color }]}>
          {statusInfo.text}
        </Text>
      </View>
    );
  };

  if (variant === 'horizontal') {
    return (
      <TouchableOpacity onPress={() => onPress?.(book)} style={styles.horizontalCard}>
        {renderCover()}

        <View style={styles.horizontalTextContainer}>
          <View style={styles.horizontalTopRow}>
            <View style={styles.horizontalTitleContainer}>
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
            </View>
            {renderStatusBadge()}
          </View>

          {showLocation && bookData.location && (
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={10} color={COLORS.textMuted} />
              <Text style={styles.locationText}>{bookData.location}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  if (variant === 'compact') {
    return (
      <TouchableOpacity onPress={() => onPress?.(book)} style={styles.compactCard}>
        {renderCover()}

        <View style={styles.compactTextContainer}>
          <View style={styles.compactTitleRow}>
            <Text style={styles.compactTitle} numberOfLines={2}>
              {bookData.title}
            </Text>
            {renderStatusBadge(true)}
          </View>
          <Text style={styles.compactAuthor} numberOfLines={1}>
            {bookData.author}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={() => onPress?.(book)} style={styles.card}>
      <View style={globalStyles.row}>
        {renderCover()}

        <View style={styles.textContainer}>
          <View>
            <Text style={globalStyles.title}>{bookData.title}</Text>
            <Text style={globalStyles.subtitle}>{bookData.author}</Text>

            {bookData.genre && (
              <Text style={globalStyles.caption}>{bookData.genre}</Text>
            )}
          </View>

          <View style={styles.defaultBottomInfo}>
            {renderStatusBadge()}

            {showLocation && bookData.location && (
              <View style={styles.locationContainer}>
                <Ionicons name="location" size={10} color={COLORS.textMuted} />
                <Text style={styles.locationText}>{bookData.location}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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
    justifyContent: 'space-between',
  },
  defaultBottomInfo: {
    flexDirection: 'column',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },

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
  horizontalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  horizontalTitleContainer: {
    flex: 1,
    marginRight: SPACING.sm,
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
    marginBottom: 0,
  },

  compactCard: {
    width: 130,
    marginRight: SPACING.md,
  },
  compactCoverContainer: {
    position: 'relative',
    marginBottom: SPACING.sm,
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
  compactTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  compactTitle: {
    ...globalStyles.subtitle,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    flex: 1,
    marginRight: SPACING.xs,
  },
  compactAuthor: {
    ...globalStyles.caption,
    marginBottom: 0,
  },

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
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.success,
    marginLeft: 4,
  },

  statusIconOnly: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    ...globalStyles.caption,
    fontSize: 10,
    fontStyle: 'italic',
  },
});

export default BookCard;