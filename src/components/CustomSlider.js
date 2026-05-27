import React, { useRef } from 'react';
import { StyleSheet, View, PanResponder, Animated } from 'react-native';

const CustomSlider = ({ value, onValueChange, minimumValue = 0, maximumValue = 1, thumbTintColor = '#D4AF37' }) => {
    const sliderWidth = useRef(0);
    const pan = useRef(new Animated.Value(0)).current;

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (evt, gestureState) => {
            const newValue = Math.min(
                maximumValue,
                Math.max(minimumValue, (gestureState.moveX / sliderWidth.current) * (maximumValue - minimumValue))
            );
            onValueChange(newValue);
        },
    });

    return (
        <View 
            style={styles.container} 
            onLayout={(e) => (sliderWidth.current = e.nativeEvent.layout.width)}
            {...panResponder.panHandlers}
        >
            <View style={styles.track}>
                <View 
                    style={[
                        styles.progress, 
                        { width: `${((value - minimumValue) / (maximumValue - minimumValue)) * 100}%`, backgroundColor: thumbTintColor }
                    ]} 
                />
            </View>
            <View 
                style={[
                    styles.thumb, 
                    { left: `${((value - minimumValue) / (maximumValue - minimumValue)) * 100}%`, backgroundColor: thumbTintColor }
                ]} 
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 30,
        justifyContent: 'center',
        width: '100%',
    },
    track: {
        height: 4,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 2,
    },
    progress: {
        height: '100%',
        borderRadius: 2,
    },
    thumb: {
        width: 16,
        height: 16,
        borderRadius: 8,
        position: 'absolute',
        top: 7,
        marginLeft: -8,
        boxShadow: '0px 2px 2px rgba(0,0,0,0.2)',
        elevation: 3,
    },
});

export default CustomSlider;
