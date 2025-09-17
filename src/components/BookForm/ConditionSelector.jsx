import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import googleBooksService from '../../services/googleBooksService';
import BookFormSection from '../../components/BookForm/BookFormSection';
import FormInput from '../../components/BookForm/FormInput';
import ArrayInput from '../../components/BookForm/ArrayInput';
import EnrichmentModal from '../../components/BookForm/EnrichmentModal';
import ConditionSelector from '../../components/BookForm/ConditionSelector';
import SafeImage from '../../components/SafeImage';
import { COLORS, SPACING } from '../../constants';
import { globalStyles } from '../../styles/globalStyles';

const AddBookScreen = ({ navigation, route }) => {
  const { user, isLibrarian } = useAuth();
  const [book, setBook] = useState(getInitialBookState());
  const [isLoading, setIsLoading] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [showEnrichModal, setShowEnrichModal] = useState(false);
  const [enrichSuggestions, setEnrichSuggestions] = useState([]);

  const isEditMode = route?.params?.book;

  function getInitialBookState() {
    return {
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
    };
  }

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
    setBook(prev => ({ ...prev, [field]: value }));
  };

  const searchForEnrichment = async () => {
    if (!book.title.trim()) {
      Alert.alert('Titre requis', 'Veuillez saisir un titre pour rechercher des suggestions');
      return;
    }

    setIsEnriching(true);
    try {
      const query = `${book.title} ${book.authors.join(' ')}`.trim();
      const suggestions = await googleBooksService.searchBooks(query, 5);
      setEnrichSuggestions(suggestions);
      setShowEnrichModal(true);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de rechercher des suggestions');
    } finally {
      setIsEnriching(false);
    }
  };

  const applyEnrichment = (suggestion) => {
    Alert.alert(
      'Appliquer l\'enrichissement',
      `Voulez-vous enrichir votre livre avec les données de "${suggestion.title}" ?`,
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

      if (isEditMode) {
        await api.updateBook(route.params.book._id, bookData);
      } else {
        await api.addBook(bookData);
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

  return (
    <View style={globalStyles.container}>
      {/* Header */}
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
        {/* Informations principales */}
        <BookFormSection title="Informations principales" icon="📖">
          <FormInput
            label="Titre"
            value={book.title}
            onChangeText={(value) => updateField('title', value)}
            placeholder="Titre du livre"
            required
          />
          
          <FormInput
            label="Sous-titre"
            value={book.subtitle}
            onChangeText={(value) => updateField('subtitle', value)}
            placeholder="Sous-titre (optionnel)"
          />

          <ArrayInput
            label="Auteurs"
            items={book.authors}
            onItemsChange={(authors) => updateField('authors', authors)}
            placeholder="Nom de l'auteur"
            required
          />

          <FormInput
            label="Description"
            value={book.description}
            onChangeText={(value) => updateField('description', value)}
            placeholder="Description du livre"
            multiline
          />
        </BookFormSection>

        {/* Publication */}
        <BookFormSection title="Détails de publication" icon="📚">
          <FormInput
            label="Éditeur"
            value={book.publisher}
            onChangeText={(value) => updateField('publisher', value)}
            placeholder="Nom de l'éditeur"
          />
          
          <FormInput
            label="Date de publication"
            value={book.publishedDate}
            onChangeText={(value) => updateField('publishedDate', value)}
            placeholder="YYYY ou YYYY-MM-DD"
          />
          
          <FormInput
            label="Nombre de pages"
            value={book.pageCount}
            onChangeText={(value) => updateField('pageCount', value)}
            placeholder="Nombre de pages"
            keyboardType="numeric"
          />
          
          <FormInput
            label="Langue"
            value={book.language}
            onChangeText={(value) => updateField('language', value)}
            placeholder="Code langue (fr, en, etc.)"
          />
        </BookFormSection>

        {/* Catégories */}
        <BookFormSection title="Catégories et genre" icon="🏷️">
          <ArrayInput
            label="Catégories"
            items={book.categories}
            onItemsChange={(categories) => updateField('categories', categories)}
            placeholder="Nom de la catégorie"
          />
          
          <FormInput
            label="Genre principal"
            value={book.genre}
            onChangeText={(value) => updateField('genre', value)}
            placeholder="Genre principal"
          />
        </BookFormSection>

        {/* Couverture */}
        <BookFormSection title="Couverture" icon="🖼️">
          <FormInput
            label="URL de couverture"
            value={book.cover}
            onChangeText={(value) => updateField('cover', value)}
            placeholder="https://exemple.com/couverture.jpg"
          />
          {book.cover && book.cover.startsWith('http') && (
            <SafeImage 
              source={{ uri: book.cover }} 
              style={styles.coverPreview}
              onError={(error) => console.warn('Erreur image:', error)}
            />
          )}
        </BookFormSection>

        {/* Bibliothèque */}
        <BookFormSection title="Informations bibliothèque" icon="🏛️">
          <FormInput
            label="Localisation"
            value={book.location}
            onChangeText={(value) => updateField('location', value)}
            placeholder="Salle A, Étagère 3, etc."
            required
          />

          <ConditionSelector
            label="État"
            value={book.condition}
            onValueChange={(condition) => updateField('condition', condition)}
          />

          <FormInput
            label="Prix d'acquisition (€)"
            value={book.price}
            onChangeText={(value) => updateField('price', value)}
            placeholder="Prix en euros"
            keyboardType="decimal-pad"
          />

          <FormInput
            label="Notes"
            value={book.notes}
            onChangeText={(value) => updateField('notes', value)}
            placeholder="Notes internes sur le livre"
            multiline
          />
        </BookFormSection>

        {/* Save Button */}
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

      {/* Enrichment Modal */}
      <EnrichmentModal
        visible={showEnrichModal}
        onClose={() => setShowEnrichModal(false)}
        suggestions={enrichSuggestions}
        onSelectSuggestion={applyEnrichment}
      />
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
});

export default AddBookScreen;