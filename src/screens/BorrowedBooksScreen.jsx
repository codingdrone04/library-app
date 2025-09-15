import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet,
  RefreshControl,
  Alert,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import BookCard from '../components/BookCard';
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
      if (!user?.id) {
        console.warn('⚠️ Pas d\'ID utilisateur');
        setBorrowedBooks([]);
        return;
      }

      const userBorrowedBooks = await api.getUserBorrowedBooks(user.id);
      
      const booksWithBorrowInfo = userBorrowedBooks.map(book => ({
        ...book,
        renewalCount: book.renewalCount || 0,
        maxRenewals: book.maxRenewals || 2,
        ...calculateBookStatus(book)
      }));
      
      setBorrowedBooks(booksWithBorrowInfo);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des livres empruntés:', error);
      Alert.alert('Erreur', 'Impossible de charger vos livres empruntés');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateBookStatus = (book) => {
    if (!book.returnDate) {
      return {
        statusInfo: {
          text: 'Date de retour non définie',
          color: COLORS.warning,
          icon: 'warning',
          isOverdue: false,
          daysLeft: null
        }
      };
    }

    const returnDate = new Date(book.returnDate);
    const today = new Date();
    const diffTime = returnDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (book.status === 'overdue' || diffDays < 0) {
      return {
        statusInfo: {
          text: `⚠️ En retard de ${Math.abs(diffDays)} jour(s)`,
          color: COLORS.error,
          icon: 'warning',
          isOverdue: true,
          daysLeft: diffDays
        }
      };
    } else if (diffDays <= 3) {
      return {
        statusInfo: {
          text: `⏰ À rendre dans ${diffDays} jour(s)`,
          color: COLORS.warning,
          icon: 'time',
          isOverdue: false,
          daysLeft: diffDays
        }
      };
    } else {
      return {
        statusInfo: {
          text: `📅 À rendre le ${formatDate(book.returnDate)}`,
          color: COLORS.success,
          icon: 'calendar',
          isOverdue: false,
          daysLeft: diffDays
        }
      };
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadBorrowedBooks();
    setIsRefreshing(false);
  };

  const handleRequestRenewal = async (book) => {
    Alert.alert(
      '🔄 Demande de renouvellement',
      `Demander le renouvellement de "${book.title}" ?\n\n⚠️ Cette demande sera envoyée au bibliothécaire pour validation.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Demander', 
          onPress: () => {
            Alert.alert(
              '📨 Demande envoyée !',
              `Votre demande de renouvellement pour "${book.title}" a été envoyée au bibliothécaire.\n\nVous recevrez une notification de sa réponse.`,
              [{ text: 'OK' }]
            );
          }
        }
      ]
    );
  };

  const handleContactLibrarian = () => {
    Alert.alert(
      '📞 Contacter la bibliothèque',
      'Comment souhaitez-vous contacter la bibliothèque ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: '📧 Email', 
          onPress: () => Linking.openURL('mailto:bibliotheque@example.com?subject=Question%20emprunts')
        },
        { 
          text: '📞 Téléphone', 
          onPress: () => Linking.openURL('tel:+33123456789')
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const renderBorrowedBook = ({ item }) => {
    const canRenew = item.renewalCount < item.maxRenewals && item.status !== 'overdue';

    return (
      <View style={styles.bookContainer}>
        <BookCard 
          book={item}
          variant="horizontal"
          onPress={() => navigation.navigate(ROUTES.BOOK_DETAIL, { book: item })}
        />
        
        <View style={styles.actionOverlay}>
          <View style={[styles.enhancedStatus, { backgroundColor: item.statusInfo.color + '20' }]}>
            <Ionicons 
              name={item.statusInfo.icon} 
              size={16} 
              color={item.statusInfo.color} 
            />
            <Text style={[styles.enhancedStatusText, { color: item.statusInfo.color }]}>
              {item.statusInfo.text}
            </Text>
          </View>

          <View style={styles.borrowInfo}>
            <Text style={styles.renewalInfo}>
              🔄 Renouvellements: {item.renewalCount}/{item.maxRenewals}
            </Text>
            {item.borrowDate && (
              <Text style={styles.borrowDate}>
                📅 Emprunté le {formatDate(item.borrowDate)}
              </Text>
            )}
          </View>

          <View style={styles.actionsContainer}>
            {item.statusInfo.isOverdue && (
              <View style={styles.alertBadge}>
                <Ionicons name="warning" size={20} color={COLORS.error} />
                <Text style={styles.alertText}>EN RETARD!</Text>
              </View>
            )}
            
            <View style={styles.actionButtons}>
              {canRenew && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.renewRequestButton]}
                  onPress={() => handleRequestRenewal(item)}
                >
                  <Ionicons name="mail" size={16} color={COLORS.info} />
                  <Text style={styles.renewRequestButtonText}>Demander renouvellement</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.infoButton]}
                onPress={() => {
                  Alert.alert(
                    '📚 Pour retourner ce livre',
                    `"${item.title}"\n\n📍 Rendez-vous à la bibliothèque avec le livre physique.\n\n⏰ Date limite: ${formatDate(item.returnDate)}`,
                    [
                      { text: 'OK' },
                      { text: '📞 Contacter', onPress: handleContactLibrarian }
                    ]
                  );
                }}
              >
                <Ionicons name="information-circle" size={16} color={COLORS.primary} />
                <Text style={styles.infoButtonText}>Infos retour</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={globalStyles.pageTitle}>📚 Mes livres</Text>
      <Text style={styles.subtitle}>
        {borrowedBooks.length} livre(s) emprunté(s)
      </Text>
      
      {borrowedBooks.length > 0 && (
        <>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: COLORS.error }]}>
                {borrowedBooks.filter(b => b.statusInfo?.isOverdue).length}
              </Text>
              <Text style={styles.statLabel}>En retard</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: COLORS.warning }]}>
                {borrowedBooks.filter(b => b.statusInfo?.daysLeft <= 3 && !b.statusInfo?.isOverdue).length}
              </Text>
              <Text style={styles.statLabel}>À rendre bientôt</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: COLORS.primary }]}>
                {borrowedBooks.reduce((acc, book) => acc + book.renewalCount, 0)}
              </Text>
              <Text style={styles.statLabel}>Renouvellements</Text>
            </View>
          </View>

          <View style={styles.reminderContainer}>
            <Ionicons name="information-circle" size={20} color={COLORS.info} />
            <Text style={styles.reminderText}>
              💡 Pour retourner ou renouveler un livre, rendez-vous à la bibliothèque
            </Text>
          </View>
        </>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="library-outline" size={100} color={COLORS.textMuted} />
      <Text style={styles.emptyTitle}>Aucun livre emprunté</Text>
      <Text style={styles.emptySubtitle}>
        Rendez-vous à la bibliothèque pour emprunter vos premiers livres !
      </Text>
      <TouchableOpacity 
        style={[globalStyles.primaryButton, styles.exploreButton]}
        onPress={() => navigation.navigate(ROUTES.BOOK_LIST)}
      >
        <Ionicons name="search" size={20} color={COLORS.textPrimary} />
        <Text style={[globalStyles.primaryButtonText, { marginLeft: SPACING.sm }]}>
          Explorer le catalogue
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.contactButton}
        onPress={handleContactLibrarian}
      >
        <Ionicons name="call" size={20} color={COLORS.info} />
        <Text style={styles.contactButtonText}>Contacter la bibliothèque</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={globalStyles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="library" size={60} color={COLORS.primary} />
          <Text style={globalStyles.title}>Chargement de vos livres...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <FlatList
        data={borrowedBooks}
        renderItem={renderBorrowedBook}
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
    marginBottom: SPACING.lg,
  },
  
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.surface,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    ...globalStyles.title,
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    ...globalStyles.caption,
    textAlign: 'center',
  },

  reminderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.info + '20',
    borderRadius: SPACING.cardRadius,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
  },
  reminderText: {
    ...globalStyles.body,
    marginLeft: SPACING.sm,
    flex: 1,
    lineHeight: 18,
  },

  bookContainer: {
    marginBottom: SPACING.lg,
  },
  
  actionOverlay: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.containerPadding,
    marginTop: -SPACING.sm,
    borderBottomLeftRadius: SPACING.cardRadius,
    borderBottomRightRadius: SPACING.cardRadius,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLight,
  },
  
  enhancedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    marginBottom: SPACING.sm,
  },
  enhancedStatusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  
  borrowInfo: {
    marginBottom: SPACING.md,
  },
  renewalInfo: {
    ...globalStyles.caption,
    fontSize: 12,
    marginBottom: SPACING.xs,
  },
  borrowDate: {
    ...globalStyles.caption,
    fontSize: 12,
    fontStyle: 'italic',
  },
  
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
    marginBottom: SPACING.sm,
  },
  alertText: {
    color: COLORS.error,
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: SPACING.xs,
  },
  
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    marginLeft: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  renewRequestButton: {
    backgroundColor: COLORS.info + '20',
  },
  renewRequestButtonText: {
    color: COLORS.info,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  infoButton: {
    backgroundColor: COLORS.primary + '20',
  },
  infoButtonText: {
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
    fontSize: 24,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    ...globalStyles.body,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 20,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.info + '20',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: SPACING.cardRadius,
  },
  contactButtonText: {
    color: COLORS.info,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
});

export default BorrowedBooksScreen;