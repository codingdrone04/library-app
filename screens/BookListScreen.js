import React, { useState, useEffect } from 'react';
import { ScrollView, TextInput, StyleSheet, View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import BookCard from '../components/BookCard';
import BottomNavigation from '../components/BottomNavigation';
import { searchBookByTitle } from '../services/bnfApiService';
import { useNavigation } from '@react-navigation/native';

const BookListScreen = () => {
  const navigation = useNavigation();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [popularBooks, setPopularBooks] = useState([]);
  const [newBooks, setNewBooks] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Simule des données pour Popular et New
  useEffect(() => {

    setPopularBooks([
      { id: 1, title: 'Le Petit Prince', author: 'Antoine de Saint-Exupéry', cover: 'https://m.media-amazon.com/images/I/61NGp-UxolL._AC_UF1000,1000_QL80_.jpg' },
      { id: 2, title: '1984', author: 'George Orwell', cover: 'https://static.wikia.nocookie.net/classical-literature/images/6/69/51K84pomCRL._SX305_BO1%2C204%2C203%2C200_.jpg/revision/latest?cb=20190607010448' },
      { id: 3, title: 'Fahrenheit 451', author: 'Ray Bradbury', cover: 'https://upload.wikimedia.org/wikipedia/commons/b/bf/FAHRENHEIT_451_by_Ray_Bradbury%2C_Corgi_1957._160_pages._Cover_by_John_Richards.jpg' },
    ]);

    // Données temporaires pour New
    setNewBooks([
      { id: 4, title: 'Title', author: 'Author', genre: 'Genre', description: 'DescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescriptionDescription', cover: null },
    ]);
  }, []);

  const handleSearch = async (term) => {
    setSearchTerm(term);
    setIsSearching(term.length > 0);

    if (term.length > 2) {
      try {
        const results = await searchBookByTitle(term);
        setSearchResults(results || []);
      } catch (error) {
        console.error('Erreur lors de la récupération des livres:', error);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  const renderPopularBook = ({ item }) => (
    <TouchableOpacity 
      style={styles.popularBookCard}
      onPress={() => navigation.navigate('BookDetail', { bookId: item.id })}
    >
      <Image 
        source={{ uri: item.cover }} 
        style={styles.popularBookImage}
        resizeMode="cover"
      />
      <Text style={styles.popularBookTitle} numberOfLines={2}>{item.title}</Text>
    </TouchableOpacity>
  );

  const renderNewBook = ({ item }) => (
    <View style={styles.newBookCard}>
      <View style={styles.newBookImage}>
        <View style={styles.placeholderImage} />
      </View>
      <View style={styles.newBookInfo}>
        <Text style={styles.newBookTitle}>{item.title}</Text>
        <Text style={styles.newBookAuthor}>{item.author}</Text>
        <Text style={styles.newBookGenre}>{item.genre}</Text>
        <Text style={styles.newBookDescription} numberOfLines={4}>{item.description}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Find a book"
          onChangeText={handleSearch}
          value={searchTerm}
          placeholderTextColor="#666"
        />
      </View>

      <ScrollView style={styles.content}>
        {isSearching ? (
          // Résultats de recherche
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Résultats de recherche</Text>
            {searchResults.length > 0 ? (
              searchResults.map((book, index) => (
                <BookCard 
                  key={index} 
                  book={book} 
                  onPress={() => navigation.navigate('BookDetail', { bookId: book.id })}
                />
              ))
            ) : (
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>Aucun livre trouvé</Text>
              </View>
            )}
          </View>
        ) : (
          // Affichage par défaut avec Popular et New
          <>
            {/* Section Popular */}
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

            {/* Section New */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>New</Text>
              {newBooks.map((book) => (
                <TouchableOpacity 
                  key={book.id}
                  onPress={() => navigation.navigate('BookDetail', { bookId: book.id })}
                >
                  {renderNewBook({ item: book })}
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
      <View style={{ flex: 1 }}>
    <View style={styles.container}>
    </View>
    <BottomNavigation activeTab="home" />
  </View>
    </View>
    
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2A2A2A',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  searchInput: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#404040',
    fontSize: 16,
    color: '#FFF',
    borderWidth: 1,
    borderColor: '#5A5A5A',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 20,
    marginBottom: 15,
  },
  horizontalList: {
    paddingLeft: 20,
  },
  popularBookCard: {
    width: 120,
    marginRight: 15,
  },
  popularBookImage: {
    width: 120,
    height: 160,
    borderRadius: 8,
    marginBottom: 8,
  },
  placeholderImage: {
    flex: 1,
    backgroundColor: '#FF6B35',
    borderRadius: 8,
  },
  popularBookTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  newBookCard: {
    flexDirection: 'row',
    backgroundColor: '#404040',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 8,
    padding: 15,
  },
  newBookImage: {
    width: 80,
    height: 120,
    marginRight: 15,
  },
  newBookInfo: {
    flex: 1,
  },
  newBookTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  newBookAuthor: {
    color: '#CCC',
    fontSize: 14,
    marginBottom: 4,
  },
  newBookGenre: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
  },
  newBookDescription: {
    color: '#BBB',
    fontSize: 12,
    lineHeight: 16,
  },
  noResults: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    color: '#888',
    fontSize: 16,
  },
});

export default BookListScreen;