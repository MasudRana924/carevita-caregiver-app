import React, {useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Modal,
  Platform,
  Linking,
  ActivityIndicator,
  PanResponder,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {WebView} from 'react-native-webview';
import {formatChatTime, formatFileSize} from '../../utils/supportChat';

export const CHAT_COLORS = {
  TEAL: '#0B8A80',
  INK: '#111B21',
  MUTED: '#667781',
  WALL: '#F7E9D2',
  OUTGOING: '#D9FDD3',
  INCOMING: '#FFFFFF',
  READ_BLUE: '#53BDEB',
};

const {TEAL, INK, MUTED, OUTGOING, INCOMING, READ_BLUE} = CHAT_COLORS;

function viewerHtml(uri) {
  const src = String(uri)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '%3C');
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=6, user-scalable=yes" /><style>html,body{margin:0;height:100%;background:#000;display:flex;align-items:center;justify-content:center;}img{max-width:100%;max-height:100%;object-fit:contain;}</style></head><body><img src="${src}" /></body></html>`;
}

export function PersonAvatar({photo, name, size = 40}) {
  const dims = {width: size, height: size, borderRadius: size / 2};
  if (photo) {
    return <Image source={{uri: photo}} style={[styles.avatarImage, dims]} />;
  }
  const initial = String(name || '?').trim().charAt(0).toUpperCase() || '?';
  return (
    <View style={[styles.avatarFallback, dims]}>
      <Text style={[styles.avatarInitial, {fontSize: size * 0.42}]}>{initial}</Text>
    </View>
  );
}

export function MessageBubble({
  message,
  own,
  avatar,
  showAvatar,
  onRetry,
  onOpenImage,
  onOpenPdf,
}) {
  const failed = message.localStatus === 'failed';
  const sending = message.localStatus === 'sending';
  const caption = String(message.message || '').trim();
  const isImage = message.message_type === 'image' && message.attachment_url;
  const isDoc = message.message_type === 'document';

  return (
    <View style={[styles.bubbleRow, own ? styles.bubbleRowOwn : styles.bubbleRowOther]}>
      {!own ? (
        showAvatar ? (
          <View style={styles.avatarSlot}>{avatar}</View>
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

      <View
        style={[
          styles.bubble,
          own ? styles.bubbleOwn : styles.bubbleOther,
          isImage && styles.bubbleMedia,
        ]}>
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
                PDF
                {message.attachment_size
                  ? ` · ${formatFileSize(message.attachment_size)}`
                  : ''}
                {sending && message.uploadProgress != null
                  ? ` · ${message.uploadProgress}%`
                  : ''}
              </Text>
            </View>
          </Pressable>
        ) : null}

        {caption ? (
          <Text style={[styles.bubbleText, isImage && styles.captionText]}>
            {caption}
          </Text>
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

export function AttachSheet({visible, onClose, onCamera, onGallery, onDocument}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Send attachment</Text>
          <AttachOption icon="camera" label="Camera" hint="Take a photo" onPress={onCamera} />
          <AttachOption icon="image" label="Gallery" hint="JPG, PNG or WEBP" onPress={onGallery} />
          <AttachOption
            icon="document-text"
            label="Document"
            hint="PDF up to 10MB"
            onPress={onDocument}
          />
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

export function ImageViewer({uri, onClose, topInset}) {
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

export function PdfViewer({file, onClose, topInset}) {
  const uri = file?.uri;
  const sourceUri =
    Platform.OS === 'android' && uri
      ? `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(uri)}`
      : uri;
  return (
    <Modal visible={Boolean(uri)} animationType="slide" onRequestClose={onClose}>
      <View style={styles.pdfScreen}>
        <View style={[styles.pdfHeader, {paddingTop: Math.max(topInset, 8)}]}>
          <Pressable onPress={onClose} hitSlop={8} style={styles.iconBtn}>
            <Icon name="arrow-back" size={22} color={INK} />
          </Pressable>
          <Text style={styles.pdfTitle} numberOfLines={1}>
            {file?.name || 'Document'}
          </Text>
          <Pressable
            onPress={() => uri && Linking.openURL(uri).catch(() => {})}
            hitSlop={8}
            style={styles.iconBtn}>
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

const styles = StyleSheet.create({
  flex: {flex: 1},
  iconBtn: {width: 40, height: 40, alignItems: 'center', justifyContent: 'center'},
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  bubbleRowOwn: {justifyContent: 'flex-end'},
  bubbleRowOther: {justifyContent: 'flex-start'},
  avatarImage: {backgroundColor: '#D7E3DF'},
  avatarFallback: {backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center'},
  avatarInitial: {color: '#FFFFFF', fontWeight: '700'},
  avatarSlot: {marginRight: 6},
  miniSpacer: {width: 28, marginRight: 6},
  failBtn: {marginRight: 6, marginBottom: 4},
  bubble: {
    maxWidth: '78%',
    borderRadius: 16,
    shadowColor: '#0B141A',
    shadowOpacity: 0.12,
    shadowRadius: 1,
    shadowOffset: {width: 0, height: 1},
    elevation: 1,
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 4,
  },
  bubbleOwn: {backgroundColor: OUTGOING, borderBottomRightRadius: 4},
  bubbleOther: {backgroundColor: INCOMING, borderBottomLeftRadius: 4},
  bubbleMedia: {paddingHorizontal: 4, paddingTop: 4},
  bubbleText: {fontSize: 16, lineHeight: 21, color: INK, paddingHorizontal: 4},
  captionText: {paddingHorizontal: 6, paddingTop: 6},
  photo: {width: 230, height: 180, borderRadius: 12, backgroundColor: '#D7E3DF'},
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
  sheetRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 10},
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
