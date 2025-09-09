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
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, ROUTES, USER_ROLES, VALIDATION } from '../constants';
import { globalStyles } from '../styles/globalStyles';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    role: USER_ROLES.USER,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  
  const { register, isLoading, error, clearError } = useAuth();

  // Clear error when component mounts or when inputs change
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [formData]);

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Firstname validation
    if (!formData.firstname.trim()) {
      newErrors.firstname = 'Le prénom est requis';
    }

    // Lastname validation
    if (!formData.lastname.trim()) {
      newErrors.lastname = 'Le nom est requis';
    }

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Le nom d\'utilisateur est requis';
    } else if (formData.username.length < VALIDATION.USERNAME_MIN_LENGTH) {
      newErrors.username = `Le nom d'utilisateur doit contenir au moins ${VALIDATION.USERNAME_MIN_LENGTH} caractères`;
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    // Password validation
    if (!formData.password.trim()) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
      newErrors.password = `Le mot de passe doit contenir au moins ${VALIDATION.PASSWORD_MIN_LENGTH} caractères`;
    }

    // Confirm password validation
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Veuillez confirmer le mot de passe';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    // Age validation (optional)
    if (formData.age && (formData.age < VALIDATION.AGE_MIN || formData.age > VALIDATION.AGE_MAX)) {
      newErrors.age = `L'âge doit être entre ${VALIDATION.AGE_MIN} et ${VALIDATION.AGE_MAX} ans`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      Alert.alert('Erreur', 'Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    try {
      const userData = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : null,
      };
      
      await register(userData);
      
      Alert.alert(
        'Inscription réussie', 
        'Votre compte a été créé avec succès !',
        [{ text: 'OK', onPress: () => navigation.navigate(ROUTES.BOOK_LIST) }]
      );
    } catch (error) {
      Alert.alert('Erreur d\'inscription', error.message);
    }
  };

  const navigateToLogin = () => {
    navigation.navigate(ROUTES.LOGIN);
  };

  const renderInput = (field, placeholder, icon, options = {}) => (
    <View style={styles.fieldContainer}>
      <View style={[globalStyles.inputContainer, errors[field] && styles.inputError]}>
        <Ionicons 
          name={icon} 
          size={20} 
          color={errors[field] ? COLORS.error : COLORS.textMuted} 
          style={globalStyles.inputIcon} 
        />
        <TextInput
          style={globalStyles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textPlaceholder}
          value={formData[field]}
          onChangeText={(value) => updateFormData(field, value)}
          {...options}
        />
        {field === 'password' && (
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
        )}
        {field === 'confirmPassword' && (
          <TouchableOpacity 
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons 
              name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
              size={20} 
              color={COLORS.textMuted} 
            />
          </TouchableOpacity>
        )}
      </View>
      {errors[field] && (
        <Text style={styles.errorText}>{errors[field]}</Text>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={globalStyles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={globalStyles.pageTitle}>SIGN UP</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Personal Info */}
            <Text style={styles.sectionTitle}>Informations personnelles</Text>
            
            {renderInput('firstname', 'Prénom', 'person-outline', {
              autoCapitalize: 'words',
              autoCorrect: false,
            })}
            
            {renderInput('lastname', 'Nom', 'person-outline', {
              autoCapitalize: 'words',
              autoCorrect: false,
            })}
            
            {renderInput('age', 'Âge (optionnel)', 'calendar-outline', {
              keyboardType: 'numeric',
              maxLength: 3,
            })}

            {/* Account Info */}
            <Text style={styles.sectionTitle}>Informations de compte</Text>
            
            {renderInput('username', 'Nom d\'utilisateur', 'at-outline', {
              autoCapitalize: 'none',
              autoCorrect: false,
            })}
            
            {renderInput('email', 'Email', 'mail-outline', {
              keyboardType: 'email-address',
              autoCapitalize: 'none',
              autoCorrect: false,
              autoComplete: 'email',
            })}

            {/* Role Selection */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Type de compte</Text>
              <View style={[globalStyles.inputContainer, styles.pickerContainer]}>
                <Ionicons 
                  name="people-outline" 
                  size={20} 
                  color={COLORS.textMuted} 
                  style={globalStyles.inputIcon} 
                />
                <Picker
                  selectedValue={formData.role}
                  onValueChange={(value) => updateFormData('role', value)}
                  style={styles.picker}
                  dropdownIconColor={COLORS.textMuted}
                >
                  <Picker.Item 
                    label="Utilisateur" 
                    value={USER_ROLES.USER} 
                    color={COLORS.textPrimary}
                  />
                  <Picker.Item 
                    label="Bibliothécaire" 
                    value={USER_ROLES.LIBRARIAN} 
                    color={COLORS.textPrimary}
                  />
                </Picker>
              </View>
            </View>

            {/* Password */}
            <Text style={styles.sectionTitle}>Mot de passe</Text>
            
            {renderInput('password', 'Mot de passe', 'lock-closed-outline', {
              secureTextEntry: !showPassword,
              autoCapitalize: 'none',
              autoCorrect: false,
            })}
            
            {renderInput('confirmPassword', 'Confirmer le mot de passe', 'lock-closed-outline', {
              secureTextEntry: !showConfirmPassword,
              autoCapitalize: 'none',
              autoCorrect: false,
            })}

            {/* Register Button */}
            <TouchableOpacity 
              style={[
                globalStyles.primaryButton, 
                isLoading && styles.buttonDisabled,
                styles.registerButton
              ]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <Text style={globalStyles.primaryButtonText}>
                {isLoading ? 'Inscription...' : 'Sign Up'}
              </Text>
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={navigateToLogin}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
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
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    zIndex: 1,
    padding: SPACING.sm,
  },
  form: {
    width: '100%',
    paddingBottom: SPACING.xl,
  },
  sectionTitle: {
    ...globalStyles.subtitle,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
    paddingBottom: SPACING.sm,
  },
  fieldContainer: {
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: SPACING.sm,
  },
  inputError: {
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: SPACING.xs,
    marginLeft: SPACING.md,
  },
  eyeIcon: {
    padding: SPACING.xs,
  },
  pickerContainer: {
    paddingRight: 0,
  },
  picker: {
    flex: 1,
    color: COLORS.textPrimary,
    marginLeft: -SPACING.sm,
  },
  registerButton: {
    marginTop: SPACING.xl,
  },
  buttonDisabled: {
    backgroundColor: COLORS.surfaceLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  loginText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  loginLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RegisterScreen;