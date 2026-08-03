'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './TurnstileGate.module.css';

declare global {
  interface Window {
    turnstile: {
      render: (el: HTMLElement | string, opts: Record<string, unknown>) => string;
      remove: (id: string) => void;
    };
  }
}

interface TurnstileGateProps {
  siteKey: string;
  children: React.ReactNode;
}

const SESSION_KEY = 'pvstory_cf_ok';
const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export default function TurnstileGate({ siteKey, children }: TurnstileGateProps) {
  return <>{children}</>;
}
