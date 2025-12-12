/**
 * Feedback Modal Component for React Native
 * Allows users to submit 1-5 star rating with optional description
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { lightColors, colors, spacing, typography, fontSize } from '@/constants/theme';

interface FeedbackModalProps {
  isOpen: boolean;
  conversationId: string;
  username?: string;
  onClose: () => void;
  onSubmit: (rating: number, description: string) => Promise<void>;
}

const FeedbackModal = ({
  isOpen,
  conversationId,
  username,
  onClose,
  onSubmit,
}: FeedbackModalProps) => {
  const [rating, setRating] = useState<number>(0);
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleStarPress = (value: number) => {
    if (!isSubmitting) {
      setRating(value);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating from 1 to 5 stars');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(rating, description.trim());
      // Reset form
      setRating(0);
      setDescription('');
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit feedback. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setRating(0);
      setDescription('');
      setError(null);
      onClose();
    }
  };

  const getRatingText = (value: number): string => {
    switch (value) {
      case 1:
        return 'Poor';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Very Good';
      case 5:
        return 'Excellent';
      default:
        return '';
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>End Chat Session</Text>
            {!isSubmitting && (
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.description}>
              Your feedback helps us improve. Please rate your chat experience and provide any
              additional comments.
            </Text>

            <View style={styles.ratingSection}>
              <Text style={styles.label}>Rate your experience *</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    style={styles.starButton}
                    onPress={() => handleStarPress(star)}
                    disabled={isSubmitting}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.star,
                        star <= rating ? styles.starFilled : styles.starEmpty,
                      ]}
                    >
                      ★
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {rating > 0 && (
                <Text style={styles.ratingText}>{getRatingText(rating)}</Text>
              )}
            </View>

            <View style={styles.descriptionSection}>
              <Text style={styles.label}>Additional Comments (optional)</Text>
              <TextInput
                style={styles.textarea}
                value={description}
                onChangeText={setDescription}
                placeholder="Tell us about your experience..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={5}
                maxLength={1000}
                editable={!isSubmitting}
                textAlignVertical="top"
              />
              <Text style={styles.characterCount}>{description.length}/1000 characters</Text>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.submitButton,
                (isSubmitting || rating === 0) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting || rating === 0}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Submit & End Chat</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[5],
  },
  container: {
    backgroundColor: lightColors.surface,
    borderRadius: spacing[4],
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    ...Platform.select({
      ios: {
        shadowColor: lightColors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: lightColors.border,
  },
  headerTitle: {
    fontSize: fontSize['5xl'],
    fontFamily: typography.h4.fontFamily,
    fontWeight: 'bold',
    color: lightColors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: lightColors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: fontSize['2xl'],
    color: lightColors.textSecondary,
    lineHeight: 24,
  },
  content: {
    padding: spacing[5],
    maxHeight: 400,
  },
  description: {
    fontSize: fontSize.sm,
    fontFamily: typography.body.fontFamily,
    color: lightColors.textSecondary,
    marginBottom: spacing[6],
    lineHeight: 20,
  },
  ratingSection: {
    marginBottom: spacing[6],
  },
  label: {
    fontSize: fontSize.base,
    fontFamily: typography.label.fontFamily,
    fontWeight: '600',
    color: lightColors.text,
    marginBottom: spacing[3],
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  starButton: {
    padding: spacing[2],
  },
  star: {
    fontSize: 40,
  },
  starFilled: {
    color: colors.warning[500],
  },
  starEmpty: {
    color: lightColors.border,
  },
  ratingText: {
    fontSize: fontSize.base,
    fontFamily: typography.label.fontFamily,
    fontWeight: '600',
    color: colors.primary[500],
    textAlign: 'center',
    marginTop: spacing[2],
  },
  descriptionSection: {
    marginBottom: spacing[6],
  },
  textarea: {
    borderWidth: 1,
    borderColor: lightColors.border,
    borderRadius: spacing[2],
    padding: spacing[3],
    fontSize: fontSize.sm,
    fontFamily: typography.body.fontFamily,
    color: lightColors.text,
    minHeight: 100,
    marginBottom: spacing[2],
  },
  characterCount: {
    fontSize: fontSize.xs,
    color: lightColors.textTertiary,
    textAlign: 'right',
  },
  errorContainer: {
    backgroundColor: colors.error[50],
    padding: spacing[3],
    borderRadius: spacing[2],
    marginBottom: spacing[4],
  },
  errorText: {
    color: colors.error[600],
    fontSize: fontSize.sm,
    fontFamily: typography.body.fontFamily,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing[5],
    borderTopWidth: 1,
    borderTopColor: lightColors.border,
    gap: spacing[3],
  },
  button: {
    flex: 1,
    paddingVertical: spacing[3.5],
    borderRadius: spacing[2],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: lightColors.surfaceVariant,
  },
  cancelButtonText: {
    color: lightColors.textSecondary,
    fontSize: fontSize.base,
    fontFamily: typography.button.fontFamily,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.primary[500],
  },
  submitButtonDisabled: {
    backgroundColor: colors.neutral[400],
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.neutral[0],
    fontSize: fontSize.base,
    fontFamily: typography.button.fontFamily,
    fontWeight: '600',
  },
});

export default FeedbackModal;

