import React, { useState } from 'react';
import { ScrollView, TextInput } from 'react-native';
import BookCard from '../components/BookCard';
import booksData from '../data/books.json';
import { useNavigation } from '@react-navigation/native';

const BookListScreen = () => {
  const navigation = useNavigation();
  const [searchTerm, setSearchTerm] = useState('');
  const filteredBooks = booksData.filter((book) => {
    const titleMatch = book.title.toLowerCase().includes(searchTerm.toLowerCase());
    const authorMatch = book.author.toLowerCase().includes(searchTerm.toLowerCase());
    return titleMatch || authorMatch;
  });

  return (
    <ScrollView>
      <TextInput
        placeholder="Rechercher par titre ou auteur"
        onChangeText={setSearchTerm}
        value={searchTerm}
      />
      {filteredBooks.map((book) => (
        <BookCard key={book.id} book={book} onPress={() => navigation.navigate('BookDetail', { bookId: book.id })} />
      ))}
    </ScrollView>
  );
};

export default BookListScreen;
