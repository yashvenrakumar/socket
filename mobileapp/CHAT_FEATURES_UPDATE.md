# Chat Screen Feature Implementation Guide

This document outlines all the features from the frontend ChatWindow.tsx that need to be implemented in the mobile app's chat.tsx.

## ✅ Already Implemented
- Basic chat functionality
- File/image sending
- Connection status
- Room joining/leaving

## 🔄 Features to Add

### 1. Load Previous Messages from Database
**Location**: Before socket connection in `initializeConnection`
```typescript
// Convert StoredChatMessage to ChatMessage
const convertStoredMessageToChatMessage = (storedMsg: StoredChatMessage, currentSocketId: string | null): ChatMessage => {
  let messageType: MessageType = 'text';
  let fileAttachment: FileAttachment | undefined;
  let linkPreview: { url: string } | undefined;

  if (storedMsg.file) {
    messageType = isImageFile(storedMsg.file.name) ? 'image' : 'file';
    fileAttachment = {
      id: storedMsg.file.id,
      name: storedMsg.file.name,
      type: storedMsg.file.type,
      size: storedMsg.file.size,
      url: storedMsg.file.url,
      thumbnailUrl: storedMsg.file.thumbnailUrl,
    };
  } else if (hasLink(storedMsg.message)) {
    const firstLink = getFirstLink(storedMsg.message);
    if (firstLink) {
      linkPreview = { url: firstLink };
    }
  }

  const isCurrentUser = storedMsg.socketId === currentSocketId;

  return {
    id: storedMsg.id,
    type: messageType,
    text: storedMsg.message,
    sender: isCurrentUser ? 'user' : 'other',
    timestamp: new Date(storedMsg.timestamp),
    username: storedMsg.username,
    socketId: storedMsg.socketId,
    file: fileAttachment,
    linkPreview: linkPreview as any,
  };
};

// Load previous messages
const loadPreviousMessages = async () => {
  if (messagesLoadedRef.current) return;
  
  try {
    const conversation = await apiService.getConversationMessages(conversationId);
    if (conversation && conversation.messages && conversation.messages.length > 0) {
      const socketId = socketService.getSocketId();
      currentSocketId.current = socketId;
      
      const loadedMessages: ChatMessage[] = conversation.messages.map((storedMsg) =>
        convertStoredMessageToChatMessage(storedMsg, socketId)
      );
      
      // Track loaded message IDs to prevent duplicates
      loadedMessages.forEach((msg) => {
        sentMessageIds.current.add(msg.id);
      });
      
      setMessages(loadedMessages);
      messagesLoadedRef.current = true;
      console.log(`✅ Loaded ${loadedMessages.length} previous messages`);
    }
  } catch (error) {
    console.error('Error loading previous messages:', error);
  }
};
```

### 2. Typing Indicators
**Add to socket listeners**:
```typescript
const handleUserTyping = (data: {
  conversationId: string;
  socketId: string;
  username: string;
  isTyping: boolean;
}) => {
  if (!isMounted) return;
  if (data.socketId === currentSocketId.current) return;

  setTypingUsers((prev) => {
    const next = new Map(prev);
    if (data.isTyping) {
      next.set(data.socketId, data.username);
    } else {
      next.delete(data.socketId);
    }
    return next;
  });
};

socketService.onUserTyping(handleUserTyping);

// Update handleInputChange to emit typing events
const handleInputChange = (text: string) => {
  setInputMessage(text);
  
  if (isConnected && isJoined && username) {
    if (!isTypingRef.current) {
      socketService.emitTypingStart(conversationId, username);
      isTypingRef.current = true;
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      socketService.emitTypingStop(conversationId, username);
      isTypingRef.current = false;
    }, 2000);
  }
};
```

### 3. Link Preview in Messages
**Update message rendering** to detect and render links:
```typescript
// In renderMessage, detect links
if (item.text && hasLink(item.text)) {
  const firstLink = getFirstLink(item.text);
  if (firstLink) {
    return (
      <View>
        <Text>{item.text}</Text>
        <TouchableOpacity onPress={() => Linking.openURL(firstLink)}>
          <Text style={styles.linkText}>🔗 {firstLink}</Text>
        </TouchableOpacity>
      </View>
    );
  }
}
```

### 4. Feedback Modal Integration
**Add End Chat button and feedback submission**:
```typescript
const handleFeedbackSubmit = async (rating: number, description: string): Promise<void> => {
  try {
    await apiService.submitFeedback(conversationId, username, rating, description);
    
    // Close socket connection gracefully
    if (isTypingRef.current) {
      socketService.emitTypingStop(conversationId, username);
      isTypingRef.current = false;
    }
    socketService.leaveConversation(conversationId);
    setIsChatEnded(true);
    setIsJoined(false);
    addSystemMessage('Chat session ended. Thank you for your feedback!');
    
    setTimeout(() => {
      socketService.disconnect();
      setIsConnected(false);
      router.back();
    }, 2000);
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw error;
  }
};
```

### 5. Feedback Submission Listener
**Add socket listener for feedback**:
```typescript
const handleFeedbackSubmitted = (data: {
  conversationId: string;
  feedback: {
    id: string;
    username?: string;
    rating: number;
    description?: string;
    timestamp: string;
  };
  timestamp: Date | string;
}) => {
  if (!isMounted) return;
  if (data.conversationId !== conversationId) return;
  if (data.feedback.username === username) return;

  const ratingStars = '⭐'.repeat(data.feedback.rating);
  const feedbackMessage = data.feedback.description
    ? `${data.feedback.username || 'A user'} submitted feedback: ${ratingStars} (${data.feedback.rating}/5) - "${data.feedback.description}"`
    : `${data.feedback.username || 'A user'} submitted feedback: ${ratingStars} (${data.feedback.rating}/5)`;
  
  addSystemMessage(`📝 ${feedbackMessage}`);
};

socketService.onFeedbackSubmitted(handleFeedbackSubmitted);
```

### 6. Enhanced Connection Status Handling
**Add connect/disconnect listeners**:
```typescript
socketService.onConnect(() => {
  if (!isMounted) return;
  setIsConnected(true);
  currentSocketId.current = socketService.getSocketId();
});

socketService.onDisconnect((reason) => {
  if (!isMounted) return;
  setIsConnected(false);
  setIsJoined(false);
});

socketService.onJoinedConversation((data) => {
  if (!isMounted) return;
  if (data.conversationId === conversationId) {
    setIsConnected(true);
    setIsJoined(true);
    setRoomSize(data.roomSize || 0);
    currentSocketId.current = socketService.getSocketId();
  }
});
```

### 7. UI Components to Add

**Typing Indicator** (add before input container):
```typescript
{typingUsers.size > 0 && (
  <View style={styles.typingIndicator}>
    <ActivityIndicator size="small" color="#667eea" />
    <Text style={styles.typingText}>
      {Array.from(typingUsers.values()).length === 1
        ? `${Array.from(typingUsers.values())[0]} is typing...`
        : `${Array.from(typingUsers.values()).length} people are typing...`}
    </Text>
  </View>
)}
```

**End Chat Button** (add to header):
```typescript
{!isChatEnded && isJoined && (
  <TouchableOpacity
    style={styles.endChatButton}
    onPress={() => setShowFeedbackModal(true)}
  >
    <Text style={styles.endChatButtonText}>End Chat</Text>
  </TouchableOpacity>
)}
```

**Feedback Modal** (add before closing SafeAreaView):
```typescript
<FeedbackModal
  isOpen={showFeedbackModal}
  conversationId={conversationId}
  username={username}
  onClose={() => setShowFeedbackModal(false)}
  onSubmit={handleFeedbackSubmit}
/>
```

### 8. Cleanup in useEffect
**Update cleanup**:
```typescript
return () => {
  isMounted = false;
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
  }
  if (typingTimeoutRef.current) {
    clearTimeout(typingTimeoutRef.current);
  }
  if (isTypingRef.current) {
    socketService.emitTypingStop(conversationId, username);
  }
  socketService.offUserTyping();
  socketService.offFeedbackSubmitted();
  socketService.offNewMessage(handleNewMessage);
  if (!isChatEnded) {
    socketService.leaveConversation(conversationId);
    socketService.disconnect();
  }
};
```

### 9. Reset Messages on Conversation Change
**Add useEffect**:
```typescript
useEffect(() => {
  messagesLoadedRef.current = false;
  setMessages([]);
}, [conversationId]);
```

## Implementation Order

1. Add imports (already done ✅)
2. Add state variables (already done ✅)
3. Add convertStoredMessageToChatMessage function
4. Add loadPreviousMessages function and call it before socket connection
5. Add typing indicator listeners and handlers
6. Update handleInputChange to emit typing events
7. Add link detection in message rendering
8. Add FeedbackModal component
9. Add feedback submission handler
10. Add End Chat button to header
11. Add typing indicator UI
12. Update cleanup functions
13. Add connection status listeners

## Testing Checklist

- [ ] Previous messages load when joining conversation
- [ ] Typing indicators show when other users type
- [ ] Links in messages are clickable
- [ ] End Chat button opens feedback modal
- [ ] Feedback submission works and closes chat
- [ ] Feedback from other users is displayed
- [ ] Connection status updates correctly
- [ ] All cleanup happens properly on unmount

