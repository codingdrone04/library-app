import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../../constants';

const BookFormSection = ({ title, children, icon }) => {
  const validChildren = React.Children.toArray(children).filter(
    child => typeof child !== 'string' || child.trim() !== ''
  );

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {icon ? `${icon} ${title}` : title}
      </Text>
      {validChildren}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
    paddingBottom: SPACING.sm,
  },
});

export default BookFormSection;