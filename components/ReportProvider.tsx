import React, { createContext, useCallback, useContext, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import firebaseService, { ReportReason, ReportTargetType } from '@/handlers/firebaseService';
import { useAppColors } from '@/hooks/useAppColors';

export interface ReportTarget {
  targetType: ReportTargetType;
  targetId?: string;
  /** Shown in the modal title, e.g. a shop or username. */
  label?: string;
}

const REASONS: { value: ReportReason; label: string }[] = [
  { value: 'scam', label: 'Scam or fraud' },
  { value: 'prohibited_item', label: 'Prohibited or unsafe item' },
  { value: 'offensive', label: 'Offensive content' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'spam', label: 'Spam' },
  { value: 'safety', label: 'Safety concern' },
  { value: 'other', label: 'Something else' },
];

const ReportContext = createContext<(target: ReportTarget) => void>(() => undefined);

/** Opens the global report sheet for a shop, item, user, order, message or general problem. */
export const useReport = () => useContext(ReportContext);

export function ReportProvider({ children }: { children: React.ReactNode }) {
  const colors = useAppColors();
  const [target, setTarget] = useState<ReportTarget | null>(null);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const open = useCallback((next: ReportTarget) => {
    setTarget(next);
    setReason(null);
    setDetails('');
    setAlsoBlock(false);
  }, []);

  const close = () => {
    if (!isSubmitting) setTarget(null);
  };

  const submit = async () => {
    if (!target || !reason) return;
    setIsSubmitting(true);
    try {
      await firebaseService.submitReport({
        targetType: target.targetType,
        targetId: target.targetId,
        reason,
        details,
        alsoBlock: alsoBlock && target.targetType !== 'other',
      });
      setTarget(null);
      Toast.show({
        type: 'success',
        text1: 'Report sent',
        text2: alsoBlock
          ? 'Thanks. We review reports within 24 hours, and you will no longer see this user.'
          : 'Thanks. We review reports within 24 hours.',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Could not send report',
        text2: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const title =
    target?.targetType === 'other'
      ? 'Report a problem'
      : `Report ${target?.label ?? `this ${target?.targetType ?? 'content'}`}`;

  return (
    <ReportContext.Provider value={open}>
      {children}
      <Modal visible={!!target} transparent animationType="slide" onRequestClose={close}>
        <View style={styles.backdrop}>
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                What&apos;s wrong?
              </Text>
              {REASONS.map((option) => {
                const selected = reason === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.reason,
                      {
                        borderColor: selected ? colors.primary : colors.inputBorder,
                        backgroundColor: selected ? colors.buttonPrimaryAlternate : 'transparent',
                      },
                    ]}
                    onPress={() => setReason(option.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    <Text style={[styles.reasonText, { color: colors.text }]}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
              <TextInput
                style={[
                  styles.details,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
                value={details}
                onChangeText={setDetails}
                placeholder="Add details (optional)"
                placeholderTextColor={colors.placeholder}
                multiline
                maxLength={1000}
              />
              {target?.targetType !== 'other' && (
                <View style={styles.blockRow}>
                  <Text style={[styles.reasonText, { color: colors.text, flex: 1 }]}>
                    Also block this user
                  </Text>
                  <Switch value={alsoBlock} onValueChange={setAlsoBlock} />
                </View>
              )}
              <TouchableOpacity
                style={[
                  styles.submit,
                  { backgroundColor: reason ? colors.error : colors.buttonDisabled },
                ]}
                onPress={submit}
                disabled={!reason || isSubmitting}
                accessibilityRole="button"
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.submitText}>Submit report</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancel} onPress={close}>
                <Text style={[styles.reasonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ReportContext.Provider>
  );
}

/** Small flag button that opens the report sheet. */
export function ReportButton({
  target,
  size = 18,
  color,
}: {
  target: ReportTarget;
  size?: number;
  color?: string;
}) {
  const report = useReport();
  const colors = useAppColors();
  return (
    <TouchableOpacity
      onPress={() => report(target)}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={`Report ${target.label ?? target.targetType}`}
    >
      <Ionicons name="flag-outline" size={size} color={color ?? colors.iconMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    maxHeight: '90%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
  },
  title: {
    fontFamily: 'TitanOne',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'TextMeOne',
    fontSize: 16,
    marginBottom: 8,
  },
  reason: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  reasonText: {
    fontFamily: 'TextMeOne',
    fontSize: 16,
  },
  details: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 16,
    marginTop: 4,
  },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  submit: {
    marginTop: 16,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitText: {
    color: '#ffffff',
    fontFamily: 'TextMeOne',
    fontSize: 18,
  },
  cancel: {
    padding: 12,
    alignItems: 'center',
  },
});
