// ============================================================================
// SmartStudy AI Mobile — Library Screen
// Document list and upload (via Camera for OCR or Document Picker for PDFs)
// ============================================================================

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS, sharedStyles } from '@/constants/theme';
import { api } from '@/lib/api';
import type { Document } from '@smartstudy/shared';

export default function LibraryScreen() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const docs = await api.documents.list();
      setDocuments(docs);
    } catch (err) {
      console.warn('Failed to load docs', err);
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (uri: string, name: string, type: string) => {
    setUploading(true);
    try {
      // The API client handles transforming this into a FormData blob on React Native
      const payload = {
        uri,
        name,
        type,
      };
      await api.documents.upload(payload, name);
      await loadDocuments(); // Refresh list
    } catch (err) {
      Alert.alert('Erreur', "L'importation du document a échoué.");
      console.warn('Upload error', err);
    } finally {
      setUploading(false);
    }
  };

  const pickPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        await uploadFile(asset.uri, asset.name, asset.mimeType ?? 'application/pdf');
      }
    } catch (err) {
      console.warn('Document picker error:', err);
    }
  };

  const scanDocument = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Nous avons besoin de la caméra pour scanner.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        const filename = asset.uri.split('/').pop() || 'scan.jpg';
        await uploadFile(asset.uri, filename, 'image/jpeg');
      }
    } catch (err) {
      console.warn('Camera error:', err);
    }
  };

  const renderItem = ({ item }: { item: Document }) => (
    <View style={styles.docCard}>
      <View style={styles.docIcon}>
        <Ionicons 
          name={item.file_path.endsWith('.pdf') ? 'document-text' : 'image'} 
          size={24} 
          color={COLORS.primary} 
        />
      </View>
      <View style={styles.docInfo}>
        <Text style={styles.docTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.docMeta}>
          {new Date(item.imported_at).toLocaleDateString()} • {item.page_count} pages
        </Text>
      </View>
      <TouchableOpacity style={styles.actionBtn}>
        <Ionicons name="ellipsis-vertical" size={20} color={COLORS.textMuted} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={sharedStyles.safeArea}>
      <View style={styles.header}>
        <Text style={sharedStyles.title}>Bibliothèque</Text>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.iconBtn} onPress={scanDocument} disabled={uploading}>
            <Ionicons name="camera" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={pickPDF} disabled={uploading}>
            <Ionicons name="document-add" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {uploading && (
        <View style={styles.uploadingBanner}>
          <ActivityIndicator color={COLORS.primary} size="small" />
          <Text style={styles.uploadingText}>Importation et analyse en cours...</Text>
        </View>
      )}

      {loading ? (
        <View style={[sharedStyles.container, sharedStyles.center]}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(d) => d.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="library-outline" size={48} color={COLORS.textMuted} />
              <Text style={[sharedStyles.subtitle, { marginTop: SPACING.md }]}>Aucun document</Text>
              <Text style={[sharedStyles.body, { textAlign: 'center', marginTop: SPACING.sm }]}>
                Ajoutez des PDF ou scannez vos notes pour générer des quiz et flashcards.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    gap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  uploadingText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  list: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.subtle,
  },
  docIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  docInfo: {
    flex: 1,
  },
  docTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  docMeta: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  actionBtn: {
    padding: SPACING.sm,
  },
  empty: {
    alignItems: 'center',
    padding: SPACING.xxl,
    marginTop: SPACING.xxl,
  },
});
