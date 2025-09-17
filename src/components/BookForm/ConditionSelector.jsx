import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants';

const ConditionSelector = ({ 
  label = 'État', 
  value = 'good', 
  onValueChange,
  required = false 
}) => {
  const conditions = [
    { value: 'excellent', label: 'Excellent', icon: 'star', color: COLORS.success },
    { value: 'good', label: 'Bon', icon: 'checkmark-circle', color: COLORS.success },
    { value: 'fair', label: 'Correct', icon: 'alert-circle', color: COLORS.warning },
    { value: 'poor', label: 'Mauvais', icon: 'close-circle', color: COLORS.warning },
    { value: 'damaged', label: 'Endommagé', icon: 'warning', color: COLORS.error },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label} {required && '*'}
      </Text>
      
      <View style={styles.optionsContainer}>
        {conditions.map((condition) => (
          <TouchableOpacity
            key={condition.value}
            style={[
              styles.option,
              value === condition.value && styles.selectedOption,
              value === condition.value && { borderColor: condition.color }
            ]}
            onPress={() => onValueChange(condition.value)}
          >
            <Ionicons 
              name={condition.icon} 
              size={20} 
              color={value === condition.value ? condition.color : COLORS.textMuted} 
            />
            <Text style={[
              styles.optionText,
              value === condition.value && styles.selectedOptionText,
              value === condition.value && { color: condition.color }
            ]}>
              {condition.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
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
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SPACING.cardRadius,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 80,
  },
  selectedOption: {
    backgroundColor: COLORS.surface,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: SPACING.xs,
  },
  selectedOptionText: {
    fontWeight: '600',
  },
});

export default ConditionSelector;