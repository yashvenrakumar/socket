/**
 * Home Screen - Entry point for joining conversations
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { APP_CONFIG } from '@/constants/config';
import { lightColors, colors, spacing, typography, fontSize } from '@/constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const [conversationId, setConversationId] = useState('');
  const [username, setUsername] = useState('');

  const handleJoinConversation = () => {
    if (!conversationId.trim() || !username.trim()) {
      Alert.alert('Error', 'Please enter both username and conversation ID');
      return;
    }

    router.push({
      pathname: '/chat',
      params: {
        conversationId: conversationId.trim(),
        username: username.trim(),
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Socket Chat</Text>
          <Text style={styles.subtitle}>Join a conversation to start chatting</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Enter your username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Enter conversation ID (e.g., 123, 234, 555)"
            value={conversationId}
            onChangeText={setConversationId}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.button, (!conversationId.trim() || !username.trim()) && styles.buttonDisabled]}
            onPress={handleJoinConversation}
            disabled={!conversationId.trim() || !username.trim()}
          >
            <Text style={styles.buttonText}>Join Conversation</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.examples}>
          <Text style={styles.exampleTitle}>Example conversation IDs:</Text>
          <View style={styles.exampleButtons}>
            {['123', '234', '555'].map((id) => (
              <TouchableOpacity
                key={id}
                style={styles.exampleButton}
                onPress={() => setConversationId(id)}
              >
                <Text style={styles.exampleButtonText}>{id}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Connection Info</Text>
          <Text style={styles.infoText}>Server: {APP_CONFIG.socketUrl}</Text>
          {APP_CONFIG.socketUrl.includes('localhost') && (
            <Text style={styles.warningText}>
              ⚠️ localhost only works on simulator/emulator{'\n'}
              For physical devices, use your computer's IP address
            </Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightColors.background,
  },
  content: {
    flexGrow: 1,
    padding: spacing[5],
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing[10],
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize['8xl'],
    fontFamily: typography.displayLarge.fontFamily,
    fontWeight: 'bold',
    color: colors.primary[500],
    marginBottom: spacing[2.5],
  },
  subtitle: {
    fontSize: fontSize.base,
    fontFamily: typography.body.fontFamily,
    color: lightColors.textSecondary,
    textAlign: 'center',
  },
  form: {
    marginBottom: spacing[7.5],
  },
  input: {
    backgroundColor: lightColors.surface,
    borderRadius: spacing[3],
    padding: spacing[4],
    fontSize: fontSize.base,
    fontFamily: typography.body.fontFamily,
    color: lightColors.text,
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: lightColors.border,
  },
  button: {
    backgroundColor: colors.primary[500],
    borderRadius: spacing[3],
    padding: spacing[4],
    alignItems: 'center',
    marginTop: spacing[2.5],
  },
  buttonDisabled: {
    backgroundColor: colors.neutral[400],
    opacity: 0.6,
  },
  buttonText: {
    color: colors.neutral[0],
    fontSize: fontSize.base,
    fontFamily: typography.button.fontFamily,
    fontWeight: '600',
  },
  examples: {
    marginTop: spacing[5],
  },
  exampleTitle: {
    fontSize: fontSize.sm,
    fontFamily: typography.body.fontFamily,
    color: lightColors.textSecondary,
    marginBottom: spacing[2.5],
    textAlign: 'center',
  },
  exampleButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[2.5],
  },
  exampleButton: {
    backgroundColor: lightColors.surface,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2.5],
    borderRadius: spacing[2],
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  exampleButtonText: {
    color: colors.primary[500],
    fontFamily: typography.button.fontFamily,
    fontWeight: '600',
  },
  infoBox: {
    marginTop: spacing[7.5],
    padding: spacing[4],
    backgroundColor: lightColors.surface,
    borderRadius: spacing[3],
    borderWidth: 1,
    borderColor: lightColors.border,
  },
  infoTitle: {
    fontSize: fontSize.sm,
    fontFamily: typography.label.fontFamily,
    fontWeight: '600',
    color: lightColors.text,
    marginBottom: spacing[2],
  },
  infoText: {
    fontSize: fontSize.xs,
    fontFamily: typography.body.fontFamily,
    color: lightColors.textSecondary,
    marginBottom: spacing[1],
  },
  warningText: {
    fontSize: fontSize.xs,
    fontFamily: typography.body.fontFamily,
    color: colors.warning[600],
    marginTop: spacing[2],
    fontStyle: 'italic',
  },
});

