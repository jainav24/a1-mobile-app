import React, { useState } from 'react';
import { 
    StyleSheet, 
    View, 
    Text, 
    Modal, 
    TextInput, 
    TouchableOpacity, 
    KeyboardAvoidingView, 
    Platform, 
    TouchableWithoutFeedback, 
    Keyboard,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ChangePasswordModal = ({ visible, onClose, colors }) => {
    const [oldPass, setOldPass] = useState('');
    const [newPass, setNewPass] = useState('');

    const handleSubmit = () => {
        if (!oldPass || !newPass) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }
        
        Alert.alert(
            'Success', 
            'Password updated successfully!',
            [{ text: 'OK', onPress: () => {
                setOldPass('');
                setNewPass('');
                onClose();
            }}]
        );
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.centeredView}>
                    <KeyboardAvoidingView 
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalViewContainer}
                    >
                        <View style={[styles.modalView, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>Change Password</Text>
                                <TouchableOpacity onPress={onClose}>
                                    <Ionicons name="close" size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.inputLabel, { color: colors.subText }]}>Current Password</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                                    value={oldPass}
                                    onChangeText={setOldPass}
                                    placeholder="Enter current password"
                                    placeholderTextColor={colors.textMuted}
                                    secureTextEntry
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.inputLabel, { color: colors.subText }]}>New Password</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                                    value={newPass}
                                    onChangeText={setNewPass}
                                    placeholder="Enter new password"
                                    placeholderTextColor={colors.textMuted}
                                    secureTextEntry
                                />
                            </View>

                            <TouchableOpacity 
                                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                                onPress={handleSubmit}
                            >
                                <Text style={styles.submitBtnText}>Update Password</Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalViewContainer: {
        width: '100%',
    },
    modalView: {
        width: '100%',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        boxShadow: '0px 4px 10px rgba(0,0,0,0.2)',
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '900',
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        height: 54,
        borderRadius: 16,
        paddingHorizontal: 16,
        fontSize: 16,
        fontWeight: '600',
        borderWidth: 1,
    },
    submitBtn: {
        height: 54,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    submitBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
    },
});

export default ChangePasswordModal;
