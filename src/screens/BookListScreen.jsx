import React, { useState, useEffect } from 'react';
import { 
  ScrollView, 
  TextInput, 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import BookCard from '../components/BookCard';
import SearchBar from '../components/Searchbar';
import { COLORS, SPACING, ROUTES } from '../constants';
import { globalStyles } from '../styles/globalStyles';
import DevLogout from '../components/DevLogout';

const BookListScreen = ({ navigation }) => {
  const { user, isLibrarian } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [popularBooks, setPopularBooks] = useState([]);
  const [newBooks, setNewBooks] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      setError(null);
            
      const allBooks = await api.getLibraryBooks();
      
      if (allBooks.length === 0) {
        setError('Aucun livre trouvé dans la base de données');
        setPopularBooks([]);
        setNewBooks([]);
        return;
      }
      
      const availableBooks = allBooks.filter(book => book.status === 'available');
      
      const recentBooks = allBooks
        .filter(book => {
          const acquisitionDate = new Date(book.library?.acquisitionDate || book.createdAt);
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          return acquisitionDate > oneMonthAgo;
        })
        .sort((a, b) => new Date(b.library?.acquisitionDate || b.createdAt) - new Date(a.library?.acquisitionDate || a.createdAt));
      
      setPopularBooks(availableBooks.slice(0, 6));
      setNewBooks(recentBooks.slice(0, 5));
      
    } catch (error) {
      console.error('❌ Erreur loading initial data:', error);
      setError(`Erreur de connexion: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadInitialData();
    setIsRefreshing(false);
  };

  const handleSearch = async (term) => {
    setSearchTerm(term);
    setIsSearching(term.length > 0);
  
    if (term.length > 2) {
      setSearchLoading(true);
      try {
        const results = await api.searchBooks(term);
        setSearchResults(results || []);
        
        if (__DEV__ && (!results || results.length === 0)) {
          const allBooks = await api.getLibraryBooks();
          console.log(`🔍 Debug recherche: "${term}" - 0 résultats sur ${allBooks.length} livres`);
        }
        
      } catch (error) {
        console.error('❌ Erreur recherche:', error);
        setSearchResults([]);
        
        Alert.alert(
          'Erreur de recherche', 
          `Impossible de rechercher: ${error.message}\n\nURL: ${api.getBaseURL()}`,
          [
            { text: 'OK' },
            { text: 'Tester API', onPress: () => testAPIConnection() }
          ]
        );
      } finally {
        setSearchLoading(false);
      }
    } else {
      setSearchResults([]);
      setSearchLoading(false);
    }
  };

  const testAPIConnection = async () => {
    try {
      const result = await api.testConnection();
      
      Alert.alert(
        result.success ? '✅ Connexion réussie' : '❌ Connexion échouée',
        `URL: ${api.getBaseURL()}\n\n${result.message}`,
        [
          { text: 'OK' },
          result.success && { 
            text: 'Recharger', 
            onPress: () => loadInitialData() 
          }
        ].filter(Boolean)
      );
    } catch (error) {
      console.error('❌ Erreur test:', error);
      Alert.alert('❌ Erreur', error.message);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Welcome Message */}
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeText}>
          Bonjour {user?.firstname || 'Utilisateur'} 👋
        </Text>
        {isLibrarian() && (
          <View style={styles.librarianBadge}>
            <Ionicons name="library" size={16} color={COLORS.accent} />
            <Text style={styles.librarianText}>Bibliothécaire</Text>
          </View>
        )}
      </View>
  
      {/* Search Bar - SIMPLIFIÉ */}
      <SearchBar
        value={searchTerm}
        onChangeText={handleSearch}
        placeholder="Rechercher un livre..."
        loading={searchLoading}
      />
  
      {/* Bouton de test API */}
      <TouchableOpacity 
        style={styles.testButton}
        onPress={testAPIConnection}
      >
        <Ionicons name="refresh" size={16} color="white" />
        <Text style={styles.testButtonText}>🔍 Tester API & Recharger</Text>
      </TouchableOpacity>
    </View>
  );

  // ✅ RENDER FUNCTIONS ULTRA-SIMPLIFIÉES
  const renderPopularBook = ({ item }) => (
    <BookCard 
      book={item}
      variant="compact"
      onPress={() => navigation.navigate(ROUTES.BOOK_DETAIL, { book: item })}
    />
  );

  const renderNewBook = ({ item }) => (
    <BookCard 
      book={item}
      variant="horizontal"
      onPress={() => navigation.navigate(ROUTES.BOOK_DETAIL, { book: item })}
    />
  );

  const renderSearchResult = ({ item }) => (
    <BookCard 
      book={item}
      variant="horizontal"
      onPress={() => navigation.navigate(ROUTES.BOOK_DETAIL, { book: item })}
    />
  );

  // Affichage d'erreur
  if (error && !isLoading) {
    return (
      <View style={globalStyles.container}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={80} color={COLORS.error} />
          <Text style={styles.errorTitle}>Erreur de connexion</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={globalStyles.primaryButton}
            onPress={loadInitialData}
          >
            <Text style={globalStyles.primaryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderContent = () => {
    if (isSearching) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Résultats de recherche ({searchResults.length})
          </Text>
          {searchLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Recherche en cours...</Text>
            </View>
          ) : searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item._id || item.id}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.noResults}>
              <Ionicons name="search" size={60} color={COLORS.textMuted} />
              <Text style={styles.noResultsText}>Aucun livre trouvé</Text>
              <Text style={styles.noResultsSubtext}>
                Essayez avec d'autres mots-clés
              </Text>
            </View>
          )}
        </View>
      );
    }

    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement des livres...</Text>
        </View>
      );
    }

    return (
      <>
        {/* Popular Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Livres populaires ({popularBooks.length})
          </Text>
          {popularBooks.length > 0 ? (
            <FlatList
              data={popularBooks}
              renderItem={renderPopularBook}
              keyExtractor={(item) => item._id || item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          ) : (
            <Text style={styles.emptyText}>Aucun livre disponible</Text>
          )}
        </View>

        {/* New Section */}
        <View style={[styles.section, styles.lastSection]}>
          <Text style={styles.sectionTitle}>
            Nouveautés ({newBooks.length})
          </Text>
          {newBooks.length > 0 ? (
            <FlatList
              data={newBooks}
              renderItem={renderNewBook}
              keyExtractor={(item) => item._id || item.id}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <Text style={styles.emptyText}>Aucune nouveauté</Text>
          )}
        </View>
      </>
    );
  };

  return (
    <View style={globalStyles.container}>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderHeader()}
        {renderContent()}
      </ScrollView>
      <DevLogout />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  headerContainer: {
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: SPACING.xxxl,
    paddingBottom: SPACING.lg,
  },
  welcomeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  welcomeText: {
    ...globalStyles.title,
    fontSize: 18,
  },
  librarianBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  librarianText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.info,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: SPACING.sm,
  },
  testButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  lastSection: {
    marginBottom: SPACING.xxxl,
  },
  sectionTitle: {
    ...globalStyles.sectionTitle,
    marginLeft: SPACING.containerPadding,
    marginBottom: SPACING.md,
  },
  horizontalList: {
    paddingLeft: SPACING.containerPadding,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  loadingText: {
    ...globalStyles.body,
    marginTop: SPACING.md,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.containerPadding,
  },
  noResultsText: {
    ...globalStyles.title,
    fontSize: 18,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  noResultsSubtext: {
    ...globalStyles.body,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  errorTitle: {
    ...globalStyles.title,
    fontSize: 20,
    color: COLORS.error,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  errorText: {
    ...globalStyles.body,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  emptyText: {
    ...globalStyles.body,
    textAlign: 'center',
    paddingHorizontal: SPACING.containerPadding,
    fontStyle: 'italic',
  },
});

export default BookListScreen;