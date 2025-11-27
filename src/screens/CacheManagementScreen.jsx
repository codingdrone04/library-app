import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { Button, Card, ActivityIndicator } from 'react-native-paper';
import { COLORS } from '../constants';
import imageCacheService from '../services/imageCacheService';

const CacheManagementScreen = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clearing, setClearing] = useState(false);

  const loadStats = async () => {
    try {
      const cacheStats = await imageCacheService.getCacheStats();
      setStats(cacheStats);
    } catch (error) {
      console.error('Error loading cache stats:', error);
      Alert.alert('Erreur', 'Impossible de charger les statistiques du cache');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  const handleClearCache = () => {
    Alert.alert(
      'Vider le cache',
      `Voulez-vous vraiment supprimer ${stats?.itemCount || 0} images en cache (${stats?.sizeMB || 0} MB) ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Vider',
          style: 'destructive',
          onPress: async () => {
            setClearing(true);
            try {
              await imageCacheService.clearCache();
              Alert.alert('Succès', 'Le cache a été vidé avec succès');
              await loadStats();
            } catch (error) {
              console.error('Error clearing cache:', error);
              Alert.alert('Erreur', 'Impossible de vider le cache');
            } finally {
              setClearing(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const usagePercentage = stats ? (stats.size / (stats.maxSizeMB * 1024 * 1024) * 100).toFixed(1) : 0;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.title}>Cache d'images</Text>
            <Text style={styles.subtitle}>
              Les images des livres sont mises en cache localement pour un accès rapide et hors ligne
            </Text>

            <View style={styles.statsContainer}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Taille du cache:</Text>
                <Text style={styles.statValue}>
                  {stats?.sizeMB || 0} MB / {stats?.maxSizeMB || 50} MB
                </Text>
              </View>

              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(usagePercentage, 100)}%`,
                      backgroundColor:
                        usagePercentage > 90
                          ? COLORS.error
                          : usagePercentage > 70
                          ? COLORS.warning
                          : COLORS.primary,
                    },
                  ]}
                />
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Utilisation:</Text>
                <Text style={styles.statValue}>{usagePercentage}%</Text>
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Nombre d'images:</Text>
                <Text style={styles.statValue}>{stats?.itemCount || 0}</Text>
              </View>
            </View>

            <Button
              mode="contained"
              onPress={handleClearCache}
              loading={clearing}
              disabled={clearing || !stats?.itemCount}
              style={styles.clearButton}
              buttonColor={COLORS.error}
            >
              Vider le cache
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.title}>Comment ça marche ?</Text>
            <Text style={styles.infoText}>
              • Les images des livres sont automatiquement téléchargées et stockées localement lors de la première consultation
            </Text>
            <Text style={styles.infoText}>
              • Les images en cache sont disponibles même sans connexion Internet
            </Text>
            <Text style={styles.infoText}>
              • Le cache se nettoie automatiquement lorsqu'il atteint la limite de {stats?.maxSizeMB || 50} MB
            </Text>
            <Text style={styles.infoText}>
              • Les images les plus anciennes sont supprimées en premier
            </Text>
          </Card.Content>
        </Card>

        {stats?.items && stats.items.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.title}>Images récentes</Text>
              {stats.items.slice(0, 5).map((item, index) => (
                <View key={item.key} style={styles.itemRow}>
                  <Text style={styles.itemText} numberOfLines={1}>
                    Image {index + 1}
                  </Text>
                  <Text style={styles.itemSize}>
                    {(item.size / 1024).toFixed(1)} KB
                  </Text>
                </View>
              ))}
              {stats.items.length > 5 && (
                <Text style={styles.moreText}>
                  ... et {stats.items.length - 5} autres
                </Text>
              )}
            </Card.Content>
          </Card>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    backgroundColor: COLORS.surface,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 16,
    lineHeight: 20,
  },
  statsContainer: {
    marginVertical: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    marginVertical: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  clearButton: {
    marginTop: 16,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 8,
    lineHeight: 20,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  itemSize: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  moreText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default CacheManagementScreen;
