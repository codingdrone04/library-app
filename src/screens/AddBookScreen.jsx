import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
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

const AddBookScreen = ({ navigation, route }) => {
  const { user, isLibrarian } = useAuth();
  const [book, setBook] = useState({
    title: '',
    subtitle: '',
    authors: [],
    description: '',
    publisher: '',
    publishedDate: '',
    pageCount: '',
    cover: '',
    categories: [],
    genre: '',
    language: 'fr',
    location: '',
    condition: 'good',
    price: '',
    notes: '',
    identifiers: []
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [showEnrichModal, setShowEnrichModal] = useState(false);
  const [enrichSuggestions, setEnrichSuggestions] = useState([]);
  const [currentAuthor, setCurrentAuthor] = useState('');
  const [currentCategory, setCurrentCategory] = useState('');
  const [currentISBN, setCurrentISBN] = useState('');

  const isEditMode = route?.params?.book;

  useEffect(() => {
    if (!isLibrarian()) {
      Alert.alert('Accès refusé', 'Seuls les bibliothécaires peuvent ajouter des livres');
      navigation.goBack();
      return;
    }

    if (isEditMode) {
      loadBookData();
    }
  }, []);

  const loadBookData = () => {
    const bookData = route.params.book;
    setBook({
      title: bookData.title || '',
      subtitle: bookData.subtitle || '',
      authors: bookData.authors || [],
      description: bookData.description || '',
      publisher: bookData.publisher || '',
      publishedDate: bookData.publishedDate || '',
      pageCount: bookData.pageCount ? bookData.pageCount.toString() : '',
      cover: bookData.cover || '',
      categories: bookData.categories || [],
      genre: bookData.genre || '',
      language: bookData.language || 'fr',
      location: bookData.library?.location || '',
      condition: bookData.library?.condition || 'good',
      price: bookData.library?.price ? bookData.library.price.toString() : '',
      notes: bookData.library?.notes || '',
      identifiers: bookData.identifiers || []
    });
  };

  const updateField = (field, value) => {
    setBook(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addAuthor = () => {
    if (currentAuthor.trim()) {
      setBook(prev => ({
        ...prev,
        authors: [...prev.authors, currentAuthor.trim()]
      }));
      setCurrentAuthor('');
    }
  };

  const removeAuthor = (index) => {
    setBook(prev => ({
      ...prev,
      authors: prev.authors.filter((_, i) => i !== index)
    }));
  };

  const addCategory = () => {
    if (currentCategory.trim() && !book.categories.includes(currentCategory.trim())) {
      setBook(prev => ({
        ...prev,
        categories: [...prev.categories, currentCategory.trim()]
      }));
      setCurrentCategory('');
    }
  };

  const removeCategory = (index) => {
    setBook(prev => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== index)
    }));
  };

  const addISBN = () => {
    if (currentISBN.trim()) {
      const type = currentISBN.length === 10 ? 'ISBN_10' : 'ISBN_13';
      setBook(prev => ({
        ...prev,
        identifiers: [...prev.identifiers, { type, identifier: currentISBN.trim() }]
      }));
      setCurrentISBN('');
    }
  };

  const removeISBN = (index) => {
    setBook(prev => ({
      ...prev,
      identifiers: prev.identifiers.filter((_, i) => i !== index)
    }));
  };

  const searchForEnrichment = async () => {
    if (!book.title.trim()) {
      Alert.alert('Titre requis', 'Veuillez saisir un titre pour rechercher des suggestions d\'enrichissement');
      return;
    }

    setIsEnriching(true);
    try {
      const query = `${book.title} ${book.authors.join(' ')}`.trim();
      const suggestions = await googleBooksService.searchBooks(query, 5);
      setEnrichSuggestions(suggestions);
      setShowEnrichModal(true);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de rechercher des suggestions d\'enrichissement');
    } finally {
      setIsEnriching(false);
    }
  };

  const applyEnrichment = (suggestion) => {
    Alert.alert(
      'Appliquer l\'enrichissement',
      `Voulez-vous enrichir votre livre avec les données de "${suggestion.title}" ?\n\nCela remplacera les champs existants.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Enrichir',
          onPress: () => {
            setBook(prev => ({
              ...prev,
              title: suggestion.title || prev.title,
              subtitle: suggestion.subtitle || prev.subtitle,
              authors: suggestion.authors?.length > 0 ? suggestion.authors : prev.authors,
              description: suggestion.description || prev.description,
              publisher: suggestion.publisher || prev.publisher,
              publishedDate: suggestion.publishedDate || prev.publishedDate,
              pageCount: suggestion.pageCount ? suggestion.pageCount.toString() : prev.pageCount,
              cover: suggestion.cover || prev.cover,
              categories: suggestion.categories?.length > 0 ? suggestion.categories : prev.categories,
              genre: suggestion.genre || prev.genre,
              language: suggestion.language || prev.language,
              identifiers: suggestion.identifiers?.length > 0 ? suggestion.identifiers : prev.identifiers
            }));
            setShowEnrichModal(false);
            Alert.alert('Succès', 'Livre enrichi avec les données Google Books !');
          }
        }
      ]
    );
  };

  const validateForm = () => {
    if (!book.title.trim()) {
      Alert.alert('Erreur', 'Le titre est requis');
      return false;
    }

    if (book.authors.length === 0) {
      Alert.alert('Erreur', 'Au moins un auteur est requis');
      return false;
    }

    if (!book.location.trim()) {
      Alert.alert('Erreur', 'La localisation est requise');
      return false;
    }

    return true;
  };

  const saveBook = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const bookData = {
        title: book.title.trim(),
        subtitle: book.subtitle.trim(),
        authors: book.authors,
        description: book.description.trim(),
        publisher: book.publisher.trim(),
        publishedDate: book.publishedDate.trim(),
        pageCount: book.pageCount ? parseInt(book.pageCount) : null,
        cover: book.cover.trim(),
        categories: book.categories,
        genre: book.genre.trim(),
        language: book.language,
        location: book.location.trim(),
        condition: book.condition,
        price: book.price ? parseFloat(book.price) : null,
        notes: book.notes.trim(),
        identifiers: book.identifiers,
        librarian: user.username
      };

      let response;
      if (isEditMode) {
        response = await api.updateBook(route.params.book._id, bookData);
      } else {
        response = await api.addBook(bookData);
      }

      Alert.alert(
        'Succès',
        `Livre ${isEditMode ? 'modifié' : 'ajouté'} avec succès !`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );

    } catch (error) {
      Alert.alert('Erreur', error.message || `Impossible de ${isEditMode ? 'modifier' : 'ajouter'} le livre`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderEnrichSuggestion = ({ item }) => (
    <TouchableOpacity
      style={styles.suggestionCard}
      onPress={() => applyEnrichment(item)}
    >
      <View style={styles.suggestionContent}>
        {item.cover && item.cover.startsWith('http') && (
          <SafeImage 
            source={{ uri: item.cover }} 
            style={styles.suggestionCover}
            onError={(error) => console.warn('Erreur suggestion image:', error)}
          />
        )}
        <View style={styles.suggestionText}>
          <Text style={styles.suggestionTitle} numberOfLines={2}>{item.title}</Text>
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
    <View style={globalStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={globalStyles.pageTitle}>
          {isEditMode ? 'Modifier le livre' : 'Ajouter un livre'}
        </Text>
        <TouchableOpacity
          onPress={searchForEnrichment}
          disabled={isEnriching}
          style={[styles.enrichButton, isEnriching && styles.enrichButtonDisabled]}
        >
          {isEnriching ? (
            <ActivityIndicator size="small" color={COLORS.accent} />
          ) : (
            <Ionicons name="cloud-download" size={24} color={COLORS.accent} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📖 Informations principales</Text>
          
          <Text style={styles.fieldLabel}>Titre *</Text>
          <TextInput
            style={styles.input}
            value={book.title}
            onChangeText={(value) => updateField('title', value)}
            placeholder="Titre du livre"
            placeholderTextColor={COLORS.textPlaceholder}
            editable={true}
            multiline={false}
          />

          <Text style={styles.fieldLabel}>Sous-titre</Text>
          <TextInput
            style={styles.input}
            value={book.subtitle}
            onChangeText={(value) => updateField('subtitle', value)}
            placeholder="Sous-titre (optionnel)"
            placeholderTextColor={COLORS.textPlaceholder}
            editable={true}
            multiline={false}
          />

          <Text style={styles.fieldLabel}>Auteurs *</Text>
          <View style={styles.arrayInputContainer}>
            <TextInput
              style={[styles.input, styles.arrayInput]}
              value={currentAuthor}
              onChangeText={setCurrentAuthor}
              placeholder="Nom de l'auteur"
              placeholderTextColor={COLORS.textPlaceholder}
              onSubmitEditing={addAuthor}
              editable={true}
            />
            <TouchableOpacity onPress={addAuthor} style={styles.addButton}>
              <Ionicons name="add" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          {book.authors.map((author, index) => (
            <View key={index} style={styles.tagContainer}>
              <Text style={styles.tagText}>{author}</Text>
              <TouchableOpacity onPress={() => removeAuthor(index)}>
                <Ionicons name="close" size={16} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ))}

          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={book.description}
            onChangeText={(value) => updateField('description', value)}
            placeholder="Description du livre"
            placeholderTextColor={COLORS.textPlaceholder}
            multiline={true}
            numberOfLines={4}
            editable={true}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📚 Détails de publication</Text>
          
          <Text style={styles.fieldLabel}>Éditeur</Text>
          <TextInput
            style={styles.input}
            value={book.publisher}
            onChangeText={(value) => updateField('publisher', value)}
            placeholder="Nom de l'éditeur"
            placeholderTextColor={COLORS.textPlaceholder}
            editable={true}
          />

          <Text style={styles.fieldLabel}>Date de publication</Text>
          <TextInput
            style={styles.input}
            value={book.publishedDate}
            onChangeText={(value) => updateField('publishedDate', value)}
            placeholder="YYYY ou YYYY-MM-DD"
            placeholderTextColor={COLORS.textPlaceholder}
            editable={true}
          />

          <Text style={styles.fieldLabel}>Nombre de pages</Text>
          <TextInput
            style={styles.input}
            value={book.pageCount}
            onChangeText={(value) => updateField('pageCount', value)}
            placeholder="Nombre de pages"
            placeholderTextColor={COLORS.textPlaceholder}
            keyboardType="numeric"
            editable={true}
          />

          <Text style={styles.fieldLabel}>Langue</Text>
          <TextInput
            style={styles.input}
            value={book.language}
            onChangeText={(value) => updateField('language', value)}
            placeholder="Code langue (fr, en, etc.)"
            placeholderTextColor={COLORS.textPlaceholder}
            editable={true}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏷️ Catégories et genre</Text>
          
          <Text style={styles.fieldLabel}>Catégories</Text>
          <View style={styles.arrayInputContainer}>
            <TextInput
              style={[styles.input, styles.arrayInput]}
              value={currentCategory}
              onChangeText={setCurrentCategory}
              placeholder="Nom de la catégorie"
              placeholderTextColor={COLORS.textPlaceholder}
              onSubmitEditing={addCategory}
              editable={true}
            />
            <TouchableOpacity onPress={addCategory} style={styles.addButton}>
              <Ionicons name="add" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          {book.categories.map((category, index) => (
            <View key={index} style={styles.tagContainer}>
              <Text style={styles.tagText}>{category}</Text>
              <TouchableOpacity onPress={() => removeCategory(index)}>
                <Ionicons name="close" size={16} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ))}

          <Text style={styles.fieldLabel}>Genre principal</Text>
          <TextInput
            style={styles.input}
            value={book.genre}
            onChangeText={(value) => updateField('genre', value)}
            placeholder="Genre principal"
            placeholderTextColor={COLORS.textPlaceholder}
            editable={true}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔢 Identifiants</Text>
          
          <Text style={styles.fieldLabel}>ISBN</Text>
          <View style={styles.arrayInputContainer}>
            <TextInput
              style={[styles.input, styles.arrayInput]}
              value={currentISBN}
              onChangeText={setCurrentISBN}
              placeholder="ISBN-10 ou ISBN-13"
              placeholderTextColor={COLORS.textPlaceholder}
              onSubmitEditing={addISBN}
              editable={true}
            />
            <TouchableOpacity onPress={addISBN} style={styles.addButton}>
              <Ionicons name="add" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          {book.identifiers.map((isbn, index) => (
            <View key={index} style={styles.tagContainer}>
              <Text style={styles.tagText}>{isbn.type}: {isbn.identifier}</Text>
              <TouchableOpacity onPress={() => removeISBN(index)}>
                <Ionicons name="close" size={16} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ))}

          <Text style={styles.fieldLabel}>URL de couverture</Text>
          <TextInput
            style={styles.input}
            value={book.cover}
            onChangeText={(value) => updateField('cover', value)}
            placeholder="https://exemple.com/couverture.jpg"
            placeholderTextColor={COLORS.textPlaceholder}
            editable={true}
          />
          {book.cover && book.cover.startsWith('http') && (
            <SafeImage 
              source={{ uri: book.cover }} 
              style={styles.coverPreview}
              onError={(error) => {
                console.warn('Erreur chargement image:', error);
                Alert.alert('Erreur', 'Impossible de charger l\'image de couverture');
              }}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏛️ Informations bibliothèque</Text>
          
          <Text style={styles.fieldLabel}>Localisation *</Text>
          <TextInput
            style={styles.input}
            value={book.location}
            onChangeText={(value) => updateField('location', value)}
            placeholder="Salle A, Étagère 3, etc."
            placeholderTextColor={COLORS.textPlaceholder}
            editable={true}
          />

          <Text style={styles.fieldLabel}>État</Text>
          <View style={styles.conditionContainer}>
            {['excellent', 'good', 'fair', 'poor', 'damaged'].map((condition) => (
              <TouchableOpacity
                key={condition}
                style={[
                  styles.conditionButton,
                  book.condition === condition && styles.conditionButtonActive
                ]}
                onPress={() => updateField('condition', condition)}
              >
                <Text style={[
                  styles.conditionText,
                  book.condition === condition && styles.conditionTextActive
                ]}>
                  {condition === 'excellent' ? 'Excellent' :
                   condition === 'good' ? 'Bon' :
                   condition === 'fair' ? 'Correct' :
                   condition === 'poor' ? 'Mauvais' : 'Endommagé'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Prix d'acquisition (€)</Text>
          <TextInput
            style={styles.input}
            value={book.price}
            onChangeText={(value) => updateField('price', value)}
            placeholder="Prix en euros"
            placeholderTextColor={COLORS.textPlaceholder}
            keyboardType="decimal-pad"
            editable={true}
          />

          <Text style={styles.fieldLabel}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={book.notes}
            onChangeText={(value) => updateField('notes', value)}
            placeholder="Notes internes sur le livre"
            placeholderTextColor={COLORS.textPlaceholder}
            multiline={true}
            numberOfLines={3}
            editable={true}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={saveBook}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.textPrimary} />
          ) : (
            <Text style={styles.saveButtonText}>
              {isEditMode ? 'Modifier le livre' : 'Ajouter le livre'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showEnrichModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Suggestions d'enrichissement</Text>
            <TouchableOpacity onPress={() => setShowEnrichModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={enrichSuggestions}
            renderItem={renderEnrichSuggestion}
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
  enrichButton: {
    padding: SPACING.sm,
    backgroundColor: COLORS.accent + '20',
    borderRadius: 20,
  },
  enrichButtonDisabled: {
    opacity: 0.6,
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
  fieldLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: 16,
    marginBottom: SPACING.sm,
    minHeight: 50,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  arrayInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrayInput: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  addButton: {
    backgroundColor: COLORS.primary + '20',
    borderRadius: 20,
    padding: SPACING.sm,
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary + '20',
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  tagText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  conditionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  conditionButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  conditionButtonActive: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  conditionText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  conditionTextActive: {
    color: COLORS.primary,
  },
  coverPreview: {
    width: 120,
    height: 160,
    borderRadius: SPACING.cardRadius,
    marginTop: SPACING.sm,
    alignSelf: 'center',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SPACING.borderRadius,
    height: SPACING.buttonHeight,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
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

export default AddBookScreen;