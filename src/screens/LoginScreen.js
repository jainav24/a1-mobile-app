import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  StatusBar,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import CustomButton from '../components/CustomButton';
import { getResponsiveValues } from '../utils/responsive';
import { auth } from '../../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
const LoginScreen = ({ navigation }) => {
  const { theme, toggleTheme, colors } = useTheme();
  const isDark = theme === 'dark';
  const { height, width } = Dimensions.get('window');
  const { moderateScale } = getResponsiveValues(width, height);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [errors, setErrors] = useState({});

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    const newErrors = {};
    if (!email) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setErrors({});
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigation.replace('DashboardScreen');
    } catch (e) {
      const msg =
        e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password'
          ? 'Invalid email or password.'
          : e.code === 'auth/user-not-found'
          ? 'No account found with this email.'
          : e.code === 'auth/too-many-requests'
          ? 'Too many attempts. Try again later.'
          : 'Login failed. Please try again.';
      Alert.alert('Login Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const getInputStyle = (fieldName) => {
    const baseStyle = { backgroundColor: colors.inputBg };
    if (errors[fieldName]) return [styles.inputWrapperError, baseStyle];
    if (focusedField === fieldName) return [styles.inputWrapperFocused, baseStyle, { borderColor: colors.primary }];
    return [styles.inputWrapper, baseStyle];
  };

  const content = (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={toggleTheme}
          style={[styles.themeToggle, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
        >
          <Ionicons
            name={isDark ? "sunny" : "moon"}
            size={20}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { maxWidth: moderateScale(400), alignSelf: 'center', width: '100%' }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* TOP BRAND SECTION */}
          <Animated.View style={[styles.brandSection, { opacity: fadeAnim }]}>
            <View style={styles.logoWrapper}>
              <Image
                source={require('../../assets/a1logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.appName, { color: colors.text }]}>A1 Temple Studio</Text>
            <Text style={[styles.tagline, { color: colors.subText }]}>Design sacred spaces with precision</Text>
            <View style={[styles.goldDivider, { backgroundColor: colors.primary }]} />
          </Animated.View>

          {/* LOGIN CARD */}
          <Animated.View
            style={[
              styles.glassCard,
              {
                backgroundColor: colors.card,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                borderColor: colors.border,
                borderWidth: 1
              }
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Welcome Back</Text>
              <Text style={[styles.cardSubtitle, { color: colors.subText }]}>Continue your temple design journey</Text>
            </View>

            <View style={styles.form}>
              {/* Email Field */}
              <View style={getInputStyle('email')}>
                <Ionicons name="mail-outline" size={18} color={errors.email ? '#C42D2D' : (focusedField === 'email' ? colors.primary : colors.subText)} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Email"
                  value={email}
                  onChangeText={(val) => { setEmail(val); setErrors({ ...errors, email: null }); }}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

              {/* Password Field */}
              <View style={getInputStyle('password')}>
                <Ionicons name="lock-closed-outline" size={18} color={errors.password ? '#C42D2D' : (focusedField === 'password' ? colors.primary : colors.subText)} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Password"
                  value={password}
                  onChangeText={(val) => { setPassword(val); setErrors({ ...errors, password: null }); }}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  secureTextEntry={!showPassword}
                  placeholderTextColor={colors.textMuted}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.subText}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

              <TouchableOpacity style={styles.forgotBtn}>
                <Text style={[styles.forgotText, { color: colors.subText }]}>Forgot password?</Text>
              </TouchableOpacity>

              {/* Primary Button */}
              <CustomButton
                title="Login"
                onPress={handleLogin}
                loading={isLoading}
              />

              <TouchableOpacity
                style={styles.secondaryAction}
                onPress={() => navigation.navigate('SignupScreen')}
              >
                <Text style={[styles.secondaryText, { color: colors.subText }]}>
                  New to A1? <Text style={[styles.goldLink, { color: colors.primary }]}>Create Account</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} />
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight + 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 10,
  },
  themeToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 25,
    paddingBottom: 40,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoWrapper: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  appName: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tagline: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 6,
    opacity: 0.8,
  },
  goldDivider: {
    width: 50,
    height: 3,
    marginTop: 15,
    borderRadius: 2,
  },
  glassCard: {
    alignSelf: 'stretch',
    width: '100%',
    borderRadius: 30,
    padding: 25,
    boxShadow: '0px 10px 15px rgba(0,0,0,0.1)',
    elevation: 10,
  },
  cardHeader: {
    marginBottom: 30,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  form: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 60,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputWrapperFocused: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 60,
    marginBottom: 16,
    borderWidth: 1.5,
  },
  inputWrapperError: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 60,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#C42D2D',
  },
  errorText: {
    color: '#C42D2D',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
    marginBottom: 12,
    marginTop: -10,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    fontWeight: '600',
  },
  eyeIcon: {
    padding: 8,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    paddingVertical: 5,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryAction: {
    marginTop: 25,
    alignItems: 'center',
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: '600',
  },
  goldLink: {
    fontWeight: '800',
  },
});

export default LoginScreen;
