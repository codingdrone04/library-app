import React from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../constants';

const SearchBar = ({
  value,
  onChangeText,
  placeholder = "Rechercher...",
  loading = false,
  showClearButton = true,
  autoFocus = false,
  style,
  ...textInputProps
}) => {
  const handleClear = () => {
    onChangeText('');
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputContainer}>
        <Ionicons 
          name="search" 
          size={20} 
          color={COLORS.textMuted} 
          style={styles.searchIcon} 
        />
        
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textPlaceholder}
          value={value}
          onChangeText={onChangeText}
          autoFocus={autoFocus}
          autoCapitalize="none"
          autoCorrect={false}
          {...textInputProps}
        />
        
        {loading && (
          <ActivityIndicator 
            size="small" 
            color={COLORS.primary} 
            style={styles.loadingIndicator} 
          />
        )}
        
        {showClearButton && value.length > 0 && !loading && (
          <TouchableOpacity 
            onPress={handleClear}
            style={styles.clearButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SPACING.borderRadius,
    paddingHorizontal: SPACING.containerPadding,
    height: SPACING.inputHeight,
  },
  searchIcon: {
    marginRight: SPACING.md,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 16,
    height: '100%',
  },
  loadingIndicator: {
    marginRight: SPACING.sm,
  },
  clearButton: {
    padding: SPACING.xs,
  },
});

export default SearchBar;