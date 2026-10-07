import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useTokens } from '../design-system/tokens';
import { createStyles } from '../design-system/styles';

// Predefined color palette
const COLOR_PALETTE = [
  '#1A1A1A',
  '#333333',
  '#555555',
  '#777777',
  '#999999',
  '#BBBBBB',
  '#DDDDDD',
  '#FFFFFF',
  '#E63946',
  '#F26419',
  '#F8961E',
  '#F9C74F',
  '#90BE6D',
  '#43AA8B',
  '#577590',
  '#277DA1',
  '#FF0000',
  '#FF7F00',
  '#FFFF00',
  '#00FF00',
  '#00FFFF',
  '#0000FF',
  '#8B00FF',
  '#FF00FF',
];

type ColorPickerProps = {
  initialColor: string;
  onColorSelected: (color: string) => void;
  onCancel: () => void;
};

export default function ColorPicker({
  initialColor,
  onColorSelected,
  onCancel,
}: ColorPickerProps) {
  const tokens = useTokens();
  const styles = createStyles(tokens);

  const [color, setColor] = useState(initialColor);
  const [hexInput, setHexInput] = useState(initialColor);

  const handleColorSelect = useCallback((newColor: string) => {
    setColor(newColor);
    setHexInput(newColor);
  }, []);

  const handleHexChange = useCallback((text: string) => {
    setHexInput(text);

    // Validate hex color
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(text)) {
      setColor(text);
    }
  }, []);

  const handleSubmit = useCallback(() => {
    onColorSelected(color);
  }, [color, onColorSelected]);

  return (
    <Modal
      transparent
      animationType="fade"
      visible={true}
      onRequestClose={onCancel}
    >
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
      >
        <View
          style={{
            width: 300,
            backgroundColor: tokens.baseColors.white,
            borderRadius: 12,
            padding: 16,
            shadowColor: tokens.baseColors.black,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <Text style={[styles.subheading, { marginBottom: 16 }]}>
            Choose a color
          </Text>

          {/* Color preview */}
          <View
            style={{
              height: 60,
              backgroundColor: color,
              borderRadius: 6,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: tokens.baseColors.gray3,
            }}
          />

          {/* Hex input */}
          <View style={{ marginBottom: 16 }}>
            <Text style={[styles.bodyText, { marginBottom: 4 }]}>
              Hex color
            </Text>
            <TextInput
              style={[styles.input, { fontFamily: 'monospace' }]}
              value={hexInput}
              onChangeText={handleHexChange}
              placeholder="#RRGGBB"
              autoCapitalize="characters"
            />
          </View>

          {/* Color palette */}
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            {COLOR_PALETTE.map((paletteColor) => (
              <TouchableOpacity
                key={paletteColor}
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: paletteColor,
                  borderRadius: 4,
                  margin: 4,
                  borderWidth: paletteColor === color ? 2 : 0,
                  borderColor: tokens.baseColors.blue,
                }}
                onPress={() => handleColorSelect(paletteColor)}
              />
            ))}
          </View>

          {/* Action buttons */}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <TouchableOpacity
              style={{
                paddingVertical: 8,
                paddingHorizontal: 16,
                marginRight: 8,
              }}
              onPress={onCancel}
            >
              <Text style={{ color: tokens.baseColors.textColor }}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: tokens.baseColors.blue,
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 4,
              }}
              onPress={handleSubmit}
            >
              <Text style={{ color: tokens.baseColors.white }}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
