import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SafeImage from '../SafeImage';
import { COLORS, SPACING } from '../../constants';

const EnrichmentModal = ({ 
  visible, 
  onClose, 
  suggestions, 
  onSelectSuggestion 
}) => {
  const renderSuggestion = ({ item }) => (
    <TouchableOpacity
      style={styles.suggestionCard}
      onPress={() => onSelectSuggestion(item)}
    >
      <View style={styles.suggestionContent}>
        {item.cover && (
          <SafeImage 
            source={{ uri: item.cover }} 
            style={styles.suggestionCover}
          />
        )}
        <View style={styles.suggestionText}>
          <Text style={styles.suggestionTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.suggestionAuthor} numberOfLines={1}>
            {item.authors?.join(', ') || 'Auteur inconnu'}
          </Text>
          {item.publisher && (
            <Text style={styles.suggestionPublisher} numberOfLines={1}>
              {item.publisher}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Suggestions d'enrichissement</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={suggestions}
          renderItem={renderSuggestion}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.suggestionsContainer}
          ListEmptyComponent={
            <View style={styles.noSuggestionsContainer}>
              <Ionicons name="search" size={60} color={COLORS.textMuted} />
              <Text style={styles.noSuggestionsText}>
                Aucune suggestion trouvée
              </Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: SPACING.xxxl,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  suggestionsContainer: {
    padding: SPACING.containerPadding,
  },
  suggestionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  suggestionCover: {
    width: 60,
    height: 80,
    borderRadius: SPACING.cardRadius,
    marginRight: SPACING.md,
  },
  suggestionText: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  suggestionAuthor: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  suggestionPublisher: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  noSuggestionsContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  noSuggestionsText: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
});

export default EnrichmentModal;