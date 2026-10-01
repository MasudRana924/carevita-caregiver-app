const listeners = new Set();
let focused = false;

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export const supportChatEvents = {
  setFocused(value) {
    focused = Boolean(value);
  },
  isFocused() {
    return focused;
  },
  emitRefresh() {
    listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Support chat refresh listener failed:', error);
      }
    });
  },
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function createClientMessageId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random % 4) + 8;
    return value.toString(16);
  });
}

export function unreadCountFromQuery(payload) {
  const value =
    payload?.data?.unread_count ??
    payload?.unread ??
    payload?.data?.unread ??
    0;
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

export function isOwnMessage(message) {
  const role = String(
    message?.sender_role || message?.sender_type || '',
  ).toLowerCase();
  if (role === 'admin') {
    return false;
  }
  if (role === 'user' || role === 'caregiver') {
    return true;
  }
  return Boolean(message?.pending);
}

export function formatChatTime(iso) {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatFileSize(bytes) {
  const size = Number(bytes);
  if (!Number.isFinite(size) || size <= 0) {
    return '';
  }
  if (size < 1024) {
    return `${Math.round(size)} B`;
  }
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function dayKey(iso) {
  const date = new Date(iso || Date.now());
  if (Number.isNaN(date.getTime())) {
    return 'unknown';
  }
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function formatDayLabel(iso) {
  const date = new Date(iso || Date.now());
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000);
  if (diffDays === 0) {
    return 'Today';
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function messageTime(message) {
  const date = new Date(message?.created_at || message?.localCreatedAt || 0);
  const time = date.getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function sortMessages(list) {
  return [...(list || [])].sort((a, b) => {
    const delta = messageTime(a) - messageTime(b);
    if (delta !== 0) {
      return delta;
    }
    return String(a?.id || '').localeCompare(String(b?.id || ''));
  });
}

export function mergeMessages(current, incoming) {
  const serverById = new Map();
  const addServer = message => {
    if (!message?.id || message.pending) {
      return;
    }
    const previous = serverById.get(message.id) || {};
    serverById.set(message.id, {
      ...previous,
      ...message,
      pending: false,
      localStatus: 'sent',
      localFile: undefined,
      uploadProgress: undefined,
    });
  };

  (current || []).forEach(message => {
    if (!message?.pending) {
      addServer(message);
    }
  });
  (incoming || []).forEach(message => {
    if (message?.id) {
      addServer({...message, pending: false});
    }
  });

  const serverClientIds = new Set(
    [...serverById.values()]
      .map(message => message.client_message_id)
      .filter(Boolean),
  );

  const pending = (current || []).filter(message => {
    if (!message?.pending) {
      return false;
    }
    if (
      message.client_message_id &&
      serverClientIds.has(message.client_message_id)
    ) {
      return false;
    }
    if (message.id && serverById.has(message.id)) {
      return false;
    }
    return true;
  });

  return sortMessages([...serverById.values(), ...pending]);
}

export function buildChatRows(messages, isOwn = isOwnMessage) {
  const chronological = sortMessages(messages);
  const rows = [];
  let lastDay = null;

  chronological.forEach((message, index) => {
    const stamp = message.created_at || message.localCreatedAt;
    const key = dayKey(stamp);
    if (key !== lastDay) {
      rows.push({
        type: 'date',
        id: `date-${key}`,
        label: formatDayLabel(stamp),
      });
      lastDay = key;
    }

    const own = isOwn(message);
    const next = chronological[index + 1];
    const nextOwn = next ? isOwn(next) : true;
    const nextDay = next ? dayKey(next.created_at || next.localCreatedAt) : null;
    rows.push({
      type: 'message',
      id: String(message.id || message.client_message_id),
      message,
      showAvatar: !own && (nextOwn || nextDay !== key),
    });
  });

  return rows.reverse();
}

export function normalizeAttachment(asset) {
  const name =
    asset?.fileName ||
    asset?.name ||
    (String(asset?.type || '').includes('pdf') ? 'document.pdf' : 'photo.jpg');
  let mime = String(asset?.type || asset?.mime || '').toLowerCase();
  if (mime === 'image/jpg') {
    mime = 'image/jpeg';
  }
  if (!mime) {
    const ext = String(name).split('.').pop().toLowerCase();
    if (ext === 'jpg' || ext === 'jpeg') {
      mime = 'image/jpeg';
    } else if (ext === 'png') {
      mime = 'image/png';
    } else if (ext === 'webp') {
      mime = 'image/webp';
    } else if (ext === 'pdf') {
      mime = 'application/pdf';
    }
  }
  return {
    uri: asset?.uri,
    name,
    mime,
    size: Number(asset?.fileSize || asset?.size || 0) || 0,
    kind: mime === 'application/pdf' ? 'pdf' : 'image',
  };
}

export function validateAttachment(file) {
  if (!file?.uri) {
    return 'Could not read that file.';
  }
  const allowed =
    file.mime === 'image/jpeg' ||
    file.mime === 'image/png' ||
    file.mime === 'image/webp' ||
    file.mime === 'application/pdf';
  if (!allowed) {
    return 'Only JPG, PNG, WEBP images or PDF documents are allowed.';
  }
  if (file.size > MAX_FILE_BYTES) {
    return 'File too large. Maximum size is 10MB.';
  }
  return null;
}

export function newestServerMessage(messages) {
  const list = messages || [];
  for (let index = list.length - 1; index >= 0; index -= 1) {
    if (!list[index]?.pending && list[index]?.id) {
      return list[index];
    }
  }
  return null;
}

export function oldestServerMessage(messages) {
  return (messages || []).find(message => !message?.pending && message?.id) || null;
}
