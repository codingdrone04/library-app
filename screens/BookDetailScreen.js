import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import booksData from '../data/books.json';

const BookDetailScreen = ({ route }) => {
  const { bookId } = route.params;
  const book = booksData.find((b) => b.id === bookId);

  return (
    <View style={styles.container}>
      <Image source={{ uri: book.cover }} style={styles.cover} />
      <Text style={styles.title}>{book.title}</Text>
      <View style={styles.infoContainer}>
        <Text style={styles.genre}>{book.genre}</Text>
        <Text style={styles.year}>{book.year}</Text>
      </View>
      <Text style={styles.description}>{book.description}</Text>
      <Text style={styles.author}>{book.author}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
      padding: 20,
      backgroundColor: '#F7F7F7',
    },
    cover: {
      width: '100%',
      height: 200,
      borderRadius: 10,
      marginBottom: 15,
    },
    availability: {
      fontSize: 16,
      color: 'green',
      marginVertical: 5,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      marginVertical: 10,
    },
    infoContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: 5,
    },
    genre: {
      fontSize: 14,
      color: '#777',
    },
    year: {
      fontSize: 14,
      color: '#777',
    },
    description: {
      fontSize: 16,
      marginVertical: 10,
      lineHeight: 22,
      color: '#333',
    },
    author: {
      fontSize: 18,
      fontWeight: 'bold',
      marginTop: 15,
    },
  });
  
  export default BookDetailScreen;