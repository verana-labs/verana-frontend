'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';

type Notification = {
  title?: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'inProgress';
};

type NotificationContextType = {
  // Notify shows a notification and returns a promise that resolves when the notification is closed
  notify: (message: string, type?: 'success' | 'error' | 'info' | 'inProgress', title?: string) => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within a NotificationProvider');
  return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notification, setNotification] = useState<Notification | null>(null);
  const [visible, setVisible] = useState(false);

  // Reference to the promise resolver, so we can resolve when notification closes
  const resolveClose = useRef<(() => void) | null>(null);

  // Notify returns a promise that resolves when the notification closes
  const notify = (message: string, type: 'success' | 'error' | 'info' | 'inProgress'= 'success', title?: string) => {
    // Resolve previous notification promise if exists
    if (resolveClose.current) {
      resolveClose.current();
      resolveClose.current = null;
    }
    setNotification({ message, type, title });
    setVisible(true);
    return new Promise<void>((resolve) => {
      resolveClose.current = resolve;
    });
  };

  // Handle automatic closing for 'success' and 'error' types, no timeout for 'info'
  useEffect(() => {
    if (!notification) return;
    setVisible(true);
    if (notification.type === 'info' || notification.type === 'inProgress') return; // no timeout for info type
    const duration = notification.type === 'error' ? 10000 : 5000;
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [notification]);

  // When the notification is hidden, remove it from state and resolve the promise
  useEffect(() => {
    if (!visible && notification) {
      const timeout = setTimeout(() => {
        setNotification(null);
        if (resolveClose.current) {
          resolveClose.current();
          resolveClose.current = null;
        }
      }, 400); // match the transition duration
      return () => clearTimeout(timeout);
    }
  }, [visible, notification]);

  return (
    <NotificationContext.Provider value={{ notify }}>
      <div className="relative w-full h-full">
        {children}
        <NotificationContainer
          notification={notification}
          visible={visible}
          onClose={() => setVisible(false)}
        />
      </div>
    </NotificationContext.Provider>
  );
};

function NotificationContainer({
  notification,
  visible,
  onClose,
}: {
  notification: Notification | null;
  visible: boolean;
  onClose: () => void;
}) {
  if (!notification) return null;
  return (
    <div
      className={`notify-container`}
      style={{ minWidth: 0, minHeight: 0 }}
    >
      <div
        className={`notify-notification 
          ${visible ? 'notify-visible' : 'notify-invisible'}
          ${
            notification.type === 'success'
              ? 'notify-success'
              : notification.type === 'error'
                ? 'notify-error'
                : notification.type === 'inProgress'
                  ? 'notify-in-progress'
                  : 'notify-info'
          }
        `}
        role={notification.type === 'error' ? 'alert' : undefined}
        aria-live="polite"
      >
        {getIcon(notification.type)}
        <div className="notify-msg-container">
          {notification.title && (
            <div className="notify-msg-title">{notification.title}</div>
          )}
          <span className="notify-msg-message">{notification.message}</span>
        </div>
        <button
          onClick={onClose}
          className="notify-btn-close"
          aria-label="Close"
          title="Close"
          tabIndex={0}
        >
          ×
        </button>
      </div>
    </div>
  );
}

function getIcon(type: 'success' | 'error' | 'info' | 'inProgress') {
  if (type === 'success') {
    return (
      <svg className="notify-icon-success" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="white" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12l2.5 2.5L16 9" />
      </svg>
    );
  }
  if (type === 'error') {
    return (
      <svg className="notify-icon-error" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="white" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l6 6m0-6l-6 6" />
      </svg>
    );
  }
  if (type === 'inProgress') {
    // Spinner
    return (
      <svg className="notify-icon-in-progress" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
    );
  }
  // info
  return (
    <svg className="notify-icon-info" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="white" />
      <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="16" r="1" fill="currentColor" />
    </svg>
  );
}
