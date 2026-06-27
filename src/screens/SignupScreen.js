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
import { useAuth } from '../context/AuthContext';
const SignupScreen = ({ navigation }) => {
    const { signup } = useAuth();
    const { theme, toggleTheme, colors } = useTheme();
    const isDark = theme === 'dark';
    const { height, width } = Dimensions.get('window');
    const { moderateScale } = getResponsiveValues(width, height);
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
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

    const handleSignup = async () => {
    const newErrors = {};
        if (!name) newErrors.name = 'Full name is required';
        if (!mobile) {
            newErrors.mobile = 'Mobile number is required';
        } else if (!/^[6-9]\d{9}$/.test(mobile)) {
            newErrors.mobile = 'Enter a valid 10-digit Indian mobile number';
        }
        if (!email) newErrors.email = 'Email is required';
        if (!password) newErrors.password = 'Password is required';
        if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        if (!agreeTerms) {
            Alert.alert('Terms & Conditions', 'Please agree to our terms to continue.');
            return;
        }
        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

        setErrors({});
        setIsLoading(true);
        try {
            const formattedMobile = '+91' + mobile;
            await signup(email.trim(), password, name.trim(), formattedMobile);
            navigation.replace('DashboardScreen');
        } catch (e) {
            const msg =
                e.code === 'auth/email-already-in-use'
                    ? 'An account already exists with this email.'
                    : e.code === 'auth/weak-password'
                    ? 'Password must be at least 6 characters.'
                    : e.code === 'auth/invalid-email'
                    ? 'Please enter a valid email address.'
                    : 'Signup failed. Please try again.';
            Alert.alert('Signup Failed', msg);
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
                    contentContainerStyle={[styles.scrollWrapper, { maxWidth: moderateScale(400), alignSelf: 'center', width: '100%' }]}
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

                    {/* SIGNUP CARD */}
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
                            <Text style={[styles.cardTitle, { color: colors.text }]}>Create Account</Text>
                            <Text style={[styles.cardSubtitle, { color: colors.subText }]}>Start designing divine temple architectures</Text>
                        </View>

                        <View style={styles.form}>
                            {/* Full Name */}
                            <View style={getInputStyle('name')}>
                                <Ionicons name="person-outline" size={18} color={errors.name ? '#C42D2D' : (focusedField === 'name' ? colors.primary : colors.subText)} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="Full Name"
                                    value={name}
                                    onChangeText={(val) => { setName(val); setErrors({ ...errors, name: null }); }}
                                    onFocus={() => setFocusedField('name')}
                                    onBlur={() => setFocusedField(null)}
                                    placeholderTextColor={colors.textMuted}
                                />
                            </View>
                            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

                            {/* Mobile Number */}
                            <View style={[getInputStyle('mobile'), { paddingHorizontal: 0, overflow: 'hidden' }]}>
                                <View style={styles.prefixBox}>
                                    <Text style={styles.prefixText}>+91</Text>
                                </View>
                                <TextInput
                                    style={[styles.input, { color: colors.text, paddingHorizontal: 12 }]}
                                    placeholder="Mobile Number"
                                    value={mobile}
                                    onChangeText={(val) => { 
                                        const cleanVal = val.replace(/[^0-9]/g, '');
                                        if (cleanVal.length <= 10) {
                                            setMobile(cleanVal); 
                                            setErrors({ ...errors, mobile: null }); 
                                        }
                                    }}
                                    onFocus={() => setFocusedField('mobile')}
                                    onBlur={() => setFocusedField(null)}
                                    keyboardType="numeric"
                                    placeholderTextColor={colors.textMuted}
                                />
                            </View>
                            {errors.mobile && <Text style={styles.errorText}>{errors.mobile}</Text>}

                            {/* Email */}
                            <View style={getInputStyle('email')}>
                                <Ionicons name="mail-outline" size={18} color={errors.email ? '#C42D2D' : (focusedField === 'email' ? colors.primary : colors.subText)} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="Email Address"
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

                            {/* Password */}
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
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.subText} />
                                </TouchableOpacity>
                            </View>
                            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

                            {/* Confirm Password */}
                            <View style={getInputStyle('confirmPassword')}>
                                <Ionicons name="shield-checkmark-outline" size={18} color={errors.confirmPassword ? '#C42D2D' : (focusedField === 'confirmPassword' ? colors.primary : colors.subText)} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChangeText={(val) => { setConfirmPassword(val); setErrors({ ...errors, confirmPassword: null }); }}
                                    onFocus={() => setFocusedField('confirmPassword')}
                                    onBlur={() => setFocusedField(null)}
                                    secureTextEntry={!showConfirmPassword}
                                    placeholderTextColor={colors.textMuted}
                                />
                                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                                    <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.subText} />
                                </TouchableOpacity>
                            </View>
                            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

                            {/* Terms Checkbox Row */}
                            <TouchableOpacity
                                style={styles.termsWrapper}
                                onPress={() => setAgreeTerms(!agreeTerms)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.checkbox, { borderColor: colors.primary }, agreeTerms && { backgroundColor: colors.primary }]}>
                                    {agreeTerms && <Ionicons name="checkmark" size={14} color="#FFF" />}
                                </View>
                                <Text style={[styles.termsText, { color: colors.subText }]}>I agree to the <Text style={[styles.termsTextBold, { color: colors.text }]}>Terms & Privacy Policy</Text></Text>
                            </TouchableOpacity>

                            {/* Primary Button */}
                            <CustomButton
                                title="Create Account"
                                onPress={handleSignup}
                                loading={isLoading}
                            />

                            <TouchableOpacity
                                style={styles.secondaryAction}
                                onPress={() => navigation.navigate('LoginScreen')}
                            >
                                <Text style={[styles.secondaryText, { color: colors.subText }]}>
                                    Already have an account? <Text style={[styles.goldLink, { color: colors.primary }]}>Login</Text>
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
    scrollWrapper: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 25,
        paddingBottom: 40,
    },
    brandSection: {
        alignItems: 'center',
        marginBottom: 35,
    },
    logoWrapper: {
        width: 90,
        height: 90,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    appName: {
        fontSize: 26,
        fontWeight: '900',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    tagline: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 6,
        opacity: 0.8,
    },
    goldDivider: {
        width: 45,
        height: 3,
        borderRadius: 2,
        marginTop: 15,
    },
    glassCard: {
        alignSelf: 'stretch',
        borderRadius: 32,
        padding: 24,
        width: '100%',
        elevation: 8,
    },
    cardHeader: {
        marginBottom: 25,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    cardSubtitle: {
        fontSize: 14,
        fontWeight: '500',
        marginTop: 4,
    },
    form: {
        gap: 2,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        borderRadius: 16,
        paddingHorizontal: 16,
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    inputWrapperFocused: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        borderRadius: 16,
        paddingHorizontal: 16,
        marginBottom: 12,
        borderWidth: 1.5,
    },
    inputWrapperError: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        borderRadius: 16,
        paddingHorizontal: 16,
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: '#C42D2D',
    },
    inputIcon: {
        marginRight: 12,
        opacity: 0.8,
    },
    input: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
    },
    eyeIcon: {
        padding: 4,
    },
    errorText: {
        color: '#C42D2D',
        fontSize: 11,
        fontWeight: '700',
        marginTop: -8,
        marginBottom: 8,
        marginLeft: 4,
    },
    termsWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 15,
        paddingHorizontal: 4,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 2,
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    termsText: {
        fontSize: 13,
        fontWeight: '500',
    },
    termsTextBold: {
        fontWeight: '700',
    },
    secondaryAction: {
        alignItems: 'center',
        marginTop: 20,
        paddingVertical: 10,
    },
    secondaryText: {
        fontSize: 14,
        fontWeight: '600',
    },
    goldLink: {
        fontWeight: '800',
    },
    prefixBox: {
        backgroundColor: 'rgba(0,0,0,0.06)',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 12,
        borderRightWidth: 1,
        borderRightColor: 'rgba(0,0,0,0.1)',
    },
    prefixText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#666',
    },
});

export default SignupScreen;
