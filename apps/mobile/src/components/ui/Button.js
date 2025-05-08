import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  View
} from 'react-native';
import AppConfig from '../../config/app';

/**
 * Componente Button riutilizzabile con vari stili
 * @param {string} variant - 'primary', 'secondary', 'outline', 'text'
 * @param {function} onPress - Funzione da eseguire al click
 * @param {boolean} loading - Mostra un indicatore di caricamento
 * @param {boolean} disabled - Disabilita il pulsante
 */
const Button = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  loading = false, 
  disabled = false,
  style,
  textStyle,
  ...props 
}) => {
  // Determina gli stili in base alla variante
  const getButtonStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.primaryButton;
      case 'secondary':
        return styles.secondaryButton;
      case 'outline':
        return styles.outlineButton;
      case 'text':
        return styles.textButton;
      default:
        return styles.primaryButton;
    }
  };

  // Determina gli stili del testo in base alla variante
  const getTextStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.primaryText;
      case 'secondary':
        return styles.secondaryText;
      case 'outline':
        return styles.outlineText;
      case 'text':
        return styles.textButtonText;
      default:
        return styles.primaryText;
    }
  };

  // Stile quando il pulsante è disabilitato
  const disabledStyle = disabled ? styles.disabledButton : {};
  const disabledTextStyle = disabled ? styles.disabledText : {};

  return (
    <TouchableOpacity
      style={[styles.button, getButtonStyle(), disabledStyle, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'outline' || variant === 'text' 
            ? AppConfig.theme.dark.accent 
            : '#fff'} 
          size="small"
        />
      ) : (
        <Text style={[getTextStyle(), disabledTextStyle, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    flexDirection: 'row',
  },
  // Stili varianti pulsante
  primaryButton: {
    backgroundColor: AppConfig.theme.dark.accent,
  },
  secondaryButton: {
    backgroundColor: AppConfig.theme.dark.secondary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: AppConfig.theme.dark.accent,
  },
  textButton: {
    backgroundColor: 'transparent',
    paddingVertical: 8,
    height: 'auto',
  },
  // Stili testo
  primaryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryText: {
    color: AppConfig.theme.dark.text,
    fontWeight: '600',
    fontSize: 16,
  },
  outlineText: {
    color: AppConfig.theme.dark.accent,
    fontWeight: '600',
    fontSize: 16,
  },
  textButtonText: {
    color: AppConfig.theme.dark.accent,
    fontWeight: '600',
    fontSize: 16,
  },
  // Stili disabled
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },
});

export default Button; 