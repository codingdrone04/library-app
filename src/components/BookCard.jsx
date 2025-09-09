import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image } from 'react-native';

const BookCard = ({ book, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.card}>
      <Image source={{ uri: book.cover }} style={styles.cover} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{book.title}</Text>
        <Text style={styles.author}>{book.author}</Text>
        <Text style={styles.genre}>{book.genre}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    margin: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
  },
  cover: {
    width: 80,
    height: 100,
    borderRadius: 5,
  },
  textContainer: {
    marginLeft: 10,
    flexShrink: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  author: {
    fontSize: 14,
    color: '#555',
  },
  genre: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
});

export default BookCard;