import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import googleBooksService from '../services/googleBooksService';
import SafeImage from '../components/SafeImage';
import { COLORS, SPACING } from '../constants';
import { globalStyles } from '../styles/globalStyles';

const EditBookScreen = ({ navigation, route }) => {
  const { book: initialBook } = route.params;
  const { user, isLibrarian } = useAuth();
  const [book, setBook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showEnrichModal, setShowEnrichModal] = useState(false);
  const [enrichSuggestions, setEnrichSuggestions] = useState([]);
  const [selectedField, setSelectedField] = useState('');
  const [isEnriching, setIsEnriching] = useState(false);

  useEffect(() => {
    if (!isLibrarian()) {
      Alert.alert('Accès refusé', 'Seuls les bibliothécaires peuvent modifier les livres');
      navigation.goBack();
      return;
    }

    loadBookDetails();
  }, []);

  const loadBookDetails = async () => {
    try {
      const bookData = await api.getBookById(initialBook._id || initialBook.id);
      setBook(bookData.book || bookData);
    } catch (error) {
      console.error('Erreur chargement livre:', error);
      setBook(initialBook);
    } finally {
      setIsLoading(false);
    }
  };

  const enrichField = async (field) => {
    if (!book?.title) {
      Alert.alert('Erreur', 'Le livre doit avoir un titre pour l\'enrichissement');
      return;
    }

    setIsEnriching(true);
    setSelectedField(field);

    try {
      const query = `${book.title} ${book.authors?.join(' ') || ''}`.trim();
      const suggestions = await googleBooksService.searchBooks(query, 5);
      setEnrichSuggestions(suggestions);
      setShowEnrichModal(true);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de rechercher des suggestions d\'enrichissement');
    } finally {
      setIsEnriching(false);
    }
  };

  const applyFieldEnrichment = (suggestion) => {
    const enrichmentData = {};

    switch (selectedField) {
      case 'description':
        enrichmentData.description = suggestion.description;
        break;
      case 'cover':
        enrichmentData.cover = suggestion.cover;
        break;
      case 'publisher':
        enrichmentData.publisher = suggestion.publisher;
        enrichmentData.publishedDate = suggestion.publishedDate;
        enrichmentData.pageCount = suggestion.pageCount;
        break;
      case 'categories':
        enrichmentData.categories = suggestion.categories;
        enrichmentData.genre = suggestion.genre;
        break;
      case 'identifiers':
        enrichmentData.identifiers = suggestion.identifiers;
        break;
      case 'all':
        Object.assign(enrichmentData, {
          subtitle: suggestion.subtitle,
          description: suggestion.description,
          publisher: suggestion.publisher,
          publishedDate: suggestion.publishedDate,
          pageCount: suggestion.pageCount,
          cover: suggestion.cover,
          categories: suggestion.categories,
          genre: suggestion.genre,
          identifiers: suggestion.identifiers,
          language: suggestion.language
        });
        break;
    }

    Alert.alert(
      'Appliquer l\'enrichissement',
      `Voulez-vous enrichir le champ "${getFieldLabel(selectedField)}" avec les données de "${suggestion.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Appliquer',
          onPress: () => {
            setBook(prev => ({
              ...prev,
              ...enrichmentData
            }));
            setShowEnrichModal(false);
            Alert.alert('Succès', `Champ "${getFieldLabel(selectedField)}" enrichi !`);
          }
        }
      ]
    );
  };

  const getFieldLabel = (field) => {
    const labels = {
      description: 'Description',
      cover: 'Couverture',
      publisher: 'Publication',
      categories: 'Catégories',
      identifiers: 'Identifiants',
      all: 'Tous les champs'
    };
    return labels[field] || field;
  };

  const saveChanges = async () => {
    setIsSaving(true);
    try {
      const updateData = {
        title: book.title,
        subtitle: book.subtitle,
        authors: book.authors,
        description: book.description,
        publisher: book.publisher,
        publishedDate: book.publishedDate,
        pageCount: book.pageCount,
        cover: book.cover,
        categories: book.categories,
        genre: book.genre,
        language: book.language,
        identifiers: book.identifiers,
        'library.location': book.library?.location,
        'library.condition': book.library?.condition,
        'library.price': book.library?.price,
        'library.notes': book.library?.notes
      };

      await api.updateBook(book._id, updateData);
      
      Alert.alert(
        'Succès',
        'Livre modifié avec succès !',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder les modifications');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteBook = () => {
    Alert.alert(
      'Supprimer le livre',
      `Êtes-vous sûr de vouloir supprimer "${book.title}" ?\n\nCette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteBook(book._id);
              Alert.alert(
                'Supprimé',
                'Le livre a été supprimé avec succès',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (error) {
              Alert.alert('Erreur', error.message || 'Impossible de supprimer le livre');
            }
          }
        }
      ]
    );
  };

  const renderFieldEditor = (field, label, value, multiline = false) => (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TouchableOpacity
          onPress={() => enrichField(field)}
          style={styles.enrichFieldButton}
          disabled={isEnriching}
        >
          {isEnriching && selectedField === field ? (
            <ActivityIndicator size="small" color={COLORS.accent} />
          ) : (
            <Ionicons name="cloud-download" size={16} color={COLORS.accent} />
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.fieldContent}>
        <Text style={[styles.fieldValue, multiline && styles.fieldValueMultiline]}>
          {value || 'Non défini'}
        </Text>
      </View>
    </View>
  );

  const renderArrayField = (field, label, array) => (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TouchableOpacity
          onPress={() => enrichField(field)}
          style={styles.enrichFieldButton}
        >
          <Ionicons name="cloud-download" size={16} color={COLORS.accent} />
        </TouchableOpacity>
      </View>
      <View style={styles.arrayContainer}>
        {array && array.length > 0 ? (
          array.map((item, index) => (
            <View key={index} style={styles.arrayItem}>
              <Text style={styles.arrayItemText}>
                {typeof item === 'object' ? `${item.type}: ${item.identifier}` : item}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Aucun élément</Text>
        )}
      </View>
    </View>
  );

  const renderSuggestion = ({ item }) => (
    <TouchableOpacity
      style={styles.suggestionCard}
      onPress={() => applyFieldEnrichment(item)}
    >
      <View style={styles.suggestionContent}>
        <View style={styles.suggestionText}>
          <Text style={styles.suggestionTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.suggestionAuthor} numberOfLines={1}>
            {item.authors?.join(', ') || 'Auteur inconnu'}
          </Text>
          {item.publisher && (
            <Text style={styles.suggestionPublisher} numberOfLines={1}>
              {item.publisher} • {item.publishedDate}
            </Text>
          )}
          <Text style={styles.suggestionPreview}>
            {selectedField === 'description' && item.description ? 
              item.description.substring(0, 100) + '...' : 
              `Enrichir "${getFieldLabel(selectedField)}"`
            }
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={[globalStyles.container, globalStyles.centerContainer]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={globalStyles.body}>Chargement...</Text>
      </View>
    );
  }

  if (!book) {
    return (
      <View style={[globalStyles.container, globalStyles.centerContainer]}>
        <Ionicons name="book-outline" size={80} color={COLORS.textMuted} />
        <Text style={globalStyles.title}>Livre non trouvé</Text>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={globalStyles.pageTitle}>Modifier le livre</Text>
        <TouchableOpacity
          onPress={() => enrichField('all')}
          style={styles.enrichAllButton}
        >
          <Ionicons name="cloud-download" size={20} color={COLORS.accent} />
          <Text style={styles.enrichAllText}>Tout enrichir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📖 Informations principales</Text>
          
          {renderFieldEditor('title', 'Titre', book.title)}
          {renderFieldEditor('subtitle', 'Sous-titre', book.subtitle)}
          {renderArrayField('authors', 'Auteurs', book.authors)}
          {renderFieldEditor('description', 'Description', book.description, true)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📚 Publication</Text>
          
          {renderFieldEditor('publisher', 'Éditeur', book.publisher)}
          {renderFieldEditor('publishedDate', 'Date de publication', book.publishedDate)}
          {renderFieldEditor('pageCount', 'Nombre de pages', book.pageCount?.toString())}
          {renderFieldEditor('language', 'Langue', book.language)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏷️ Catégories</Text>
          
          {renderArrayField('categories', 'Catégories', book.categories)}
          {renderFieldEditor('genre', 'Genre principal', book.genre)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔢 Identifiants & Média</Text>
          
          {renderArrayField('identifiers', 'ISBN/Identifiants', book.identifiers)}
          {renderFieldEditor('cover', 'URL de couverture', book.cover)}
          
          {book.cover && (
            <View style={styles.coverPreviewContainer}>
              <Text style={styles.fieldLabel}>Aperçu de la couverture</Text>
              <SafeImage 
                source={{ uri: book.cover }} 
                style={styles.coverPreview}
                onError={(error) => {
                  console.warn('Erreur chargement image:', error);
                }}
              />
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏛️ Bibliothèque</Text>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Localisation</Text>
            <Text style={styles.fieldValue}>{book.library?.location || 'Non définie'}</Text>
          </View>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>État</Text>
            <Text style={styles.fieldValue}>
              {book.library?.condition === 'excellent' ? 'Excellent' :
               book.library?.condition === 'good' ? 'Bon' :
               book.library?.condition === 'fair' ? 'Correct' :
               book.library?.condition === 'poor' ? 'Mauvais' :
               book.library?.condition === 'damaged' ? 'Endommagé' : 'Non défini'}
            </Text>
          </View>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Prix d'acquisition</Text>
            <Text style={styles.fieldValue}>
              {book.library?.price ? `${book.library.price} €` : 'Non défini'}
            </Text>
          </View>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Notes</Text>
            <Text style={[styles.fieldValue, styles.fieldValueMultiline]}>
              {book.library?.notes || 'Aucune note'}
            </Text>
          </View>
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.editFullButton}
            onPress={() => navigation.navigate('AddBookScreen', { book })}
          >
            <Ionicons name="create" size={20} color={COLORS.textPrimary} />
            <Text style={styles.editFullButtonText}>Modification complète</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={saveChanges}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color={COLORS.textPrimary} />
            ) : (
              <>
                <Ionicons name="save" size={20} color={COLORS.textPrimary} />
                <Text style={styles.saveButtonText}>Sauvegarder</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={deleteBook}>
            <Ionicons name="trash" size={20} color={COLORS.error} />
            <Text style={styles.deleteButtonText}>Supprimer le livre</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showEnrichModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Enrichir: {getFieldLabel(selectedField)}
            </Text>
            <TouchableOpacity onPress={() => setShowEnrichModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={enrichSuggestions}
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
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: SPACING.xxxl,
    paddingBottom: SPACING.lg,
  },
  enrichAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent + '20',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  enrichAllText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: SPACING.containerPadding,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
    paddingBottom: SPACING.sm,
  },
  fieldContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  fieldLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  enrichFieldButton: {
    backgroundColor: COLORS.accent + '20',
    borderRadius: 15,
    padding: SPACING.xs,
  },
  fieldContent: {
    minHeight: 40,
    justifyContent: 'center',
  },
  fieldValue: {
    color: COLORS.textPrimary,
    fontSize: 16,
    lineHeight: 22,
  },
  fieldValueMultiline: {
    textAlign: 'justify',
  },
  arrayContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  arrayItem: {
    backgroundColor: COLORS.primary + '20',
    borderRadius: 15,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  arrayItemText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '500',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontStyle: 'italic',
  },
  coverPreviewContainer: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  coverPreview: {
    width: 120,
    height: 160,
    borderRadius: SPACING.cardRadius,
    marginTop: SPACING.sm,
  },
  actionsSection: {
    marginVertical: SPACING.xl,
    gap: SPACING.md,
  },
  editFullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.info,
    borderRadius: SPACING.borderRadius,
    height: SPACING.buttonHeight,
  },
  editFullButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    borderRadius: SPACING.borderRadius,
    height: SPACING.buttonHeight,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error + '20',
    borderRadius: SPACING.borderRadius,
    height: SPACING.buttonHeight,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  deleteButtonText: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: SPACING.xxxl,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  modalTitle: {
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
    marginBottom: SPACING.sm,
  },
  suggestionPreview: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  noSuggestionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  noSuggestionsText: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
});

export default EditBookScreen;