import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppConfig from '../../config/app';

/**
 * Componente Input riutilizzabile
 * @param {string} label - Etichetta dell'input
 * @param {string} value - Valore dell'input
 * @param {function} onChangeText - Callback quando il testo cambia
 * @param {boolean} secureTextEntry - Se true, nasconde il testo inserito
 * @param {string} error - Messaggio di errore
 */
const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error,
  style,
  inputStyle,
  autoCapitalize = 'none',
  keyboardType = 'default',
  iconName,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused,
        error && styles.inputContainerError
      ]}>
        {iconName && (
          <Ionicons
            name={iconName}
            size={18}
            color={isFocused ? AppConfig.theme.dark.accent : AppConfig.theme.dark.textSecondary}
            style={styles.icon}
          />
        )}
        
        <TextInput
          style={[styles.input, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={AppConfig.theme.dark.textSecondary}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {secureTextEntry && (
          <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
            <Ionicons
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={22}
              color={AppConfig.theme.dark.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    color: AppConfig.theme.dark.text,
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppConfig.theme.dark.secondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 12,
  },
  inputContainerFocused: {
    borderColor: AppConfig.theme.dark.accent,
  },
  inputContainerError: {
    borderColor: AppConfig.theme.dark.error,
  },
  input: {
    flex: 1,
    color: AppConfig.theme.dark.text,
    fontSize: 16,
    paddingVertical: 12,
  },
  icon: {
    marginRight: 10,
  },
  eyeIcon: {
    padding: 5,
  },
  errorText: {
    color: AppConfig.theme.dark.error,
    fontSize: 12,
    marginTop: 4,
  },
});

export default Input; 