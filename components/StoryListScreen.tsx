import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { useTokens } from '../design-system/tokens';
import { createStyles } from '../design-system/styles';
import { useAppNavigation } from '../hooks/useAppNavigation';

// Mock data for stories
const MOCK_STORIES = [
  {
    id: '1',
    title: 'The Journey',
    coverImage: 'https://via.placeholder.com/150',
    date: '2025-02-15',
    jlptLevel: 'N4',
  },
  {
    id: '2',
    title: 'City Dreams',
    coverImage: 'https://via.placeholder.com/150',
    date: '2025-02-16',
    jlptLevel: 'N3',
  },
  {
    id: '3',
    title: 'Tokyo Night',
    coverImage: 'https://via.placeholder.com/150',
    date: '2025-02-17',
    jlptLevel: 'N4',
  },
  {
    id: '4',
    title: 'Mountain View',
    coverImage: 'https://via.placeholder.com/150',
    date: '2025-02-18',
    jlptLevel: 'N5',
  },
  {
    id: '5',
    title: 'Rain Season',
    coverImage: 'https://via.placeholder.com/150',
    date: '2025-02-19',
    jlptLevel: 'N3',
  },
  {
    id: '6',
    title: 'Summer Festival',
    coverImage: 'https://via.placeholder.com/150',
    date: '2025-02-20',
    jlptLevel: 'N4',
  },
  {
    id: '7',
    title: 'Coffee Shop',
    coverImage: 'https://via.placeholder.com/150',
    date: '2025-02-21',
    jlptLevel: 'N5',
  },
  {
    id: '8',
    title: 'Autumn Leaves',
    coverImage: 'https://via.placeholder.com/150',
    date: '2025-02-22',
    jlptLevel: 'N4',
  },
  {
    id: '9',
    title: 'Winter Snow',
    coverImage: 'https://via.placeholder.com/150',
    date: '2025-02-23',
    jlptLevel: 'N3',
  },
];

export default function StoryListScreen() {
  const tokens = useTokens();
  const styles = createStyles(tokens);
  const navigation = useAppNavigation();

  const handleStoryPress = (id: string) => {
    navigation.push(`/passage/${id}`);
  };

  const renderStoryItem = ({ item }: { item: (typeof MOCK_STORIES)[0] }) => (
    <TouchableOpacity
      style={{
        width: '48%',
        marginBottom: 16,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: tokens.baseColors.white,
        shadowColor: tokens.baseColors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }}
      onPress={() => handleStoryPress(item.id)}
    >
      <Image
        source={{ uri: item.coverImage }}
        style={{
          width: '100%',
          height: 150,
          backgroundColor: tokens.semanticColors.thumbnailBackground,
        }}
        resizeMode="cover"
      />
      <View style={{ padding: 8 }}>
        <Text style={[styles.subheading, { fontSize: 14, marginVertical: 2 }]}>
          {item.title}
        </Text>
        <Text style={{ color: tokens.baseColors.textColor, fontSize: 12 }}>
          JLPT: {item.jlptLevel}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={{ padding: 16 }}>
        <Text style={styles.heading}>Stories</Text>

        <FlatList
          data={MOCK_STORIES}
          renderItem={renderStoryItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
        />

        <TouchableOpacity
          style={[styles.button, { marginTop: 16 }]}
          onPress={() => {}}
        >
          <Text style={styles.buttonText}>Add Story</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
