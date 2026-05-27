import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

const lightTheme = {
    background: '#F8F9FB',
    card: '#FFFFFF',
    text: '#1C1C1E',
    subText: '#8E8E93',
    textMuted: '#C7C7CC',
    textSecondary: '#3A3A3C',
    primary: '#D4AF37',
    border: 'rgba(0,0,0,0.06)',
    inputBg: '#F2F2F7',
    overlayLight: 'rgba(255,255,255,0.85)',
    overlayMid: 'rgba(255,255,255,0.6)',
    overlayStrong: 'rgba(255,255,255,0.95)',
    statusBar: 'dark-content',
    switchTrack: '#E5E5EA',
};

const darkTheme = {
    background: '#000000',
    card: '#1C1C1E',
    text: '#FFFFFF',
    subText: '#8E8E93',
    textMuted: '#636366',
    textSecondary: '#AEAEB2',
    primary: '#D4AF37',
    border: 'rgba(255,255,255,0.1)',
    inputBg: '#2C2C2E',
    overlayLight: 'rgba(0,0,0,0.85)',
    overlayMid: 'rgba(0,0,0,0.6)',
    overlayStrong: 'rgba(0,0,0,0.95)',
    statusBar: 'light-content',
    switchTrack: '#39393D',
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        AsyncStorage.getItem('appTheme').then((saved) => {
            if (saved === 'dark' || saved === 'light') {
                setTheme(saved);
            }
        });
    }, []);

    const toggleTheme = async () => {
        const next = theme === 'light' ? 'dark' : 'light';
        setTheme(next);
        await AsyncStorage.setItem('appTheme', next);
    };

    const colors = theme === 'dark' ? darkTheme : lightTheme;

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
