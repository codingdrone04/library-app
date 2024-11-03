import React from 'react';
import { View, Text } from 'react-native';
import booksData from '../data/books.json'; // Chemin vers ton fichier JSON

const BookDetailScreen = ({ route }) => {
  const { bookId } = route.params; // Récupère l'ID du livre passé en paramètre
  const book = booksData.find((b) => b.id === bookId); // Trouve le livre correspondant

  return (
    <View>
      <Text>{book.title}</Text>
      <Text>{book.author}</Text>
      <Text>{book.description}</Text>
      {/* Ajoute d'autres détails du livre ici */}
    </View>
  );
};

export default BookDetailScreen;
