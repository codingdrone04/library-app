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
import { COLORS, SPACING, ROUTES } from '../constants';
import { globalStyles } from '../styles/globalStyles';

const BorrowedBooksScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadBorrowedBooks();
  }, []);

  const loadBorrowedBooks = async () => {
    try {
      // TODO: Remplacer par un vrai appel API
      const mockBorrowedBooks = [
        {
          id: 1,
          title: "The Art of War",
          author: "Sun Tzu",
          cover: "https://images-na.ssl-images-amazon.com/images/I/41j6DH8XbwL._SX331_BO1,204,203,200_.jpg",
          borrowDate: "2025-01-01",
          returnDate: "2025-01-15",
          status: "active", // active, overdue, returned
          renewalCount: 0,
          maxRenewals: 2,
        },
        {
          id: 2,
          title: "Clean Code",
          author: "Robert C. Martin", 
          cover: "https://m.media-amazon.com/images/I/41xShlnTZTL._SX376_BO1,204,203,200_.jpg",
          borrowDate: "2024-12-20",
          returnDate: "2025-01-03",
          status: "overdue",
          renewalCount: 1,
          maxRenewals: 2,
        },
        {
          id: 3,
          title: "React Native in Action",
          author: "Nader Dabit",
          cover: "https://images.manning.com/360/480/resize/book/c/4c8c2b4-8277-4d85-b0fb-17c2c5d7c4e8/Dabit-RN-HI.png",
          borrowDate: "2024-12-15",
          returnDate: "2024-12-29",
          status: "overdue",
          renewalCount: 2,
          maxRenewals: 2,
        }
      ];
      
      setBorrowedBooks(mockBorrowedBooks);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger vos livres empruntés');
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadBorrowedBooks();
    setIsRefreshing(false);
  };

  const handleRenewBook = async (bookId) => {
    const book = borrowedBooks.find(b => b.id === bookId);
    
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
              // TODO: Appel API pour renouveler
              const updatedBooks = borrowedBooks.map(b => {
                if (b.id === bookId) {
                  const newReturnDate = new Date();
                  newReturnDate.setDate(newReturnDate.getDate() + 14);
                  return {
                    ...b,
                    renewalCount: b.renewalCount + 1,
                    returnDate: newReturnDate.toISOString().split('T')[0],
                    status: 'active'
                  };
                }
                return b;
              });
              setBorrowedBooks(updatedBooks);
              Alert.alert('Succès', 'Emprunt renouvelé avec succès !');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de renouveler cet emprunt');
            }
          }
        }
      ]
    );
  };

  const getStatusInfo = (book) => {
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
        onPress={() => navigation.navigate(ROUTES.BOOK_DETAIL, { bookId: item.id })}
      >
        <View style={styles.bookContent}>
          {/* Book Cover */}
          <Image source={{ uri: item.cover }} style={styles.bookCover} />
          
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
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            {statusInfo.showAlert && (
              <View style={styles.alertIcon}>
                <Ionicons name="warning" size={20} color={COLORS.error} />
              </View>
            )}
            
            {canRenew && (
              <TouchableOpacity 
                style={styles.renewButton}
                onPress={() => handleRenewBook(item.id)}
              >
                <Ionicons name="refresh" size={18} color={COLORS.primary} />
                <Text style={styles.renewButtonText}>Renouveler</Text>
              </TouchableOpacity>
            )}
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
  },
  actionsContainer: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingLeft: SPACING.sm,
  },
  alertIcon: {
    marginBottom: SPACING.sm,
  },
  renewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
  },
  renewButtonText: {
    color: COLORS.primary,
    fontSize: 12,
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