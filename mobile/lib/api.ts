// ============================================================================
// SmartStudy AI Mobile — API instance (Expo-specific)
// Uses expo-secure-store for token persistence
// ============================================================================

import * as SecureStore from 'expo-secure-store';
import { createApiClient, type TokenStorage } from '@smartstudy/shared';

const TOKEN_KEY = 'smartstudy_auth_token';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';

/** Expo SecureStore-based token storage */
const secureTokenStorage: TokenStorage = {
  async getToken() {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  async setToken(token: string) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },
  async removeToken() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};

/** Pre-configured API client for the mobile app */
export const api = createApiClient(API_BASE_URL, secureTokenStorage);

export { API_BASE_URL };
