import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants';

const ArrayInput = ({ 
  label, 
  items = [], 
  onItemsChange, 
  placeholder,
  required = false 
}) => {
  const [currentValue, setCurrentValue] = useState('');

  const addItem = () => {
    if (currentValue.trim() && !items.includes(currentValue.trim())) {
      onItemsChange([...items, currentValue.trim()]);
      setCurrentValue('');
    }
  };

  const removeItem = (index) => {
    onItemsChange(items.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label} {required && '*'}
      </Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={currentValue}
          onChangeText={setCurrentValue}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textPlaceholder}
          onSubmitEditing={addItem}
        />
        <TouchableOpacity onPress={addItem} style={styles.addButton}>
          <Ionicons name="add" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {items.map((item, index) => (
        <View key={index} style={styles.tagContainer}>
          <Text style={styles.tagText}>{item}</Text>
          <TouchableOpacity onPress={() => removeItem(index)}>
            <Ionicons name="close" size={16} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: SPACING.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: 16,
    marginRight: SPACING.sm,
    minHeight: 50,
  },
  addButton: {
    backgroundColor: COLORS.primary + '20',
    borderRadius: 20,
    padding: SPACING.sm,
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary + '20',
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  tagText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ArrayInput;