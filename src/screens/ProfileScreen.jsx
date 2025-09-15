import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch,
  Alert,
  Image 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, USER_ROLES } from '../constants';
import { globalStyles } from '../styles/globalStyles';

const ProfileScreen = ({ navigation }) => {
  const { user, logout, isLibrarian } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.notifications_enabled || false
  );

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Se déconnecter', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de se déconnecter');
            }
          }
        }
      ]
    );
  };

  const handleNotificationToggle = (value) => {
    setNotificationsEnabled(value);
    Alert.alert(
      'Paramètres mis à jour',
      `Notifications ${value ? 'activées' : 'désactivées'}`
    );
  };

  const handleEditProfile = () => {
    Alert.alert(
      'Modifier le profil',
      'Cette fonctionnalité sera disponible prochainement'
    );
  };

  const handlePasswordChange = () => {
    Alert.alert(
      'Changer le mot de passe',
      'Cette fonctionnalité sera disponible prochainement'
    );
  };

  const handleViewHistory = () => {
    Alert.alert(
      'Historique des emprunts',
      'Cette fonctionnalité sera disponible prochainement'
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getRoleBadge = (role) => {
    if (role === USER_ROLES.LIBRARIAN) {
      return {
        text: 'Bibliothécaire',
        color: COLORS.accent,
        icon: 'library'
      };
    }
    return {
      text: 'Utilisateur',
      color: COLORS.primary,
      icon: 'person'
    };
  };

  const renderProfileSection = () => {
    const roleBadge = getRoleBadge(user?.role);
    
    return (
      <View style={styles.profileSection}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={COLORS.textPrimary} />
          </View>
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {user?.firstname} {user?.lastname}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          
          {/* Role Badge */}
          <View style={[styles.roleBadge, { backgroundColor: roleBadge.color + '20' }]}>
            <Ionicons name={roleBadge.icon} size={16} color={roleBadge.color} />
            <Text style={[styles.roleText, { color: roleBadge.color }]}>
              {roleBadge.text}
            </Text>
          </View>

          {/* Member since */}
          <Text style={styles.memberSince}>
            Membre depuis le {formatDate(user?.registration_date)}
          </Text>
        </View>

        {/* Edit Button */}
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Ionicons name="create-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderStatsSection = () => {
    const stats = [
      { label: 'Livres empruntés', value: '12', icon: 'book' },
      { label: 'Livres lus', value: '8', icon: 'checkmark-circle' },
      { label: 'Favoris', value: '5', icon: 'heart' },
    ];

    return (
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Statistiques</Text>
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <Ionicons name={stat.icon} size={24} color={COLORS.primary} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderPreferencesSection = () => {
    return (
      <View style={styles.preferencesSection}>
        <Text style={styles.sectionTitle}>Préférences</Text>
        
        {/* Notifications */}
        <View style={styles.preferenceItem}>
          <View style={styles.preferenceInfo}>
            <Ionicons name="notifications" size={20} color={COLORS.textSecondary} />
            <View style={styles.preferenceText}>
              <Text style={styles.preferenceTitle}>Notifications</Text>
              <Text style={styles.preferenceDescription}>
                Recevoir des rappels pour les retours
              </Text>
            </View>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleNotificationToggle}
            trackColor={{ false: COLORS.surface, true: COLORS.primary + '50' }}
            thumbColor={notificationsEnabled ? COLORS.primary : COLORS.textMuted}
          />
        </View>

        {/* Genres préférés */}
        <TouchableOpacity style={styles.preferenceItem}>
          <View style={styles.preferenceInfo}>
            <Ionicons name="library" size={20} color={COLORS.textSecondary} />
            <View style={styles.preferenceText}>
              <Text style={styles.preferenceTitle}>Genres préférés</Text>
              <Text style={styles.preferenceDescription}>
                {user?.preferred_genres?.join(', ') || 'Aucun genre sélectionné'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderActionsSection = () => {
    const actions = [
      { 
        title: 'Historique des emprunts', 
        icon: 'time', 
        onPress: handleViewHistory 
      },
      { 
        title: 'Changer le mot de passe', 
        icon: 'lock-closed', 
        onPress: handlePasswordChange 
      },
      { 
        title: 'Aide et support', 
        icon: 'help-circle', 
        onPress: () => Alert.alert('Aide', 'Contactez-nous à support@library.com') 
      },
    ];
  
    return (
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Actions</Text>
        {actions.map((action, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.actionItem}
            onPress={action.onPress}
          >
            <Ionicons name={action.icon} size={20} color={COLORS.textSecondary} />
            <Text style={styles.actionTitle}>{action.title}</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        ))}
        
        {isLibrarian() && (
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => navigation.navigate('AdminScreen')}
          >
            <Ionicons name="library" size={20} color={COLORS.textSecondary} />
            <Text style={styles.actionTitle}>Gestion bibliothèque</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={globalStyles.container}>
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={globalStyles.pageTitle}>Profile</Text>
        </View>

        {/* Profile Info */}
        {renderProfileSection()}

        {/* Stats */}
        {renderStatsSection()}

        {/* Preferences */}
        {renderPreferencesSection()}

        {/* Actions */}
        {renderActionsSection()}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Library Management v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: SPACING.xxxl,
    paddingBottom: SPACING.lg,
  },
  profileSection: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.containerPadding,
    marginBottom: SPACING.lg,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: SPACING.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...globalStyles.title,
    fontSize: 20,
    marginBottom: SPACING.xs,
  },
  userEmail: {
    ...globalStyles.subtitle,
    marginBottom: SPACING.sm,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    marginBottom: SPACING.sm,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  memberSince: {
    ...globalStyles.caption,
    fontSize: 11,
  },
  editButton: {
    padding: SPACING.sm,
  },
  statsSection: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.containerPadding,
    marginBottom: SPACING.lg,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.lg,
  },
  sectionTitle: {
    ...globalStyles.title,
    fontSize: 18,
    marginBottom: SPACING.md,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    ...globalStyles.title,
    fontSize: 24,
    color: COLORS.primary,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    ...globalStyles.caption,
    textAlign: 'center',
  },
  preferencesSection: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.containerPadding,
    marginBottom: SPACING.lg,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.lg,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  preferenceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  preferenceText: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  preferenceTitle: {
    ...globalStyles.subtitle,
    fontSize: 16,
    marginBottom: SPACING.xs,
  },
  preferenceDescription: {
    ...globalStyles.caption,
  },
  actionsSection: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.containerPadding,
    marginBottom: SPACING.lg,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.lg,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  actionTitle: {
    ...globalStyles.subtitle,
    fontSize: 16,
    marginLeft: SPACING.md,
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error + '20',
    marginHorizontal: SPACING.containerPadding,
    marginBottom: SPACING.lg,
    borderRadius: SPACING.cardRadius,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.error + '50',
  },
  logoutText: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  appInfo: {
    alignItems: 'center',
    paddingHorizontal: SPACING.containerPadding,
    marginBottom: SPACING.lg,
  },
  appInfoText: {
    ...globalStyles.caption,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
});

export default ProfileScreen;