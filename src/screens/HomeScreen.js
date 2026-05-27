import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const HomeScreen = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar translucent={false} backgroundColor="white" style="dark" />
            <View style={styles.innerContainer}>
                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="checkmark-circle" size={100} color="#d32f2f" />
                    </View>
                    <Text style={styles.welcome}>Welcome to A1 Design</Text>
                    <Text style={styles.title}>Admin Dashboard</Text>
                    <Text style={styles.info}>You have successfully logged into the premium portal.</Text>
                </View>

                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={() => navigation.replace('Login')}
                >
                    <Text style={styles.logoutText}>LOGOUT</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    innerContainer: {
        flex: 1,
        justifyContent: 'space-between',
        padding: 35,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 30,
        boxShadow: '0px 10px 15px rgba(0,0,0,0.2)',
        elevation: 5,
    },
    welcome: {
        fontSize: 18,
        color: '#d32f2f',
        fontWeight: '700',
        marginBottom: 10,
        letterSpacing: 0.5,
    },
    title: {
        fontSize: 34,
        fontWeight: '900',
        color: '#1a1a1a',
        textAlign: 'center',
    },
    info: {
        fontSize: 16,
        color: '#777',
        marginTop: 15,
        textAlign: 'center',
        lineHeight: 24,
    },
    logoutButton: {
        height: 60,
        borderWidth: 2,
        borderColor: '#d32f2f',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    logoutText: {
        color: '#d32f2f',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 1,
    },
});

export default HomeScreen;
