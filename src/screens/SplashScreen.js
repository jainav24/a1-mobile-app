import React, { useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    Image,
    Animated,
    Dimensions,
    StatusBar,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [imageError, setImageError] = React.useState(false);

    useEffect(() => {
        // Fade in logo
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
        }).start();

        // Navigate to Login after 2 seconds
        const timer = setTimeout(() => {
            navigation.replace('LoginScreen');
        }, 2000);

        return () => clearTimeout(timer);
    }, [fadeAnim, navigation]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={colors.statusBar} />
            <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] }}>
                {!imageError ? (
                    <Image
                        source={require('../../assets/a1logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <View style={[styles.fallbackLogo, { backgroundColor: colors.inputBg }]}>
                        <Ionicons name="home" size={60} color={colors.primary} />
                    </View>
                )}
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: width * 0.5,
        height: width * 0.5,
    },
    fallbackLogo: {
        width: 120,
        height: 120,
        backgroundColor: '#F5F5F7',
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default SplashScreen;
