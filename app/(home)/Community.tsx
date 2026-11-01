import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import firebaseService from '@/handlers/firebaseService';
import { OutlinedTitle } from '@/components/OutlinedTitle';
import { useAppColors } from '@/hooks/useAppColors';
import { useLocation, useUser } from '@/store/reduxHooks';

const COMING_SOON = [
  { icon: 'chatbubbles-outline', text: 'Discussion threads about local growing' },
  { icon: 'calendar-outline', text: 'Nearby farmers market dates and locations' },
  { icon: 'document-text-outline', text: 'Cottage food laws for your state' },
  { icon: 'leaf-outline', text: 'Seasonal planting and harvest guides' },
] as const;

const DEFAULT_THRESHOLD = 100;

export default function Community() {
  const colors = useAppColors();
  const { userData } = useUser();
  const { locationData } = useLocation();
  const zipPrefix = (locationData.zipCode || userData?.location?.zip || '').substring(0, 2);
  const [members, setMembers] = useState<number | null>(null);
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!zipPrefix) return;
    setError(false);
    try {
      const stats = await firebaseService.getCommunityStats(zipPrefix);
      setMembers(stats.members);
      setThreshold(stats.threshold);
    } catch {
      setError(true);
    }
  }, [zipPrefix]);

  useEffect(() => {
    void load();
  }, [load]);

  const progress = members === null ? 0 : Math.min(members / threshold, 1);
  const remaining = members === null ? null : Math.max(threshold - members, 0);

  const invite = () =>
    Share.share({
      message:
        'Join me on Neighborfood, the digital farmers market for our neighborhood! https://neighborfood.store',
    });

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
    >
      <OutlinedTitle style={styles.title}>community</OutlinedTitle>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="lock-closed-outline" size={48} color={colors.icon} />
        <Text style={[styles.headline, { color: colors.text }]}>
          Unlocks at {threshold} community members
        </Text>
        {!zipPrefix ? (
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            Set your location to see how close your market is.
          </Text>
        ) : members === null && !error ? (
          <ActivityIndicator color={colors.primary} />
        ) : error ? (
          <TouchableOpacity onPress={load}>
            <Text style={[styles.body, { color: colors.error }]}>
              Couldn&apos;t load member count. Tap to retry.
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            <View
              style={[styles.track, { backgroundColor: colors.inputBackground }]}
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: threshold, now: members ?? 0 }}
            >
              <View
                style={[
                  styles.fill,
                  { width: `${progress * 100}%`, backgroundColor: colors.primary },
                ]}
              />
            </View>
            <Text style={[styles.body, { color: colors.text }]}>
              {members} of {threshold} neighbors have joined your market
            </Text>
            {remaining ? (
              <Text style={[styles.body, { color: colors.textSecondary }]}>
                {remaining} more to go. Invite your neighbors to unlock it sooner!
              </Text>
            ) : null}
          </>
        )}
      </View>

      <Text style={[styles.subtitle, { color: colors.text }]}>What&apos;s coming</Text>
      {COMING_SOON.map((feature) => (
        <View key={feature.text} style={styles.featureRow}>
          <Ionicons name={feature.icon} size={24} color={colors.icon} />
          <Text style={[styles.body, styles.featureText, { color: colors.text }]}>
            {feature.text}
          </Text>
        </View>
      ))}

      <TouchableOpacity
        style={[styles.invite, { backgroundColor: colors.buttonPrimary }]}
        onPress={invite}
        accessibilityRole="button"
      >
        <Ionicons name="share-social-outline" size={20} color={colors.buttonText} />
        <Text style={[styles.inviteText, { color: colors.buttonText }]}>Invite neighbors</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 50 : 70,
    paddingBottom: 140,
    gap: 12,
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
  },
  title: {
    fontFamily: 'TitanOne',
    fontSize: Platform.OS === 'web' ? 80 : 30,
    textAlign: 'center',
  },
  card: {
    alignItems: 'center',
    gap: 12,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  headline: {
    fontFamily: 'TitanOne',
    fontSize: 22,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'TitanOne',
    fontSize: 20,
    marginTop: 12,
  },
  body: {
    fontFamily: 'TextMeOne',
    fontSize: 17,
    textAlign: 'center',
  },
  track: {
    width: '100%',
    height: 14,
    borderRadius: 7,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 7,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    textAlign: 'left',
    flex: 1,
  },
  invite: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
  },
  inviteText: {
    fontFamily: 'TextMeOne',
    fontSize: 18,
  },
});
