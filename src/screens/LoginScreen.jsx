import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, ROUTES } from '../constants';
import { globalStyles } from '../styles/globalStyles';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, isLoading, error, clearError, isAuthenticated } = useAuth();

  // Clear error when component mounts or when inputs change
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [username, password]);

  // Rediriger si déjà connecté
  useEffect(() => {
    if (isAuthenticated) {
      navigation.replace('MainTabs');
    }
  }, [isAuthenticated, navigation]);

  const handleLogin = async () => {    
    // Basic validation
    if (!username.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre nom d\'utilisateur');
      return;
    }
    
    if (!password.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre mot de passe');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login(username.trim(), password);
            
      Alert.alert(
        'Connexion réussie !', 
        `Bienvenue ${result.user.firstname} !`,
        [
          { 
            text: 'OK', 
            onPress: () => {
              navigation.replace('MainTabs');
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('❌ Erreur de connexion:', error);
      Alert.alert('Erreur de connexion', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateToRegister = () => {
    navigation.navigate(ROUTES.REGISTER);
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Mot de passe oublié', 
      'Cette fonctionnalité sera disponible prochainement.',
      [{ text: 'OK' }]
    );
  };

  const isLoginDisabled = isLoading || isSubmitting || !username.trim() || !password.trim();

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={globalStyles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={globalStyles.pageTitle}>SIGN IN</Text>
            <Text style={styles.subtitle}>Connectez-vous à votre compte</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Username Field */}
            <View style={globalStyles.inputContainer}>
              <Ionicons 
                name="person-outline" 
                size={20} 
                color={COLORS.textMuted} 
                style={globalStyles.inputIcon} 
              />
              <TextInput
                style={globalStyles.input}
                placeholder="Nom d'utilisateur"
                placeholderTextColor={COLORS.textPlaceholder}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                editable={!isLoginDisabled}
              />
            </View>

            {/* Password Field */}
            <View style={globalStyles.inputContainer}>
              <Ionicons 
                name="lock-closed-outline" 
                size={20} 
                color={COLORS.textMuted} 
                style={globalStyles.inputIcon} 
              />
              <TextInput
                style={globalStyles.input}
                placeholder="Mot de passe"
                placeholderTextColor={COLORS.textPlaceholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                editable={!isLoginDisabled}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
                disabled={isLoginDisabled}
              >
                <Ionicons 
                  name={showPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color={COLORS.textMuted} 
                />
              </TouchableOpacity>
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity 
              onPress={handleForgotPassword}
              style={styles.forgotPasswordContainer}
              disabled={isLoginDisabled}
            >
              <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity 
              style={[
                globalStyles.primaryButton, 
                isLoginDisabled && styles.buttonDisabled,
                styles.loginButton
              ]}
              onPress={handleLogin}
              disabled={isLoginDisabled}
            >
              {isSubmitting || isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={COLORS.textPrimary} size="small" />
                  <Text style={[globalStyles.primaryButtonText, styles.loadingText]}>
                    Connexion...
                  </Text>
                </View>
              ) : (
                <Text style={globalStyles.primaryButtonText}>Se connecter</Text>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Pas de compte ? </Text>
              <TouchableOpacity 
                onPress={navigateToRegister}
                disabled={isLoginDisabled}
              >
                <Text style={styles.registerLink}>S'inscrire</Text>
              </TouchableOpacity>
            </View>

            {/* Demo Accounts Info */}
            <View style={styles.demoContainer}>
              <Text style={styles.demoTitle}>Comptes de test :</Text>
              <Text style={styles.demoText}>👨‍💼 Admin: admin / admin</Text>
              <Text style={styles.demoText}>👤 Utilisateur: user / user</Text>
            </View>

            {/* Debug Info */}
            {__DEV__ && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Info:</Text>
                <Text style={styles.debugText}>Loading: {isLoading ? 'Oui' : 'Non'}</Text>
                <Text style={styles.debugText}>Submitting: {isSubmitting ? 'Oui' : 'Non'}</Text>
                <Text style={styles.debugText}>Authenticated: {isAuthenticated ? 'Oui' : 'Non'}</Text>
                {error && <Text style={styles.debugError}>Erreur: {error}</Text>}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  eyeIcon: {
    padding: SPACING.xs,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: SPACING.lg,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    marginTop: SPACING.md,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: SPACING.sm,
  },
  buttonDisabled: {
    backgroundColor: COLORS.surfaceLight,
    shadowOpacity: 0,
    elevation: 0,
    opacity: 0.6,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xl,
  },
  registerText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  registerLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  demoContainer: {
    marginTop: SPACING.xxxl,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: SPACING.cardRadius,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
  },
  demoTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  demoText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: SPACING.xs,
  },
  debugContainer: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: COLORS.warning + '20',
    borderRadius: SPACING.cardRadius,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  debugTitle: {
    color: COLORS.warning,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  debugText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    marginBottom: SPACING.xs,
  },
  debugError: {
    color: COLORS.error,
    fontSize: 11,
    fontWeight: '600',
  },
});

export default LoginScreen;