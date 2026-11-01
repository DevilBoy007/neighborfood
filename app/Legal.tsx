import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { LegalDocument, LegalDocuments, openLegalDocument } from '@/constants/Legal';
import { useAppColors } from '@/hooks/useAppColors';

export default function Legal() {
  const colors = useAppColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Text style={[styles.backText, { color: colors.text }]}>{'\u2039'} back</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: colors.text }]}>Legal</Text>
      {(Object.keys(LegalDocuments) as LegalDocument[]).map((key) => (
        <TouchableOpacity
          key={key}
          style={[styles.item, { backgroundColor: colors.buttonPrimary }]}
          onPress={() => openLegalDocument(key)}
          accessibilityRole="link"
        >
          <Text style={[styles.itemText, { color: colors.buttonText }]}>
            {LegalDocuments[key].title}
          </Text>
        </TouchableOpacity>
      ))}
      <Text style={[styles.footer, { color: colors.textSecondary }]}>
        Neighborfood, LLC {'\u00b7'} dylan@bakr.dev
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 70,
    gap: 12,
  },
  back: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
  },
  backText: {
    fontFamily: 'TextMeOne',
    fontSize: 18,
  },
  title: {
    fontFamily: 'TitanOne',
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 12,
  },
  item: {
    padding: 18,
    borderRadius: 10,
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  },
  itemText: {
    textAlign: 'center',
    fontFamily: 'TextMeOne',
    fontSize: 20,
  },
  footer: {
    marginTop: 'auto',
    marginBottom: 30,
    textAlign: 'center',
    fontFamily: 'TextMeOne',
    fontSize: 14,
  },
});
