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
  ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, ROUTES } from '../constants';
import { globalStyles } from '../styles/globalStyles';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, isLoading, error, clearError } = useAuth();

  // Clear error when component mounts or when inputs change
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [username, password]);

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

    try {
      await login(username.trim(), password);
      
      // Navigation will be handled by the AuthNavigator
      Alert.alert('Succès', 'Connexion réussie !', [
        { text: 'OK', onPress: () => navigation.navigate(ROUTES.BOOK_LIST) }
      ]);
    } catch (error) {
      Alert.alert('Erreur de connexion', error.message);
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
                placeholder="Username"
                placeholderTextColor={COLORS.textPlaceholder}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
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
                placeholder="Password"
                placeholderTextColor={COLORS.textPlaceholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
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
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity 
              style={[
                globalStyles.primaryButton, 
                isLoading && styles.buttonDisabled,
                styles.loginButton
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={globalStyles.primaryButtonText}>
                {isLoading ? 'Connexion...' : 'Login'}
              </Text>
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={navigateToRegister}>
                <Text style={styles.registerLink}>Register Here</Text>
              </TouchableOpacity>
            </View>

            {/* Demo Accounts Info */}
            <View style={styles.demoContainer}>
              <Text style={styles.demoTitle}>Comptes de démonstration :</Text>
              <Text style={styles.demoText}>👨‍💼 Bibliothécaire: admin / admin</Text>
              <Text style={styles.demoText}>👤 Utilisateur: user / user</Text>
            </View>
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
    marginBottom: SPACING.xxxl + SPACING.lg,
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
  buttonDisabled: {
    backgroundColor: COLORS.surfaceLight,
    shadowOpacity: 0,
    elevation: 0,
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
});

export default LoginScreen;