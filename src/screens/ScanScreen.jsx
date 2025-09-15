import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING } from '../constants';
import { globalStyles } from '../styles/globalStyles';

const ScanScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={globalStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="scan" size={100} color={COLORS.primary} />
        </View>
        
        <Text style={styles.title}>Scanner de codes-barres</Text>
        <Text style={styles.subtitle}>Fonctionnalité en développement</Text>
        
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>
            Cette fonctionnalité permettra de :
          </Text>
          
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark" size={16} color={COLORS.success} />
              <Text style={styles.featureText}>Scanner les codes-barres des livres</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="checkmark" size={16} color={COLORS.success} />
              <Text style={styles.featureText}>Recherche automatique dans Google Books</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="checkmark" size={16} color={COLORS.success} />
              <Text style={styles.featureText}>Ajout rapide à la bibliothèque</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="checkmark" size={16} color={COLORS.success} />
              <Text style={styles.featureText}>Gestion des emprunts facilitée</Text>
            </View>
          </View>
        </View>

        <View style={styles.alternativeContainer}>
          <Text style={styles.alternativeTitle}>En attendant :</Text>
          <TouchableOpacity 
            style={styles.alternativeButton}
            onPress={() => navigation.navigate('BookList')}
          >
            <Ionicons name="search" size={20} color={COLORS.textPrimary} />
            <Text style={styles.alternativeButtonText}>
              Rechercher manuellement
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info développement */}
        <View style={styles.devInfo}>
          <Ionicons name="code-working" size={20} color={COLORS.accent} />
          <Text style={styles.devInfoText}>
            Disponible dans une prochaine version
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: SPACING.xxxl,
    paddingHorizontal: SPACING.containerPadding,
    paddingBottom: SPACING.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    marginLeft: SPACING.sm,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  iconContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    ...globalStyles.pageTitle,
    fontSize: 24,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  subtitle: {
    ...globalStyles.subtitle,
    fontSize: 16,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  descriptionContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    width: '100%',
  },
  description: {
    ...globalStyles.body,
    fontSize: 16,
    marginBottom: SPACING.md,
    textAlign: 'center',
    fontWeight: '500',
  },
  featureList: {
    marginTop: SPACING.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  featureText: {
    ...globalStyles.body,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  alternativeContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  alternativeTitle: {
    ...globalStyles.subtitle,
    fontSize: 16,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  alternativeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: SPACING.borderRadius,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  alternativeButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  devInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent + '20',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.accent + '50',
  },
  devInfoText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
});

export default ScanScreen;