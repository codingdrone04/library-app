// src/screens/BookListScreen.js
import React, { useState, useEffect } from 'react';
import { 
  ScrollView, 
  TextInput, 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Image,
  RefreshControl 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { searchBookByTitle } from '../services/bnfApiService';
import { COLORS, SPACING, ROUTES } from '../constants';
import { globalStyles } from '../styles/globalStyles';

const BookListScreen = ({ navigation }) => {
  const { user, isLibrarian } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [popularBooks, setPopularBooks] = useState([]);
  const [newBooks, setNewBooks] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // TODO: Remplacer par de vrais appels API
      setPopularBooks([
        { 
          id: 1, 
          title: 'Le Petit Prince', 
          author: 'Antoine de Saint-Exupéry', 
          cover: 'https://m.media-amazon.com/images/I/61NGp-UxolL._AC_UF1000,1000_QL80_.jpg',
          status: 'available'
        },
        { 
          id: 2, 
          title: '1984', 
          author: 'George Orwell', 
          cover: 'https://static.wikia.nocookie.net/classical-literature/images/6/69/51K84pomCRL._SX305_BO1%2C204%2C203%2C200_.jpg/revision/latest?cb=20190607010448',
          status: 'available'
        },
        { 
          id: 3, 
          title: 'Fahrenheit 451', 
          author: 'Ray Bradbury', 
          cover: 'https://upload.wikimedia.org/wikipedia/commons/b/bf/FAHRENHEIT_451_by_Ray_Bradbury%2C_Corgi_1957._160_pages._Cover_by_John_Richards.jpg',
          status: 'borrowed'
        },
      ]);

      setNewBooks([
        {
          id: 4,
          title: 'The Psychology of Programming',
          author: 'Gerald M. Weinberg',
          genre: 'Technology',
          description: 'A comprehensive guide to understanding the human aspects of programming and software development.',
          cover: null,
          status: 'available',
          publishedYear: 2023,
        },
        {
          id: 5,
          title: 'Clean Architecture',
          author: 'Robert C. Martin',
          genre: 'Technology',
          description: 'A comprehensive guide to building maintainable and scalable software systems.',
          cover: 'https://images-na.ssl-images-amazon.com/images/I/411csr6Ef7L._SX376_BO1,204,203,200_.jpg',
          status: 'available',
          publishedYear: 2023,
        }
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
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
      try {
        const results = await searchBookByTitle(term);
        setSearchResults(results || []);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'available':
        return {
          color: COLORS.success,
          text: 'Available',
          icon: 'checkmark-circle'
        };
      case 'borrowed':
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

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Find a book"
            onChangeText={handleSearch}
            value={searchTerm}
            placeholderTextColor={COLORS.textPlaceholder}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity 
              onPress={() => handleSearch('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const renderPopularBook = ({ item }) => {
    const statusBadge = getStatusBadge(item.status);
    
    return (
      <TouchableOpacity 
        style={styles.popularBookCard}
        onPress={() => navigation.navigate(ROUTES.BOOK_DETAIL, { bookId: item.id })}
      >
        <Image 
          source={{ uri: item.cover }} 
          style={styles.popularBookImage}
          resizeMode="cover"
        />
        <View style={styles.popularBookInfo}>
          <Text style={styles.popularBookTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.popularBookAuthor} numberOfLines={1}>{item.author}</Text>
          
          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusBadge.color + '20' }]}>
            <Ionicons 
              name={statusBadge.icon} 
              size={12} 
              color={statusBadge.color} 
            />
            <Text style={[styles.statusText, { color: statusBadge.color }]}>
              {statusBadge.text}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderNewBook = ({ item }) => {
    const statusBadge = getStatusBadge(item.status);
    
    return (
      <TouchableOpacity 
        style={styles.newBookCard}
        onPress={() => navigation.navigate(ROUTES.BOOK_DETAIL, { bookId: item.id })}
      >
        <View style={styles.newBookImageContainer}>
          {item.cover ? (
            <Image source={{ uri: item.cover }} style={styles.newBookImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="book" size={30} color={COLORS.textPrimary} />
            </View>
          )}
        </View>
        
        <View style={styles.newBookInfo}>
          <View style={styles.newBookHeader}>
            <Text style={styles.newBookTitle} numberOfLines={2}>{item.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusBadge.color + '20' }]}>
              <Ionicons 
                name={statusBadge.icon} 
                size={12} 
                color={statusBadge.color} 
              />
              <Text style={[styles.statusText, { color: statusBadge.color }]}>
                {statusBadge.text}
              </Text>
            </View>
          </View>
          
          <Text style={styles.newBookAuthor}>{item.author}</Text>
          <Text style={styles.newBookGenre}>{item.genre} • {item.publishedYear}</Text>
          <Text style={styles.newBookDescription} numberOfLines={3}>
            {item.description}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSearchResult = ({ item }) => (
    <TouchableOpacity 
      style={styles.searchResultCard}
      onPress={() => navigation.navigate(ROUTES.BOOK_DETAIL, { bookId: item.id })}
    >
      <Image source={{ uri: item.cover }} style={styles.searchResultImage} />
      <View style={styles.searchResultInfo}>
        <Text style={styles.searchResultTitle}>{item.title}</Text>
        <Text style={styles.searchResultAuthor}>{item.author}</Text>
        {item.genre && <Text style={styles.searchResultGenre}>{item.genre}</Text>}
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (isSearching) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Résultats de recherche ({searchResults.length})
          </Text>
          {searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item.id.toString()}
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

    return (
      <>
        {/* Popular Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular</Text>
          <FlatList
            data={popularBooks}
            renderItem={renderPopularBook}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>

        {/* New Section */}
        <View style={[styles.section, styles.lastSection]}>
          <Text style={styles.sectionTitle}>New</Text>
          <View style={styles.newBooksContainer}>
            {newBooks.map((book) => (
              <View key={book.id}>
                {renderNewBook({ item: book })}
              </View>
            ))}
          </View>
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
  searchContainer: {
    marginBottom: SPACING.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SPACING.borderRadius,
    paddingHorizontal: SPACING.containerPadding,
    height: SPACING.inputHeight,
  },
  searchIcon: {
    marginRight: SPACING.md,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 16,
    height: '100%',
  },
  clearButton: {
    padding: SPACING.xs,
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
  popularBookCard: {
    width: 130,
    marginRight: SPACING.md,
  },
  popularBookImage: {
    width: 130,
    height: 170,
    borderRadius: SPACING.cardRadius,
    marginBottom: SPACING.sm,
  },
  popularBookInfo: {
    flex: 1,
  },
  popularBookTitle: {
    ...globalStyles.subtitle,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    lineHeight: 18,
  },
  popularBookAuthor: {
    ...globalStyles.caption,
    marginBottom: SPACING.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  newBooksContainer: {
    paddingHorizontal: SPACING.containerPadding,
  },
  newBookCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.md,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  newBookImageContainer: {
    marginRight: SPACING.md,
  },
  newBookImage: {
    width: 70,
    height: 100,
    borderRadius: SPACING.imageRadius,
  },
  placeholderImage: {
    width: 70,
    height: 100,
    backgroundColor: COLORS.accent,
    borderRadius: SPACING.imageRadius,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newBookInfo: {
    flex: 1,
  },
  newBookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  newBookTitle: {
    ...globalStyles.title,
    fontSize: 16,
    flex: 1,
    marginRight: SPACING.sm,
    lineHeight: 20,
  },
  newBookAuthor: {
    ...globalStyles.subtitle,
    fontSize: 14,
    marginBottom: SPACING.xs,
  },
  newBookGenre: {
    ...globalStyles.caption,
    marginBottom: SPACING.sm,
  },
  newBookDescription: {
    ...globalStyles.body,
    fontSize: 12,
    lineHeight: 16,
  },
  searchResultCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.md,
    marginHorizontal: SPACING.containerPadding,
    marginBottom: SPACING.sm,
  },
  searchResultImage: {
    width: 60,
    height: 80,
    borderRadius: SPACING.imageRadius,
    marginRight: SPACING.md,
  },
  searchResultInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  searchResultTitle: {
    ...globalStyles.title,
    fontSize: 16,
    marginBottom: SPACING.xs,
  },
  searchResultAuthor: {
    ...globalStyles.subtitle,
    fontSize: 14,
    marginBottom: SPACING.xs,
  },
  searchResultGenre: {
    ...globalStyles.caption,
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
});

export default BookListScreen;