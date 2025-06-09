import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import booksData from '../data/books.json';
import BottomNavigation from '../components/BottomNavigation';

const BookDetailScreen = ({ route, navigation }) => {
  const { bookId } = route.params;
  const book = booksData.find((b) => b.id === bookId);

  // Livres recommandés (exclut le livre actuel)
  const recommendedBooks = booksData.filter(b => b.id !== bookId).slice(0, 3);

  // Extraire l'année de la date
  const year = book.date ? new Date(book.date).getFullYear() : 'Date inconnue';

  // Genres simulés
  const genres = ['Genre1', 'Genre2', 'Genre3'];

  const renderRecommendedBook = ({ item }) => (
    <TouchableOpacity 
      style={styles.recommendedBookCard}
      onPress={() => navigation.push('BookDetail', { bookId: item.id })}
    >
      <Image 
        source={{ uri: item.cover }} 
        style={styles.recommendedBookImage}
        resizeMode="cover"
      />
      <Text style={styles.recommendedBookTitle} numberOfLines={2}>{item.title}</Text>
    </TouchableOpacity>
  );

  if (!book) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Livre non trouvé</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        {/* Image de couverture */}
        <View style={styles.coverContainer}>
          <Image 
            source={{ uri: book.cover }} 
            style={styles.cover}
            resizeMode="cover"
          />
        </View>

        {/* Badge Available */}
        <View style={styles.availableContainer}>
          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          <Text style={styles.availableText}>Available</Text>
        </View>

        {/* Titre */}
        <Text style={styles.title}>{book.title}</Text>

        {/* Genres et Année */}
        <View style={styles.metaContainer}>
          <View style={styles.genresContainer}>
            {genres.map((genre, index) => (
              <Text key={index} style={styles.genre}>{genre}</Text>
            ))}
          </View>
          <Text style={styles.year}>{year}</Text>
        </View>

        {/* Description */}
        <Text style={styles.descriptionTitle}>Big Description</Text>
        <Text style={styles.description}>{book.description}</Text>

        {/* Auteur */}
        <Text style={styles.authorTitle}>Author</Text>
        <View style={styles.authorContainer}>
          <View style={styles.authorImagePlaceholder} />
          <Text style={styles.authorDescription}>
            Author description Author description Author description
            Author description Author description Author description
            Author description Author description Author description
          </Text>
        </View>

        {/* Section See also */}
        <Text style={styles.seeAlsoTitle}>See also</Text>
        <FlatList
          data={recommendedBooks}
          renderItem={renderRecommendedBook}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recommendedList}
        />
      </ScrollView>

      {/* Barre de navigation */}
      <BottomNavigation activeTab="home" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2A2A2A',
  },
  coverContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  cover: {
    width: 200,
    height: 280,
    borderRadius: 8,
  },
  availableContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  availableText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  genresContainer: {
    flex: 1,
  },
  genre: {
    fontSize: 14,
    color: '#CCC',
    marginBottom: 4,
  },
  year: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '500',
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#CCC',
    paddingHorizontal: 20,
    marginBottom: 25,
    textAlign: 'justify',
  },
  authorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  authorContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  authorImagePlaceholder: {
    width: 60,
    height: 80,
    backgroundColor: '#FF6B35',
    borderRadius: 6,
    marginRight: 15,
  },
  authorDescription: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    color: '#CCC',
  },
  seeAlsoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  recommendedList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  recommendedBookCard: {
    width: 120,
    marginRight: 15,
  },
  recommendedBookImage: {
    width: 120,
    height: 160,
    borderRadius: 8,
    marginBottom: 8,
  },
  recommendedBookTitle: {
    color: '#FFF',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  errorText: {
    fontSize: 18,
    color: '#FF6B35',
    textAlign: 'center',
    marginTop: 50,
  },
});

export default BookDetailScreen;