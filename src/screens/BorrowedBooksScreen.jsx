import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  StyleSheet,
  RefreshControl,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { COLORS, SPACING, ROUTES } from '../constants';
import { globalStyles } from '../styles/globalStyles';

const BorrowedBooksScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBorrowedBooks();
  }, []);

  const loadBorrowedBooks = async () => {
    try {
      console.log('📚 Chargement des livres empruntés pour l\'utilisateur:', user?.id);
      
      if (!user?.id) {
        console.warn('⚠️ Pas d\'ID utilisateur');
        setBorrowedBooks([]);
        return;
      }

      const userBorrowedBooks = await api.getUserBorrowedBooks(user.id);
      console.log('✅ Livres empruntés trouvés:', userBorrowedBooks.length);
      
      // Ajouter les infos d'emprunt calculées
      const booksWithBorrowInfo = userBorrowedBooks.map(book => ({
        ...book,
        renewalCount: book.renewalCount || 0,
        maxRenewals: book.maxRenewals || 2,
      }));
      
      setBorrowedBooks(booksWithBorrowInfo);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des livres empruntés:', error);
      Alert.alert('Erreur', 'Impossible de charger vos livres empruntés');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadBorrowedBooks();
    setIsRefreshing(false);
  };

  const handleRenewBook = async (bookId) => {
    const book = borrowedBooks.find(b => b.id === bookId);
    
    if (!book) {
      Alert.alert('Erreur', 'Livre non trouvé');
      return;
    }
    
    if (book.renewalCount >= book.maxRenewals) {
      Alert.alert(
        'Renouvellement impossible', 
        'Vous avez atteint le nombre maximum de renouvellements pour ce livre.'
      );
      return;
    }

    Alert.alert(
      'Renouveler l\'emprunt',
      `Voulez-vous renouveler l'emprunt de "${book.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Renouveler', 
          onPress: async () => {
            try {
              // TODO: Implémenter la logique de renouvellement dans le service
              // Pour le moment, on simule
              const updatedBooks = borrowedBooks.map(b => {
                if (b.id === bookId) {
                  const newReturnDate = new Date();
                  newReturnDate.setDate(newReturnDate.getDate() + 14);
                  return {
                    ...b,
                    renewalCount: b.renewalCount + 1,
                    returnDate: newReturnDate.toISOString(),
                    status: 'borrowed' // S'assurer qu'il reste emprunté
                  };
                }
                return b;
              });
              setBorrowedBooks(updatedBooks);
              Alert.alert('Succès', 'Emprunt renouvelé avec succès !');
            } catch (error) {
              console.error('Erreur renouvellement:', error);
              Alert.alert('Erreur', 'Impossible de renouveler cet emprunt');
            }
          }
        }
      ]
    );
  };

  const handleReturnBook = async (bookId) => {
    const book = borrowedBooks.find(b => b.id === bookId);
    
    if (!book) {
      Alert.alert('Erreur', 'Livre non trouvé');
      return;
    }

    Alert.alert(
      'Retourner le livre',
      `Voulez-vous retourner "${book.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Retourner', 
          onPress: async () => {
            try {
              await api.returnBook(bookId, user.id);
              
              // Retirer le livre de la liste locale
              setBorrowedBooks(prev => prev.filter(b => b.id !== bookId));
              
              Alert.alert('Succès', 'Livre retourné avec succès !');
            } catch (error) {
              console.error('Erreur retour:', error);
              Alert.alert('Erreur', error.message || 'Impossible de retourner ce livre');
            }
          }
        }
      ]
    );
  };

  const getStatusInfo = (book) => {
    if (!book.returnDate) {
      return {
        text: 'Date de retour non définie',
        color: COLORS.warning,
        icon: 'warning',
        showAlert: true
      };
    }

    const returnDate = new Date(book.returnDate);
    const today = new Date();
    const diffTime = returnDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (book.status === 'overdue' || diffDays < 0) {
      return {
        text: `En retard de ${Math.abs(diffDays)} jour(s)`,
        color: COLORS.error,
        icon: 'warning',
        showAlert: true
      };
    } else if (diffDays <= 3) {
      return {
        text: `À rendre dans ${diffDays} jour(s)`,
        color: COLORS.warning,
        icon: 'time',
        showAlert: true
      };
    } else {
      return {
        text: `À rendre le ${formatDate(book.returnDate)}`,
        color: COLORS.success,
        icon: 'checkmark-circle',
        showAlert: false
      };
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const renderBookItem = ({ item }) => {
    const statusInfo = getStatusInfo(item);
    const canRenew = item.renewalCount < item.maxRenewals && item.status !== 'overdue';

    return (
      <TouchableOpacity 
        style={styles.bookCard}
        onPress={() => navigation.navigate(ROUTES.BOOK_DETAIL, { book: item })}
      >
        <View style={styles.bookContent}>
          {/* Book Cover */}
          {item.cover ? (
            <Image source={{ uri: item.cover }} style={styles.bookCover} />
          ) : (
            <View style={[styles.bookCover, styles.placeholderCover]}>
              <Ionicons name="book" size={30} color={COLORS.textPrimary} />
            </View>
          )}
          
          {/* Book Info */}
          <View style={styles.bookInfo}>
            <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.bookAuthor}>{item.author}</Text>
            
            {/* Status */}
            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
                <Ionicons 
                  name={statusInfo.icon} 
                  size={14} 
                  color={statusInfo.color} 
                />
                <Text style={[styles.statusText, { color: statusInfo.color }]}>
                  {statusInfo.text}
                </Text>
              </View>
            </View>

            {/* Renewal Info */}
            <Text style={styles.renewalInfo}>
              Renouvellements: {item.renewalCount}/{item.maxRenewals}
            </Text>

            {/* Emprunt Info */}
            {item.borrowDate && (
              <Text style={styles.borrowInfo}>
                Emprunté le {formatDate(item.borrowDate)}
              </Text>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            {statusInfo.showAlert && (
              <View style={styles.alertIcon}>
                <Ionicons name="warning" size={20} color={COLORS.error} />
              </View>
            )}
            
            <View style={styles.actionButtons}>
              {canRenew && (
                <TouchableOpacity 
                  style={styles.renewButton}
                  onPress={() => handleRenewBook(item.id)}
                >
                  <Ionicons name="refresh" size={16} color={COLORS.primary} />
                  <Text style={styles.renewButtonText}>Renouveler</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.returnButton}
                onPress={() => handleReturnBook(item.id)}
              >
                <Ionicons name="checkmark" size={16} color={COLORS.success} />
                <Text style={styles.returnButtonText}>Retourner</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={globalStyles.pageTitle}>Borrowed books</Text>
      <Text style={styles.subtitle}>
        {borrowedBooks.length} livre(s) emprunté(s)
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="library-outline" size={80} color={COLORS.textMuted} />
      <Text style={styles.emptyTitle}>Aucun livre emprunté</Text>
      <Text style={styles.emptySubtitle}>
        Rendez-vous dans la bibliothèque pour emprunter vos premiers livres !
      </Text>
      <TouchableOpacity 
        style={globalStyles.primaryButton}
        onPress={() => navigation.navigate(ROUTES.BOOK_LIST)}
      >
        <Text style={globalStyles.primaryButtonText}>Explorer la bibliothèque</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={globalStyles.container}>
        <View style={styles.loadingContainer}>
          <Text style={globalStyles.title}>Chargement de vos livres...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <FlatList
        data={borrowedBooks}
        renderItem={renderBookItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        contentContainerStyle={[
          styles.listContainer,
          borrowedBooks.length === 0 && styles.emptyListContainer
        ]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: SPACING.containerPadding,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: SPACING.xl,
    paddingTop: SPACING.xl,
  },
  subtitle: {
    ...globalStyles.body,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  bookCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SPACING.cardRadius,
    marginBottom: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookContent: {
    flexDirection: 'row',
    padding: SPACING.md,
  },
  bookCover: {
    width: 60,
    height: 80,
    borderRadius: SPACING.imageRadius,
    marginRight: SPACING.md,
  },
  placeholderCover: {
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  bookTitle: {
    ...globalStyles.title,
    fontSize: 16,
    marginBottom: SPACING.xs,
  },
  bookAuthor: {
    ...globalStyles.subtitle,
    fontSize: 14,
    marginBottom: SPACING.sm,
  },
  statusContainer: {
    marginBottom: SPACING.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  renewalInfo: {
    ...globalStyles.caption,
    fontSize: 11,
    marginBottom: SPACING.xs,
  },
  borrowInfo: {
    ...globalStyles.caption,
    fontSize: 11,
    fontStyle: 'italic',
  },
  actionsContainer: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingLeft: SPACING.sm,
  },
  alertIcon: {
    marginBottom: SPACING.sm,
  },
  actionButtons: {
    alignItems: 'flex-end',
  },
  renewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
    marginBottom: SPACING.xs,
  },
  renewButtonText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  returnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
  },
  returnButtonText: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    ...globalStyles.title,
    fontSize: 20,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    ...globalStyles.body,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 20,
  },
});

export default BorrowedBooksScreen;