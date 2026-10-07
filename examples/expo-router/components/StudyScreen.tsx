import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { useTokens } from '../design-system/tokens';
import { createStyles } from '../design-system/styles';
import { Ionicons } from '@expo/vector-icons';
import { useAppNavigation } from '../hooks/useAppNavigation';

// Mock vocabulary data for flashcards
const MOCK_VOCABULARY = [
  { id: '1', word: '春', reading: 'はる', meaning: 'spring' },
  { id: '2', word: '散歩', reading: 'さんぽ', meaning: 'walk' },
  { id: '3', word: '鳥', reading: 'とり', meaning: 'bird' },
  { id: '4', word: '花', reading: 'はな', meaning: 'flower' },
  { id: '5', word: '景色', reading: 'けしき', meaning: 'scenery' },
  { id: '6', word: 'ベンチ', reading: 'べんち', meaning: 'bench' },
  { id: '7', word: '平和', reading: 'へいわ', meaning: 'peace' },
];

type StudyScreenProps = {
  passageId: string;
};

export default function StudyScreen({ passageId }: StudyScreenProps) {
  const tokens = useTokens();
  const styles = createStyles(tokens);
  const navigation = useAppNavigation();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [finished, setFinished] = useState(false);

  // In a real app, you'd fetch the flashcards based on passageId.
  const flashcards = MOCK_VOCABULARY;

  // For card animation
  const position = useRef(new Animated.ValueXY()).current;
  const rotate = position.x.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: ['-30deg', '0deg', '30deg'],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > 120) {
          // Swiped right - "Known"
          handleSwipe('right');
        } else if (gesture.dx < -120) {
          // Swiped left - "Still Learning"
          handleSwipe('left');
        } else {
          // Return to center
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: false,
          }).start();
        }
      },
    }),
  ).current;

  const handleSwipe = (direction: 'left' | 'right') => {
    const screenWidth = Dimensions.get('window').width;
    Animated.timing(position, {
      toValue: {
        x: direction === 'right' ? screenWidth + 100 : -screenWidth - 100,
        y: 0,
      },
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      position.setValue({ x: 0, y: 0 });
      setShowMeaning(false);

      if (currentIndex === flashcards.length - 1) {
        setFinished(true);
      } else {
        setCurrentIndex(currentIndex + 1);
      }
    });
  };

  const handleFinish = () => {
    navigation.back();
  };

  const resetCards = () => {
    setCurrentIndex(0);
    setShowMeaning(false);
    setFinished(false);
  };

  const renderFlashcard = () => {
    const card = flashcards[currentIndex];

    return (
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          {
            backgroundColor: tokens.baseColors.white,
            borderRadius: 16,
            padding: 20,
            height: 300,
            width: '100%',
            shadowColor: tokens.baseColors.black,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
            alignItems: 'center',
            justifyContent: 'center',
          },
          {
            transform: [
              { translateX: position.x },
              { translateY: position.y },
              { rotate: rotate },
            ],
          },
        ]}
      >
        {!showMeaning ? (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>{card.word}</Text>
            <Text style={{ fontSize: 24, color: tokens.baseColors.textColor }}>
              {card.reading}
            </Text>
            <TouchableOpacity
              style={{ marginTop: 32 }}
              onPress={() => setShowMeaning(true)}
            >
              <Text style={{ color: tokens.baseColors.blue, fontSize: 16 }}>
                Show Meaning
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 32, marginBottom: 24 }}>
              {card.meaning}
            </Text>
            <TouchableOpacity onPress={() => setShowMeaning(false)}>
              <Text style={{ color: tokens.baseColors.blue, fontSize: 16 }}>
                Show Word
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    );
  };

  const renderFinished = () => (
    <View
      style={{
        backgroundColor: tokens.baseColors.white,
        borderRadius: 16,
        padding: 20,
        height: 300,
        width: '100%',
        shadowColor: tokens.baseColors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons
        name="checkmark-circle"
        size={64}
        color={tokens.baseColors.green}
      />
      <Text style={[styles.heading, { marginTop: 16, textAlign: 'center' }]}>
        Great job!
      </Text>
      <Text
        style={[styles.bodyText, { textAlign: 'center', marginBottom: 24 }]}
      >
        You've completed all the flashcards.
      </Text>
      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: tokens.semanticColors.buttonColor,
              marginRight: 8,
            },
          ]}
          onPress={resetCards}
        >
          <Text style={styles.buttonText}>Start Over</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: tokens.baseColors.blue }]}
          onPress={handleFinish}
        >
          <Text style={[styles.buttonText, { color: tokens.baseColors.white }]}>
            Finish
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { padding: 16 }]}>
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <Text style={styles.heading}>Study Screen</Text>
        {!finished && (
          <Text style={styles.bodyText}>
            Card {currentIndex + 1} of {flashcards.length}
          </Text>
        )}
      </View>

      {finished ? renderFinished() : renderFlashcard()}

      {!finished && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 24,
            width: '100%',
          }}
        >
          <TouchableOpacity
            style={{
              padding: 16,
              backgroundColor: tokens.baseColors.gray3,
              borderRadius: 8,
              alignItems: 'center',
              width: 120,
            }}
            onPress={() => handleSwipe('left')}
          >
            <Text style={{ color: tokens.baseColors.textColor }}>
              Still Learning
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              padding: 16,
              backgroundColor: tokens.baseColors.green,
              borderRadius: 8,
              alignItems: 'center',
              width: 120,
            }}
            onPress={() => handleSwipe('right')}
          >
            <Text style={{ color: tokens.baseColors.white }}>Known</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
