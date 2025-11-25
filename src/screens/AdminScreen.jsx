import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { COLORS, SPACING } from '../constants';
import { globalStyles } from '../styles/globalStyles';

const AdminScreen = ({ navigation }) => {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [books, setBooks] = useState([]);
  const [activeTab, setActiveTab] = useState('stats');

  useEffect(() => {
    if (!isAdmin()) {
      Alert.alert('Accès refusé', 'Seuls les administrateurs peuvent accéder à cette page');
      navigation.goBack();
      return;
    }
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadUsers(),
        loadAllLoans(),
        loadBooks()
      ]);
    } catch (error) {
      console.error('Erreur chargement données admin:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.api.get('/dev/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.api.get('/dev/users');
      setUsers(response.data.data);
    } catch (error) {
      console.error('Erreur users:', error);
    }
  };

  const loadAllLoans = async () => {
    try {
      const response = await api.api.get('/dev/all-loans');
      setLoans(response.data.data);
    } catch (error) {
      console.error('Erreur loans:', error);
    }
  };

  const loadBooks = async () => {
    try {
      const allBooks = await api.getLibraryBooks();
      setBooks(allBooks);
    } catch (error) {
      console.error('Erreur books:', error);
    }
  };

  const handleQuickBorrow = (book, user) => {
    Alert.alert(
      'Emprunt rapide',
      `Faire emprunter "${book.title}" à ${user.firstname} ${user.lastname} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Emprunter', 
          onPress: async () => {
            try {
              const response = await api.api.post('/dev/quick-borrow', {
                bookId: book._id,
                userId: user.id
              });
              
              Alert.alert('✅ Succès', response.data.message);
              await loadAllLoans();
              await loadBooks();
              await loadStats();
            } catch (error) {
              Alert.alert('❌ Erreur', error.response?.data?.error || error.message);
            }
          }
        }
      ]
    );
  };

  const handleForceReturn = (loan) => {
    Alert.alert(
      'Retour forcé',
      `Forcer le retour de "${loan.book_title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Retourner', 
          onPress: async () => {
            try {
              const response = await api.api.post('/dev/force-return', {
                loanId: loan.id
              });
              
              Alert.alert('✅ Succès', response.data.message);
              await loadAllLoans();
              await loadBooks();
              await loadStats();
            } catch (error) {
              Alert.alert('❌ Erreur', error.response?.data?.error || error.message);
            }
          }
        }
      ]
    );
  };

  const renderUserItem = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>
          {item.firstname} {item.lastname}
        </Text>
        <Text style={styles.userDetails}>
          @{item.username} • {item.email}
        </Text>
        <View style={[styles.roleBadge, {
          backgroundColor: item.role === 'admin'
            ? COLORS.purple + '20'
            : item.role === 'librarian'
              ? COLORS.orange + '20'
              : COLORS.primary + '20'
        }]}>
          <Ionicons
            name={item.role === 'admin' ? 'shield-checkmark' : item.role === 'librarian' ? 'book' : 'person'}
            size={10}
            color={item.role === 'admin' ? COLORS.purple : item.role === 'librarian' ? COLORS.orange : COLORS.primary}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.roleText, {
            color: item.role === 'admin' ? COLORS.purple : item.role === 'librarian' ? COLORS.orange : COLORS.primary
          }]}>
            {item.role}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.quickBorrowBtn}
        onPress={() => {
          const availableBooks = books.filter(b => b.status === 'available');
          if (availableBooks.length === 0) {
            Alert.alert('Aucun livre disponible');
            return;
          }
          handleQuickBorrow(availableBooks[0], item);
        }}
      >
        <Ionicons name="add" size={20} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderLoanItem = ({ item }) => (
    <View style={styles.loanCard}>
      <View style={styles.loanInfo}>
        <Text style={styles.loanTitle}>{item.book_title}</Text>
        <Text style={styles.loanUser}>
          {item.user.firstname} {item.user.lastname}
        </Text>
        <Text style={styles.loanDate}>
          Retour: {new Date(item.due_date).toLocaleDateString()}
        </Text>
        <View style={[styles.statusBadge, {
          backgroundColor: item.status === 'active' ? COLORS.warning + '20' : COLORS.success + '20'
        }]}>
          <Text style={[styles.statusText, {
            color: item.status === 'active' ? COLORS.warning : COLORS.success
          }]}>
            {item.status}
          </Text>
        </View>
      </View>
      {item.status === 'active' && (
        <TouchableOpacity
          style={styles.returnBtn}
          onPress={() => handleForceReturn(item)}
        >
          <Ionicons name="checkmark" size={20} color={COLORS.success} />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderStatsHeader = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Statistiques</Text>
      {stats && (
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.users}</Text>
            <Text style={styles.statLabel}>Utilisateurs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.books}</Text>
            <Text style={styles.statLabel}>Livres</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: COLORS.warning }]}>
              {stats.loans.active}
            </Text>
            <Text style={styles.statLabel}>Emprunts actifs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: COLORS.error }]}>
              {stats.loans.overdue}
            </Text>
            <Text style={styles.statLabel}>En retard</Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabs}>
      {[
        { key: 'stats', label: 'Stats', icon: 'analytics' },
        { key: 'users', label: 'Users', icon: 'people' },
        { key: 'loans', label: 'Emprunts', icon: 'library' }
      ].map((tab) => (
        <TouchableOpacity 
          key={tab.key}
          style={[styles.tab, activeTab === tab.key && styles.activeTab]}
          onPress={() => setActiveTab(tab.key)}
        >
          <Ionicons 
            name={tab.icon} 
            size={20} 
            color={activeTab === tab.key ? COLORS.primary : COLORS.textMuted} 
          />
          <Text style={[
            styles.tabText, 
            activeTab === tab.key && styles.activeTabText
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={[globalStyles.container, globalStyles.centerContainer]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={globalStyles.body}>Chargement...</Text>
      </View>
    );
  }

  const getActiveData = () => {
    if (activeTab === 'users') return users;
    if (activeTab === 'loans') return loans;
    return [];
  };

  const renderItem = ({ item }) => {
    if (activeTab === 'users') return renderUserItem({ item });
    if (activeTab === 'loans') return renderLoanItem({ item });
    return null;
  };

  const renderListHeader = () => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={globalStyles.pageTitle}>Gestion Bibliothèque</Text>
        <TouchableOpacity onPress={loadInitialData}>
          <Ionicons name="refresh" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {renderTabs()}

      {activeTab === 'stats' && renderStatsHeader()}
      {activeTab === 'users' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Utilisateurs ({users.length})</Text>
        </View>
      )}
      {activeTab === 'loans' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emprunts ({loans.length})</Text>
        </View>
      )}
    </>
  );

  return (
    <View style={globalStyles.container}>
      <FlatList
        data={getActiveData()}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderListHeader}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.containerPadding,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.xs,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: SPACING.cardRadius,
  },
  activeTab: {
    backgroundColor: COLORS.primary + '20',
  },
  tabText: {
    marginLeft: SPACING.xs,
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  content: {
    paddingBottom: SPACING.xl,
  },
  section: {
    paddingHorizontal: SPACING.containerPadding,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...globalStyles.sectionTitle,
    marginBottom: SPACING.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.lg,
    width: '48%',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    ...globalStyles.caption,
    textAlign: 'center',
  },
  userCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...globalStyles.subtitle,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  userDetails: {
    ...globalStyles.caption,
    marginBottom: SPACING.sm,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: 16,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickBorrowBtn: {
    backgroundColor: COLORS.primary + '20',
    borderRadius: 20,
    padding: SPACING.sm,
  },
  loanCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  loanInfo: {
    flex: 1,
  },
  loanTitle: {
    ...globalStyles.subtitle,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  loanUser: {
    ...globalStyles.caption,
    marginBottom: SPACING.xs,
  },
  loanDate: {
    ...globalStyles.caption,
    marginBottom: SPACING.sm,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  returnBtn: {
    backgroundColor: COLORS.success + '20',
    borderRadius: 20,
    padding: SPACING.sm,
  },
});

export default AdminScreen;