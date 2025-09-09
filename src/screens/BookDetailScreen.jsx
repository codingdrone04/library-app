import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  FlatList,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import bookService from '../services/bookService';
import googleBooksService from '../services/googleBooksService';
import { COLORS, SPACING, ROUTES } from '../constants';
import { globalStyles } from '../styles/globalStyles';

const BookDetailScreen = ({ route, navigation }) => {
  const { book: initialBook, bookId } = route.params;
  const { user, isLibrarian } = useAuth();
  const [book, setBook] = useState(initialBook);
  const [loading, setLoading] = useState(!initialBook);
  const [recommendedBooks, setRecommendedBooks] = useState([]);
  const [isBorrowing, setIsBorrowing] = useState(false);
  const [isReturning, setIsReturning] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerStyle: {
        backgroundColor: COLORS.background,
      },
      headerTintColor: COLORS.textPrimary,
      headerTitle: '',
      headerBackTitleVisible: false,
    });

    if (!book && bookId) {
      loadBookDetails();
    } else if (book) {
      loadRecommendations();
    }
  }, []);

  const loadBookDetails = async () => {
    try {
      setLoading(true);
      // Pour le moment, on n'a pas cette fonction, on utilise getAllBooks et on filtre
      const allBooks = await bookService.getLibraryBooks();
      const foundBook = allBooks.find(b => b.id === bookId);
      
      if (foundBook) {
        setBook(foundBook);
        loadRecommendations(foundBook);
      } else {
        Alert.alert('Erreur', 'Livre non trouvé');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading book details:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails du livre');
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async (currentBook = book) => {
    if (!currentBook) return;

    try {
      // Recherche de livres similaires basée sur les catégories ou l'auteur
      const searchQuery = currentBook.categories?.[0] || currentBook.author || 'fiction';
      const recommendations = await googleBooksService.searchBooks(searchQuery, 6);
      
      // Filtrer le livre actuel des recommandations
      const filtered = recommendations.filter(rec => rec.googleBooksId !== currentBook.googleBooksId);
      setRecommendedBooks(filtered.slice(0, 3));
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const handleBorrow = async () => {
    if (!book || !user) return;

    if (book.status !== 'available') {
      Alert.alert('Indisponible', 'Ce livre n\'est pas disponible à l\'emprunt');
      return;
    }

    Alert.alert(
      'Emprunter ce livre',
      `Voulez-vous emprunter "${book.title}" ?\n\n⚠️ Fonction de test - en réalité l'emprunt se fait physiquement à la bibliothèque.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Emprunter', 
          onPress: async () => {
            setIsBorrowing(true);
            try {
              await bookService.borrowBook(book.id, user.id);
              
              // Mettre à jour le livre local
              setBook(prev => ({
                ...prev,
                status: 'borrowed',
                borrowedBy: user.id,
                borrowDate: new Date().toISOString(),
                returnDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
              }));
              
              Alert.alert(
                'Emprunt confirmé ! 📚',
                `"${book.title}" a été ajouté à vos livres empruntés.\n\nÀ rendre dans 14 jours.`,
                [{ text: 'OK' }]
              );
            } catch (error) {
              Alert.alert('Erreur', error.message || 'Impossible d\'emprunter ce livre');
            } finally {
              setIsBorrowing(false);
            }
          }
        }
      ]
    );
  };

  const handleReturn = async () => {
    if (!book || !user) return;

    Alert.alert(
      'Retourner ce livre',
      `Voulez-vous retourner "${book.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Retourner', 
          onPress: async () => {
            setIsReturning(true);
            try {
              await bookService.returnBook(book.id, user.id);
              
              // Mettre à jour le livre local
              setBook(prev => ({
                ...prev,
                status: 'available',
                borrowedBy: null,
                borrowDate: null,
                returnDate: null
              }));
              
              Alert.alert('Livre retourné ! ✅', `"${book.title}" a été retourné avec succès.`);
            } catch (error) {
              Alert.alert('Erreur', error.message || 'Impossible de retourner ce livre');
            } finally {
              setIsReturning(false);
            }
          }
        }
      ]
    );
  };

  const getStatusInfo = () => {
    if (!book) return null;

    switch (book.status) {
      case 'available':
        return {
          color: COLORS.success,
          text: 'Available',
          icon: 'checkmark-circle'
        };
      case 'borrowed':
        if (book.borrowedBy === user?.id) {
          return {
            color: COLORS.info,
            text: 'Emprunté par vous',
            icon: 'person'
          };
        }
        return {
          color: COLORS.warning,
          text: 'Borrowed',
          icon: 'time'
        };
      case 'reserved':
        return {
          color: COLORS.info,
          text: 'Reserved',
          icon: 'bookmark'
        };
      default:
        return {
          color: COLORS.textMuted,
          text: 'Unknown',
          icon: 'help-circle'
        };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const renderRecommendedBook = ({ item }) => (
    <TouchableOpacity 
      style={styles.recommendedBookCard}
      onPress={() => {
        // Navigation vers un livre Google Books (pas dans notre DB)
        Alert.alert(
          'Livre externe',
          `"${item.title}" n'est pas dans notre bibliothèque.\n\nVoulez-vous voir plus d'infos sur Google Books ?`,
          [
            { text: 'Non', style: 'cancel' },
            { 
              text: 'Oui', 
              onPress: () => {
                // TODO: Ouvrir le lien Google Books ou ajouter à la wishlist
                console.log('Ouvrir:', item.previewLink);
              }
            }
          ]
        );
      }}
    >
      {item.cover ? (
        <Image 
          source={{ uri: item.cover }} 
          style={styles.recommendedBookImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.recommendedBookImage, styles.placeholderImage]}>
          <Ionicons name="book" size={24} color={COLORS.textPrimary} />
        </View>
      )}
      <Text style={styles.recommendedBookTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.recommendedBookAuthor} numberOfLines={1}>{item.author}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[globalStyles.container, globalStyles.centerContainer]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[globalStyles.body, { marginTop: SPACING.md }]}>
          Chargement des détails...
        </Text>
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

  const statusInfo = getStatusInfo();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        <View style={styles.coverContainer}>
          {book.cover ? (
            <Image 
              source={{ uri: book.cover }} 
              style={styles.cover}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.cover, styles.placeholderCover]}>
              <Ionicons name="book" size={60} color={COLORS.textPrimary} />
            </View>
          )}
        </View>

        {/* Status Badge */}
        {statusInfo && (
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
              <Ionicons name={statusInfo.icon} size={20} color={statusInfo.color} />
              <Text style={[styles.statusText, { color: statusInfo.color }]}>
                {statusInfo.text}
              </Text>
            </View>
          </View>
        )}

        {/* Title and Author */}
        <Text style={styles.title}>{book.title}</Text>
        <Text style={styles.author}>{book.author}</Text>

        {/* Meta Information */}
        <View style={styles.metaContainer}>
          <View style={styles.metaRow}>
            <Ionicons name="library" size={16} color={COLORS.textMuted} />
            <Text style={styles.metaText}>
              {book.genre || book.categories?.[0] || 'Non classé'}
            </Text>
          </View>
          
          {book.publishedDate && (
            <View style={styles.metaRow}>
              <Ionicons name="calendar" size={16} color={COLORS.textMuted} />
              <Text style={styles.metaText}>
                Publié en {new Date(book.publishedDate).getFullYear()}
              </Text>
            </View>
          )}
          
          {book.pageCount && (
            <View style={styles.metaRow}>
              <Ionicons name="document-text" size={16} color={COLORS.textMuted} />
              <Text style={styles.metaText}>{book.pageCount} pages</Text>
            </View>
          )}
          
          {book.location && (
            <View style={styles.metaRow}>
              <Ionicons name="location" size={16} color={COLORS.textMuted} />
              <Text style={styles.metaText}>Localisation: {book.location}</Text>
            </View>
          )}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>
            {book.description || 'Aucune description disponible.'}
          </Text>
        </View>

        {/* Publisher Info */}
        {book.publisher && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Éditeur</Text>
            <Text style={styles.description}>{book.publisher}</Text>
          </View>
        )}

        {/* Borrow/Return Info */}
        {book.status === 'borrowed' && book.borrowedBy === user?.id && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations d'emprunt</Text>
            <View style={styles.borrowInfo}>
              <Text style={styles.borrowInfoText}>
                📅 Emprunté le: {formatDate(book.borrowDate)}
              </Text>
              <Text style={styles.borrowInfoText}>
                📅 À rendre le: {formatDate(book.returnDate)}
              </Text>
            </View>
          </View>
        )}

        {/* Recommendations */}
        {recommendedBooks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Livres similaires</Text>
            <FlatList
              data={recommendedBooks}
              renderItem={renderRecommendedBook}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recommendedList}
            />
          </View>
        )}
      </ScrollView>

      {/* Action Button */}
      <View style={styles.actionContainer}>
        {book.status === 'available' && (
          <TouchableOpacity 
            style={[globalStyles.primaryButton, isBorrowing && styles.buttonDisabled]}
            onPress={handleBorrow}
            disabled={isBorrowing}
          >
            {isBorrowing ? (
              <ActivityIndicator color={COLORS.textPrimary} />
            ) : (
              <>
                <Ionicons name="add-circle" size={20} color={COLORS.textPrimary} />
                <Text style={[globalStyles.primaryButtonText, { marginLeft: SPACING.sm }]}>
                  Emprunter (Test)
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {book.status === 'borrowed' && book.borrowedBy === user?.id && (
          <TouchableOpacity 
            style={[styles.returnButton, isReturning && styles.buttonDisabled]}
            onPress={handleReturn}
            disabled={isReturning}
          >
            {isReturning ? (
              <ActivityIndicator color={COLORS.textPrimary} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.textPrimary} />
                <Text style={[styles.returnButtonText, { marginLeft: SPACING.sm }]}>
                  Retourner
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {book.status === 'borrowed' && book.borrowedBy !== user?.id && (
          <View style={styles.unavailableButton}>
            <Ionicons name="time" size={20} color={COLORS.warning} />
            <Text style={[styles.unavailableButtonText, { marginLeft: SPACING.sm }]}>
              Emprunté par un autre utilisateur
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flex: 1,
  },
  coverContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.containerPadding,
  },
  cover: {
    width: 200,
    height: 280,
    borderRadius: SPACING.cardRadius,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  placeholderCover: {
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderImage: {
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  title: {
    ...globalStyles.pageTitle,
    fontSize: 24,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.containerPadding,
  },
  author: {
    ...globalStyles.subtitle,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.containerPadding,
  },
  metaContainer: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.containerPadding,
    marginBottom: SPACING.lg,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  metaText: {
    ...globalStyles.body,
    marginLeft: SPACING.sm,
  },
  section: {
    marginHorizontal: SPACING.containerPadding,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...globalStyles.sectionTitle,
    marginBottom: SPACING.md,
  },
  description: {
    ...globalStyles.body,
    lineHeight: 22,
    textAlign: 'justify',
  },
  borrowInfo: {
    backgroundColor: COLORS.info + '20',
    padding: SPACING.md,
    borderRadius: SPACING.cardRadius,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
  },
  borrowInfoText: {
    ...globalStyles.body,
    marginBottom: SPACING.xs,
  },
  recommendedList: {
    paddingLeft: 0,
  },
  recommendedBookCard: {
    width: 120,
    marginRight: SPACING.md,
  },
  recommendedBookImage: {
    width: 120,
    height: 160,
    borderRadius: SPACING.cardRadius,
    marginBottom: SPACING.sm,
  },
  recommendedBookTitle: {
    ...globalStyles.subtitle,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: SPACING.xs,
  },
  recommendedBookAuthor: {
    ...globalStyles.caption,
    textAlign: 'center',
  },
  actionContainer: {
    padding: SPACING.containerPadding,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
  },
  returnButton: {
    ...globalStyles.primaryButton,
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  returnButtonText: {
    ...globalStyles.primaryButtonText,
  },
  unavailableButton: {
    backgroundColor: COLORS.warning + '20',
    borderRadius: SPACING.borderRadius,
    height: SPACING.buttonHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.warning,
  },
  unavailableButtonText: {
    color: COLORS.warning,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default BookDetailScreen;