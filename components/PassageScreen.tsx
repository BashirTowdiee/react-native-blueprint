import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useTokens } from '../design-system/tokens';
import { createStyles } from '../design-system/styles';
import { Ionicons } from '@expo/vector-icons';
import { useAppNavigation } from '../hooks/useAppNavigation';

// Mock data for a specific passage
const MOCK_PASSAGE = {
  id: '1',
  title: 'The Journey',
  coverImage: 'https://via.placeholder.com/300',
  date: '2025-02-15',
  jlptLevel: 'N4',
  japaneseText: `春の朝、私は公園へ散歩に行きました。\n
空は青くて、鳥たちが楽しそうに歌っていました。\n
花も咲いていて、とても美しい景色でした。\n
ベンチに座って、本を読みながら、コーヒーを飲みました。\n
とても平和な時間を過ごしました。`,
  translation: `On a spring morning, I went for a walk in the park.\n
The sky was blue, and birds were singing happily.\n
Flowers were blooming, and it was a very beautiful scenery.\n
I sat on a bench, reading a book and drinking coffee.\n
I spent a very peaceful time.`,
  vocabulary: [
    { word: '春', reading: 'はる', meaning: 'spring' },
    { word: '散歩', reading: 'さんぽ', meaning: 'walk' },
    { word: '鳥', reading: 'とり', meaning: 'bird' },
    { word: '花', reading: 'はな', meaning: 'flower' },
    { word: '景色', reading: 'けしき', meaning: 'scenery' },
    { word: 'ベンチ', reading: 'べんち', meaning: 'bench' },
    { word: '平和', reading: 'へいわ', meaning: 'peace' },
  ],
};

type PassageScreenProps = {
  passageId: string;
};

export default function PassageScreen({
  passageId,
}: PassageScreenProps) {
  const tokens = useTokens();
  const styles = createStyles(tokens);
  const navigation = useAppNavigation();
  const [showTranslation, setShowTranslation] = useState(false);

  // In a real app, you'd fetch the story based on passageId.
  const passage = MOCK_PASSAGE;

  const handleStudyPress = () => {
    navigation.push(`/study/${passageId}`);
  };

  const handlePlayAudio = () => {
    // In a real app, this would trigger audio playback
    console.log('Playing audio for passage');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Image
            source={{ uri: passage.coverImage }}
            style={{
              width: '100%',
              height: 200,
              borderRadius: 8,
              marginBottom: 16,
              backgroundColor: tokens.semanticColors.thumbnailBackground,
            }}
            resizeMode="cover"
          />

          <Text style={styles.heading}>{passage.title}</Text>
          <Text style={[styles.bodyText, { textAlign: 'center' }]}>
            JLPT Level: {passage.jlptLevel}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: tokens.baseColors.white,
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: tokens.baseColors.gray3,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <Text style={[styles.subheading, { flex: 1 }]}>Japanese Text</Text>
            <TouchableOpacity onPress={handlePlayAudio}>
              <Ionicons
                name="play-circle-outline"
                size={24}
                color={tokens.baseColors.blue}
              />
            </TouchableOpacity>
          </View>

          <Text style={[styles.bodyText, { lineHeight: 24, fontSize: 18 }]}>
            {passage.japaneseText}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            {
              marginBottom: 16,
              backgroundColor: showTranslation
                ? tokens.baseColors.blue
                : tokens.semanticColors.buttonColor,
            },
          ]}
          onPress={() => setShowTranslation(!showTranslation)}
        >
          <Text
            style={[
              styles.buttonText,
              showTranslation ? { color: tokens.baseColors.white } : {},
            ]}
          >
            {showTranslation ? 'Hide Translation' : 'Show Translation'}
          </Text>
        </TouchableOpacity>

        {showTranslation && (
          <View
            style={{
              backgroundColor: tokens.baseColors.white,
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: tokens.baseColors.gray3,
            }}
          >
            <Text style={styles.subheading}>Translation</Text>
            <Text style={[styles.bodyText, { lineHeight: 24 }]}>
              {passage.translation}
            </Text>
          </View>
        )}

        <View
          style={{
            backgroundColor: tokens.baseColors.white,
            borderRadius: 8,
            padding: 16,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: tokens.baseColors.gray3,
          }}
        >
          <Text style={styles.subheading}>Vocabulary</Text>

          {passage.vocabulary.map((item, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                marginVertical: 8,
                paddingBottom: 8,
                borderBottomWidth:
                  index < passage.vocabulary.length - 1 ? 1 : 0,
                borderBottomColor: tokens.baseColors.gray3,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.bodyText, { fontWeight: 'bold' }]}>
                  {item.word}
                </Text>
                <Text style={styles.bodyText}>{item.reading}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bodyText}>{item.meaning}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: tokens.baseColors.green }]}
          onPress={handleStudyPress}
        >
          <Text style={[styles.buttonText, { color: tokens.baseColors.white }]}>
            Study with Flashcards
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
