import React, {useCallback, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Image,
  Modal,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  ActivityIndicator,
  StatusBar,
  Linking,
  AppState,
  RefreshControl,
  PanResponder,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {useQueryClient} from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/Ionicons';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {
  pick,
  types,
  errorCodes,
  isErrorWithCode,
} from '@react-native-documents/picker';
import {WebView} from 'react-native-webview';
import {conversationService, unwrapData, unwrapList} from '../api/services';
import {queryKeys} from '../api/queryKeys';
import {showError} from '../context/ErrorModalContext';
import {
  requestCameraPermission,
  requestGalleryPermission,
} from '../utils/permissions';
import {
  supportChatEvents,
  createClientMessageId,
  isOwnMessage,
  formatChatTime,
  formatFileSize,
  mergeMessages,
  buildChatRows,
  normalizeAttachment,
  validateAttachment,
  newestServerMessage,
  oldestServerMessage,
} from '../utils/supportChat';

const TEAL = '#0B8A80';
const INK = '#111B21';
const MUTED = '#667781';
const WALL = '#EFE7DE';
const OUTGOING = '#D9FDD3';
const INCOMING = '#FFFFFF';
const READ_BLUE = '#53BDEB';
const MAX_TEXT = 4000;
const PAGE_SIZE = 30;

const imagePickerOptions = {
  mediaType: 'photo',
  quality: 0.8,
  selectionLimit: 1,
  maxWidth: 1600,
  maxHeight: 1600,
};

function viewerHtml(uri) {
  const src = String(uri)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '%3C');
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=6, user-scalable=yes" /><style>html,body{margin:0;height:100%;background:#000;display:flex;align-items:center;justify-content:center;}img{max-width:100%;max-height:100%;object-fit:contain;}</style></head><body><img src="${src}" /></body></html>`;
}

function clearSupportUnread(queryClient) {
  queryClient.setQueryData(queryKeys.conversations.unreadCount(), {
    success: true,
    unread: 0,
    data: {unread_count: 0, unread: 0},
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.conversations.unreadCount(),
  });
}

const SupportChatScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const listRef = useRef(null);
  const messagesRef = useRef([]);
  const hasMoreRef = useRef(false);
  const loadingOlderRef = useRef(false);
  const userScrolledRef = useRef(false);
  const listHeightRef = useRef(0);
  const contentHeightRef = useRef(0);
  const latestGenRef = useRef(0);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [attachOpen, setAttachOpen] = useState(false);
  const [viewer, setViewer] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  messagesRef.current = messages;

  const rows = useMemo(() => buildChatRows(messages), [messages]);
  const canSend = Boolean(draft.trim() || attachment);

  const rememberPage = useCallback((response, {replaceOlderFlag}) => {
    const incoming = unwrapList(response);
    setMessages(prev => mergeMessages(prev, incoming));
    if (replaceOlderFlag) {
      const more = Boolean(response?.meta?.has_more);
      hasMoreRef.current = more;
      setHasMore(more);
    }
    if (response?.meta?.conversation) {
      return response.meta.conversation;
    }
    return null;
  }, []);

  const loadLatest = useCallback(async () => {
    const gen = latestGenRef.current + 1;
    latestGenRef.current = gen;
    try {
      const response = await conversationService.getMessages({limit: PAGE_SIZE});
      if (gen !== latestGenRef.current) {
        return;
      }
      rememberPage(response, {replaceOlderFlag: true});
      clearSupportUnread(queryClient);
      setLoadError('');
    } catch (error) {
      if (gen !== latestGenRef.current) {
        return;
      }
      const message =
        error?.message || 'Could not load messages. Pull to try again.';
      setLoadError(message);
      if (error?.status === 400) {
        showError(message);
      }
    } finally {
      if (gen !== latestGenRef.current) {
        return;
      }
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [queryClient, rememberPage]);

  const loadNewer = useCallback(async () => {
    const newest = newestServerMessage(messagesRef.current);
    if (!newest?.id) {
      await loadLatest();
      return;
    }
    try {
      const response = await conversationService.getMessages({
        after: newest.id,
      });
      rememberPage(response, {replaceOlderFlag: false});
      await conversationService.markAsRead().catch(() => {});
      clearSupportUnread(queryClient);
      setLoadError('');
    } catch (error) {
      await loadLatest();
    }
  }, [loadLatest, queryClient, rememberPage]);

  const loadOlder = useCallback(async () => {
    const oldest = oldestServerMessage(messagesRef.current);
    if (
      !oldest?.id ||
      !hasMoreRef.current ||
      loadingOlderRef.current ||
      !userScrolledRef.current
    ) {
      return;
    }
    loadingOlderRef.current = true;
    setLoadingOlder(true);
    try {
      const response = await conversationService.getMessages({
        before: oldest.id,
        limit: PAGE_SIZE,
      });
      rememberPage(response, {replaceOlderFlag: true});
    } catch (error) {
      if (error?.status === 400) {
        showError(error.message);
      }
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  }, [rememberPage]);

  const loadOlderRef = useRef(loadOlder);
  loadOlderRef.current = loadOlder;

  const fillOlderIfShort = useCallback(() => {
    if (
      listHeightRef.current > 0 &&
      contentHeightRef.current > 0 &&
      contentHeightRef.current <= listHeightRef.current + 24
    ) {
      userScrolledRef.current = true;
      loadOlderRef.current();
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const unsubscribe = supportChatEvents.subscribe(() => {
        loadNewer();
      });
      supportChatEvents.setFocused(true);
      loadLatest();
      const appStateSub = AppState.addEventListener('change', state => {
        if (state === 'active') {
          loadLatest();
        }
      });
      const showEvent =
        Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
      const hideEvent =
        Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
      const showSub = Keyboard.addListener(showEvent, () => {
        setKeyboardOpen(true);
      });
      const hideSub = Keyboard.addListener(hideEvent, () => {
        setKeyboardOpen(false);
      });
      return () => {
        supportChatEvents.setFocused(false);
        unsubscribe();
        appStateSub.remove();
        showSub.remove();
        hideSub.remove();
      };
    }, [loadLatest, loadNewer]),
  );

  const scrollToLatest = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({offset: 0, animated: true});
    });
  }, []);

  const deliver = useCallback(async optimistic => {
    const clientId = optimistic.client_message_id;
    try {
      const response = optimistic.localFile
        ? await conversationService.sendFile({
            file: optimistic.localFile,
            message: optimistic.message,
            clientMessageId: clientId,
            onProgress: percent => {
              setMessages(prev =>
                prev.map(item =>
                  item.client_message_id === clientId
                    ? {...item, uploadProgress: percent}
                    : item,
                ),
              );
            },
          })
        : await conversationService.sendText({
            message: optimistic.message,
            clientMessageId: clientId,
          });
      const saved = unwrapData(response);
      if (!saved?.id) {
        throw new Error(response?.message || 'Could not send message');
      }
      setMessages(prev =>
        mergeMessages(prev, [
          {
            ...saved,
            client_message_id: saved.client_message_id || clientId,
          },
        ]),
      );
    } catch (error) {
      if (error?.status === 400) {
        showError(error.message || 'Could not send message');
      }
      setMessages(prev =>
        prev.map(item =>
          item.client_message_id === clientId
            ? {...item, pending: true, localStatus: 'failed'}
            : item,
        ),
      );
    }
  }, []);

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text && !attachment) {
      return;
    }
    if (text.length > MAX_TEXT) {
      showError('Message is too long. Maximum is 4000 characters.');
      return;
    }
    const clientId = createClientMessageId();
    const file = attachment;
    const optimistic = {
      id: clientId,
      client_message_id: clientId,
      sender_role: 'user',
      sender_name: 'You',
      message_type: file ? (file.kind === 'pdf' ? 'document' : 'image') : 'text',
      message: text || null,
      attachment_url: file?.uri || null,
      attachment_name: file?.name || null,
      attachment_mime: file?.mime || null,
      attachment_size: file?.size || null,
      localFile: file,
      created_at: new Date().toISOString(),
      pending: true,
      localStatus: 'sending',
      uploadProgress: file ? 0 : null,
      is_read: false,
    };
    setMessages(prev => sortWithPending(prev, optimistic));
    setDraft('');
    setAttachment(null);
    scrollToLatest();
    deliver(optimistic);
  }, [attachment, deliver, draft, scrollToLatest]);

  const retryMessage = useCallback(
    message => {
      if (message?.localStatus !== 'failed') {
        return;
      }
      setMessages(prev =>
        prev.map(item =>
          item.client_message_id === message.client_message_id
            ? {...item, localStatus: 'sending', uploadProgress: item.localFile ? 0 : null}
            : item,
        ),
      );
      deliver({...message, localStatus: 'sending', pending: true});
    },
    [deliver],
  );

  const stageFile = useCallback(asset => {
    const file = normalizeAttachment(asset);
    const problem = validateAttachment(file);
    if (problem) {
      showError(problem);
      return;
    }
    setAttachment(file);
    setAttachOpen(false);
  }, []);

  const openCamera = useCallback(async () => {
    setAttachOpen(false);
    const granted = await requestCameraPermission();
    if (!granted) {
      showError('Please allow camera access to take a photo.', 'Permission required');
      return;
    }
    const result = await launchCamera(imagePickerOptions);
    if (result?.didCancel) {
      return;
    }
    if (result?.errorCode) {
      showError(result.errorMessage || 'Could not open the camera');
      return;
    }
    if (result?.assets?.[0]?.uri) {
      stageFile(result.assets[0]);
    }
  }, [stageFile]);

  const openGallery = useCallback(async () => {
    setAttachOpen(false);
    const granted = await requestGalleryPermission();
    if (!granted) {
      showError(
        'Please allow photo library access to send an image.',
        'Permission required',
      );
      return;
    }
    const result = await launchImageLibrary(imagePickerOptions);
    if (result?.didCancel) {
      return;
    }
    if (result?.errorCode) {
      showError(result.errorMessage || 'Could not open your photos');
      return;
    }
    if (result?.assets?.[0]?.uri) {
      stageFile(result.assets[0]);
    }
  }, [stageFile]);

  const openDocument = useCallback(async () => {
    setAttachOpen(false);
    try {
      const [file] = await pick({
        type: [types.pdf],
        allowMultiSelection: false,
      });
      if (file?.uri) {
        stageFile(file);
      }
    } catch (error) {
      if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) {
        return;
      }
      showError(error?.message || 'Could not open documents');
    }
  }, [stageFile]);

  const openImage = useCallback(message => {
    const uri = message?.attachment_url;
    if (!uri || message.localStatus === 'failed') {
      return;
    }
    setViewer({uri});
  }, []);

  const openPdf = useCallback(message => {
    const uri = message?.attachment_url;
    if (!uri || message.pending || !/^https?:/i.test(uri)) {
      return;
    }
    setPdf({
      uri,
      name: message.attachment_name || 'Document',
    });
  }, []);

  const renderItem = useCallback(
    ({item}) => {
      if (item.type === 'date') {
        return (
          <View style={styles.dateWrap}>
            <Text style={styles.dateText}>{item.label}</Text>
          </View>
        );
      }
      return (
        <MessageBubble
          message={item.message}
          showAvatar={item.showAvatar}
          onRetry={retryMessage}
          onOpenImage={openImage}
          onOpenPdf={openPdf}
        />
      );
    },
    [openImage, openPdf, retryMessage],
  );

  const composerPad = keyboardOpen ? 8 : Math.max(insets.bottom, 10);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ChatHeader
        paddingTop={Math.max(insets.top, 8)}
        onBack={() => navigation.goBack()}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {initialLoading ? (
          <View style={styles.centerFill}>
            <ActivityIndicator size="large" color={TEAL} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            style={styles.flex}
            data={rows}
            inverted
            keyExtractor={item => item.id}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            onScrollBeginDrag={() => {
              userScrolledRef.current = true;
            }}
            onLayout={event => {
              listHeightRef.current = event.nativeEvent.layout.height;
              fillOlderIfShort();
            }}
            onContentSizeChange={(_width, height) => {
              contentHeightRef.current = height;
              fillOlderIfShort();
            }}
            contentContainerStyle={
              rows.length === 0 ? styles.emptyContent : styles.listContent
            }
            onEndReached={loadOlder}
            onEndReachedThreshold={0.2}
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 120,
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  loadLatest();
                }}
                tintColor={TEAL}
                colors={[TEAL]}
              />
            }
            ListFooterComponent={
              loadingOlder ? (
                <ActivityIndicator
                  style={styles.olderSpinner}
                  color={TEAL}
                  size="small"
                />
              ) : hasMore ? (
                <View style={styles.olderSpacer} />
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Icon name="chatbubbles" size={28} color={TEAL} />
                </View>
                <Text style={styles.emptyTitle}>
                  {loadError
                    ? 'Could not load messages'
                    : 'Send us a message — our support team usually replies within a few minutes.'}
                </Text>
                {loadError ? (
                  <Pressable onPress={loadLatest} style={styles.retryLink}>
                    <Text style={styles.retryLinkText}>Tap to retry</Text>
                  </Pressable>
                ) : null}
              </View>
            }
          />
        )}

        {attachment ? (
          <View style={styles.previewBar}>
            {attachment.kind === 'image' ? (
              <Image source={{uri: attachment.uri}} style={styles.previewImage} />
            ) : (
              <View style={styles.previewDoc}>
                <Icon name="document-text" size={22} color="#E14D4D" />
              </View>
            )}
            <View style={styles.previewCopy}>
              <Text style={styles.previewName} numberOfLines={1}>
                {attachment.name}
              </Text>
              <Text style={styles.previewMeta}>
                {attachment.kind === 'pdf' ? 'PDF' : 'Photo'}
                {attachment.size ? ` · ${formatFileSize(attachment.size)}` : ''}
              </Text>
            </View>
            <Pressable
              onPress={() => setAttachment(null)}
              hitSlop={8}
              style={styles.previewClose}>
              <Icon name="close" size={18} color={INK} />
            </Pressable>
          </View>
        ) : null}

        <View style={[styles.composer, {paddingBottom: composerPad}]}>
          <Pressable
            onPress={() => {
              Keyboard.dismiss();
              setAttachOpen(true);
            }}
            style={styles.attachBtn}
            accessibilityLabel="Attach file">
            <Icon name="add" size={26} color={TEAL} />
          </Pressable>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={attachment ? 'Add a caption' : 'Message'}
            placeholderTextColor="#8AA0A6"
            style={styles.input}
            multiline
            maxLength={MAX_TEXT}
          />
          <Pressable
            onPress={handleSend}
            disabled={!canSend}
            style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
            accessibilityLabel="Send message">
            <Icon name="send" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <AttachSheet
        visible={attachOpen}
        onClose={() => setAttachOpen(false)}
        onCamera={openCamera}
        onGallery={openGallery}
        onDocument={openDocument}
      />
      <ImageViewer
        uri={viewer?.uri}
        onClose={() => setViewer(null)}
        topInset={insets.top}
      />
      <PdfViewer
        file={pdf}
        onClose={() => setPdf(null)}
        topInset={insets.top}
      />
    </View>
  );
};

function sortWithPending(current, optimistic) {
  return mergeMessages(
    [...current.filter(item => item.client_message_id !== optimistic.client_message_id), optimistic],
    [],
  );
}

function ChatHeader({paddingTop, onBack}) {
  return (
    <View style={[styles.header, {paddingTop}]}>
      <Pressable onPress={onBack} style={styles.backBtn} hitSlop={8}>
        <Icon name="arrow-back" size={22} color={INK} />
      </Pressable>
      <View style={styles.headerAvatar}>
        <Icon name="headset" size={20} color="#FFFFFF" />
      </View>
      <View style={styles.headerCopy}>
        <Text style={styles.headerTitle}>CareMate Support</Text>
        <Text style={styles.headerSub}>Usually replies in a few minutes</Text>
      </View>
    </View>
  );
}

function MessageBubble({message, showAvatar, onRetry, onOpenImage, onOpenPdf}) {
  const own = isOwnMessage(message);
  const failed = message.localStatus === 'failed';
  const sending = message.localStatus === 'sending';
  const caption = String(message.message || '').trim();
  const isImage = message.message_type === 'image' && message.attachment_url;
  const isDoc = message.message_type === 'document';

  return (
    <View style={[styles.bubbleRow, own ? styles.bubbleRowOwn : styles.bubbleRowOther]}>
      {!own ? (
        showAvatar ? (
          <View style={styles.miniAvatar}>
            <Icon name="headset" size={14} color="#FFFFFF" />
          </View>
        ) : (
          <View style={styles.miniSpacer} />
        )
      ) : null}

      {own && failed ? (
        <Pressable
          onPress={() => onRetry(message)}
          style={styles.failBtn}
          accessibilityLabel="Tap to retry">
          <Icon name="alert-circle" size={22} color="#E34242" />
        </Pressable>
      ) : null}

      <View style={[styles.bubble, own ? styles.bubbleOwn : styles.bubbleOther, isImage && styles.bubbleMedia]}>
        {isImage ? (
          <Pressable onPress={() => onOpenImage(message)}>
            <Image source={{uri: message.attachment_url}} style={styles.photo} />
            {sending && message.uploadProgress != null ? (
              <View style={styles.photoScrim}>
                <Text style={styles.photoProgress}>{message.uploadProgress}%</Text>
              </View>
            ) : null}
          </Pressable>
        ) : null}

        {isDoc ? (
          <Pressable style={styles.docRow} onPress={() => onOpenPdf(message)}>
            <View style={styles.docIcon}>
              <Icon name="document-text" size={22} color="#E14D4D" />
            </View>
            <View style={styles.docCopy}>
              <Text style={styles.docName} numberOfLines={2}>
                {message.attachment_name || 'Document.pdf'}
              </Text>
              <Text style={styles.docSize}>
                PDF{message.attachment_size ? ` · ${formatFileSize(message.attachment_size)}` : ''}
                {sending && message.uploadProgress != null
                  ? ` · ${message.uploadProgress}%`
                  : ''}
              </Text>
            </View>
          </Pressable>
        ) : null}

        {caption ? (
          <Text style={[styles.bubbleText, isImage && styles.captionText]}>{caption}</Text>
        ) : null}

        <View style={styles.metaRow}>
          <Text style={styles.timeText}>
            {formatChatTime(message.created_at || message.localCreatedAt)}
          </Text>
          {own && !failed ? <ReadTicks message={message} sending={sending} /> : null}
        </View>

        {sending && message.uploadProgress != null && !isImage ? (
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, {width: `${message.uploadProgress}%`}]}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

function ReadTicks({message, sending}) {
  if (sending) {
    return <Icon name="time-outline" size={13} color={MUTED} />;
  }
  if (message.is_read) {
    return <Text style={[styles.ticks, styles.ticksRead]}>✓✓</Text>;
  }
  return <Text style={styles.ticks}>✓</Text>;
}

function AttachSheet({visible, onClose, onCamera, onGallery, onDocument}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Send attachment</Text>
          <AttachOption icon="camera" label="Camera" hint="Take a photo" onPress={onCamera} />
          <AttachOption icon="image" label="Gallery" hint="JPG, PNG or WEBP" onPress={onGallery} />
          <AttachOption icon="document-text" label="Document" hint="PDF up to 10MB" onPress={onDocument} />
          <Pressable onPress={onClose} style={styles.sheetCancel}>
            <Text style={styles.sheetCancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function AttachOption({icon, label, hint, onPress}) {
  return (
    <Pressable onPress={onPress} style={styles.sheetRow}>
      <View style={styles.sheetIcon}>
        <Icon name={icon} size={20} color={TEAL} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.sheetLabel}>{label}</Text>
        <Text style={styles.sheetHint}>{hint}</Text>
      </View>
    </Pressable>
  );
}

function distanceBetween(touches) {
  const dx = touches[0].pageX - touches[1].pageX;
  const dy = touches[0].pageY - touches[1].pageY;
  return Math.sqrt(dx * dx + dy * dy) || 1;
}

function ZoomableImage({uri}) {
  const scaleRef = useRef(1);
  const startRef = useRef({distance: 0, scale: 1});
  const [zoom, setZoom] = useState(1);
  const responder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: event => event.nativeEvent.touches.length >= 2,
      onPanResponderGrant: event => {
        const touches = event.nativeEvent.touches;
        if (touches.length >= 2) {
          startRef.current = {
            distance: distanceBetween(touches),
            scale: scaleRef.current,
          };
        }
      },
      onPanResponderMove: event => {
        const touches = event.nativeEvent.touches;
        if (touches.length < 2 || !startRef.current.distance) {
          return;
        }
        const next = Math.min(
          4,
          Math.max(
            1,
            startRef.current.scale *
              (distanceBetween(touches) / startRef.current.distance),
          ),
        );
        scaleRef.current = next;
        setZoom(next);
      },
    }),
  ).current;

  return (
    <View style={styles.viewer} {...responder.panHandlers}>
      <Image
        source={{uri}}
        style={[styles.viewerImage, {transform: [{scale: zoom}]}]}
        resizeMode="contain"
      />
    </View>
  );
}

function ImageViewer({uri, onClose, topInset}) {
  const remote = Boolean(uri && /^https?:/i.test(uri));
  return (
    <Modal visible={Boolean(uri)} animationType="fade" onRequestClose={onClose}>
      <View style={styles.viewer}>
        {remote ? (
          <WebView
            originWhitelist={['*']}
            source={{html: viewerHtml(uri)}}
            style={styles.viewerWeb}
            setBuiltInZoomControls
            setDisplayZoomControls={false}
            showsVerticalScrollIndicator={false}
          />
        ) : uri ? (
          <ZoomableImage uri={uri} />
        ) : null}
        <Pressable
          onPress={onClose}
          style={[styles.viewerClose, {top: Math.max(topInset, 12) + 8}]}>
          <Icon name="close" size={22} color="#FFFFFF" />
        </Pressable>
      </View>
    </Modal>
  );
}

function PdfViewer({file, onClose, topInset}) {
  const uri = file?.uri;
  const sourceUri =
    Platform.OS === 'android' && uri
      ? `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(uri)}`
      : uri;
  return (
    <Modal visible={Boolean(uri)} animationType="slide" onRequestClose={onClose}>
      <View style={styles.pdfScreen}>
        <View style={[styles.pdfHeader, {paddingTop: Math.max(topInset, 8)}]}>
          <Pressable onPress={onClose} hitSlop={8} style={styles.backBtn}>
            <Icon name="arrow-back" size={22} color={INK} />
          </Pressable>
          <Text style={styles.pdfTitle} numberOfLines={1}>
            {file?.name || 'Document'}
          </Text>
          <Pressable
            onPress={() => uri && Linking.openURL(uri).catch(() => {})}
            hitSlop={8}
            style={styles.backBtn}>
            <Icon name="open-outline" size={20} color={TEAL} />
          </Pressable>
        </View>
        {sourceUri ? (
          <WebView
            source={{uri: sourceUri}}
            style={styles.flex}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.pdfLoading}>
                <ActivityIndicator color={TEAL} size="large" />
              </View>
            )}
          />
        ) : null}
      </View>
    </Modal>
  );
}

export default SupportChatScreen;

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: WALL},
  flex: {flex: 1},
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerCopy: {flex: 1},
  headerTitle: {fontSize: 16, fontWeight: '700', color: INK},
  headerSub: {marginTop: 1, fontSize: 12, color: MUTED},
  centerFill: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  listContent: {paddingHorizontal: 10, paddingVertical: 8},
  emptyContent: {flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28},
  emptyState: {alignItems: 'center', justifyContent: 'center', paddingVertical: 24},
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    color: MUTED,
    fontWeight: '500',
  },
  retryLink: {marginTop: 12},
  retryLinkText: {color: TEAL, fontWeight: '700', fontSize: 14},
  olderSpinner: {marginVertical: 12},
  olderSpacer: {height: 8},
  dateWrap: {alignItems: 'center', marginVertical: 8},
  dateText: {
    backgroundColor: '#FFFFFF',
    color: MUTED,
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  bubbleRowOwn: {justifyContent: 'flex-end'},
  bubbleRowOther: {justifyContent: 'flex-start'},
  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  miniSpacer: {width: 28, marginRight: 6},
  failBtn: {marginRight: 6, marginBottom: 4},
  bubble: {
    maxWidth: '78%',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 4,
  },
  bubbleOwn: {
    backgroundColor: OUTGOING,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: INCOMING,
    borderBottomLeftRadius: 4,
  },
  bubbleMedia: {paddingHorizontal: 4, paddingTop: 4},
  bubbleText: {
    fontSize: 16,
    lineHeight: 21,
    color: INK,
    paddingHorizontal: 4,
  },
  captionText: {paddingHorizontal: 6, paddingTop: 6},
  photo: {
    width: 230,
    height: 180,
    borderRadius: 12,
    backgroundColor: '#D7E3DF',
  },
  photoScrim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoProgress: {color: '#FFFFFF', fontWeight: '700', fontSize: 16},
  docRow: {flexDirection: 'row', alignItems: 'center', padding: 4, minWidth: 200},
  docIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  docCopy: {flex: 1},
  docName: {fontSize: 14, fontWeight: '600', color: INK},
  docSize: {marginTop: 2, fontSize: 12, color: MUTED},
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    marginTop: 2,
    paddingHorizontal: 4,
  },
  timeText: {fontSize: 11, color: MUTED},
  ticks: {fontSize: 12, color: '#8696A0', fontWeight: '700', marginLeft: 2},
  ticksRead: {color: READ_BLUE},
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(11,138,128,0.15)',
    marginTop: 4,
    overflow: 'hidden',
  },
  progressFill: {height: 3, backgroundColor: TEAL},
  previewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 10,
    marginBottom: 4,
    borderRadius: 14,
    padding: 8,
  },
  previewImage: {width: 48, height: 48, borderRadius: 10, backgroundColor: '#E7EEF0'},
  previewDoc: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCopy: {flex: 1, marginHorizontal: 10},
  previewName: {fontSize: 14, fontWeight: '600', color: INK},
  previewMeta: {marginTop: 2, fontSize: 12, color: MUTED},
  previewClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0F2F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingTop: 6,
    backgroundColor: '#F6F1EA',
    gap: 6,
  },
  attachBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 21,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 11 : 8,
    paddingBottom: Platform.OS === 'ios' ? 11 : 8,
    fontSize: 16,
    color: INK,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {backgroundColor: '#C5CED6'},
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17,27,33,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E1E6EA',
    marginBottom: 12,
  },
  sheetTitle: {fontSize: 16, fontWeight: '700', color: INK, marginBottom: 8},
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  sheetIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E7F6F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sheetLabel: {fontSize: 15, fontWeight: '600', color: INK},
  sheetHint: {marginTop: 2, fontSize: 12, color: MUTED},
  sheetCancel: {
    marginTop: 8,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#F4F6F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCancelText: {fontSize: 15, fontWeight: '700', color: INK},
  viewer: {flex: 1, backgroundColor: '#000000'},
  viewerWeb: {flex: 1, backgroundColor: '#000000'},
  viewerImage: {flex: 1, width: '100%', height: '100%'},
  viewerClose: {
    position: 'absolute',
    right: 16,
    zIndex: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfScreen: {flex: 1, backgroundColor: '#FFFFFF'},
  pdfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
    paddingBottom: 8,
  },
  pdfTitle: {flex: 1, fontSize: 16, fontWeight: '700', color: INK},
  pdfLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
});
