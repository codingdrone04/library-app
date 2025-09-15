import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles, mixins } from '../styles/globalStyles';
import { COLORS } from '../constants';

const Button = ({ 
  children, 
  onPress, 
  variant = 'primary', 
  size = 'default',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  fullWidth = false,
  ...props 
}) => {
  
  const getButtonStyle = () => {
    let baseStyle;
    
    if (variant === 'secondary') {
      baseStyle = globalStyles.secondaryButton;
    } else {
      baseStyle = globalStyles.primaryButton;
    }
    
    return [
      baseStyle,
      !fullWidth && { alignSelf: 'center' },
      (disabled || loading) && { opacity: 0.6 },
      style
    ];
  };
  
  const getTextStyle = () => {
    if (variant === 'secondary') {
      return [globalStyles.secondaryButtonText, textStyle];
    }
    return [globalStyles.primaryButtonText, textStyle];
  };
  
  const getTextColor = () => {
    if (variant === 'secondary') return COLORS.primary;
    return COLORS.textPrimary;
  };
  
  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="small" color={getTextColor()} />;
    }
    
    if (icon) {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {iconPosition === 'left' && (
            <Ionicons 
              name={icon} 
              size={20} 
              color={getTextColor()}
              style={{ marginRight: 8 }}
            />
          )}
          <Text style={getTextStyle()}>{children}</Text>
          {iconPosition === 'right' && (
            <Ionicons 
              name={icon} 
              size={20} 
              color={getTextColor()}
              style={{ marginLeft: 8 }}
            />
          )}
        </View>
      );
    }
    
    return <Text style={getTextStyle()}>{children}</Text>;
  };
  
  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

export default Button;