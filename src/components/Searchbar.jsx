import React from 'react';
import { TextInput, View, Text } from 'react-native';

const Searchbar = ({ searchTerm, setSearchTerm }) => {
  return (
    <View style={{ margin: 10 }}>
      <Text style={{ marginBottom: 5 }}>Rechercher par titre ou auteur :</Text>
      <TextInput
        placeholder="Rechercher..."
        value={searchTerm}
        onChangeText={setSearchTerm}
        style={{
          height: 40,
          borderColor: 'gray',
          borderWidth: 1,
          paddingHorizontal: 10,
        }}
      />
    </View>
  );
};

export default Searchbar;