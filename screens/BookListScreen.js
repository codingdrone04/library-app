import React, { useState } from 'react';
import { ScrollView, TextInput, StyleSheet, View, Text } from 'react-native';
import BookCard from '../components/BookCard';
import { searchBookByTitle } from '../services/bnfApiService';
import { useNavigation } from '@react-navigation/native';

const BookListScreen = () => {
  const navigation = useNavigation();
  const [searchTerm, setSearchTerm] = useState('');
  const [books, setBooks] = useState([]);

  const handleSearch = async (term) => {
    setSearchTerm(term);

    if (term.length > 2) { // Évite des appels trop fréquents
      try {
        const results = await searchBookByTitle(term);
        setBooks(results || []); // Assure-toi de définir un tableau vide si `results` est undefined
      } catch (error) {
        console.error('Erreur lors de la récupération des livres:', error);
        setBooks([]); // Réinitialise la liste en cas d'erreur
      }
    } else {
      setBooks([]); // Réinitialise la liste si le terme est trop court
    }
  };

  return (
    <ScrollView style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Rechercher par titre ou auteur"
        onChangeText={handleSearch}
        value={searchTerm}
      />
      {books && books.length > 0 ? (
        books.map((book, index) => (
          <BookCard 
            key={index} 
            book={book} 
            onPress={() => navigation.navigate('BookDetail', { bookId: book.id })}
          />
        ))
      ) : (
        <View style={styles.noResults}>
          <Text>Aucun livre trouvé</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F0F0F0',
  },
  searchInput: {
    margin: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#E6E6E6',
    fontSize: 16,
  },
  noResults: {
    padding: 20,
    alignItems: 'center',
  },
});

export default BookListScreen;
