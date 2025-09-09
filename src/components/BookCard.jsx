import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles, mixins } from '../../styles/globalStyles';
import { COLORS, SPACING } from '../../constants';

const BookCard = ({ book, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.card}>
      <View style={globalStyles.row}>
        {/* Cover */}
        <Image source={{ uri: book.cover }} style={styles.cover} />
        
        {/* Content */}
        <View style={styles.textContainer}>
          <Text style={globalStyles.title}>{book.title}</Text>
          <Text style={globalStyles.subtitle}>{book.author}</Text>
          <Text style={globalStyles.caption}>{book.genre}</Text>
          
          {/* Status Badge */}
          <View style={[styles.statusBadge, globalStyles.rowCenter]}>
            <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />
            <Text style={styles.statusText}>Disponible</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Utilise votre mixin card
  card: {
    ...mixins.card(true), // true = elevated
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
  
  statusBadge: {
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
  },
  
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.success,
    marginLeft: 4,
  }
});

export default BookCard;