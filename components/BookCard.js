import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image } from 'react-native';

const BookCard = ({ book, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <View style={styles.card}>
        <Image source={{ uri: book.cover }} style={styles.cover} />
        <Text>{book.title}</Text>
        <Text>{book.author}</Text>
        <Text>{book.description}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  cover: {
    width: '100%',
    height: 200,
    borderRadius: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  author: {
    fontSize: 14,
    color: '#555',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  description: {
    fontSize: 14,
    marginTop: 5,
  },
});

export default BookCard;
