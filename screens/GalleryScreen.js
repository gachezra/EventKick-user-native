import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, FlatList, Image, TouchableOpacity, StyleSheet, Dimensions, SafeAreaView, Text, Alert } from 'react-native';
import { Video } from 'expo-av';
import AWS from 'aws-sdk';
import { Buffer } from 'buffer';
import { FontAwesome, Ionicons, Octicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Toaster, toast } from 'sonner-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Progress from 'react-native-progress';

const { width, height } = Dimensions.get('window');

const s3 = new AWS.S3({
  endpoint: 'https://s3.tebi.io',
  accessKeyId: 'xFBgncfuBMjrkkMF',
  secretAccessKey: 'LwV3UON29392J3jIoXdu5jOotoEy7L9iddadvjrj',
  region: 'us-east-1',
  signatureVersion: 'v4',
});

const MediaGallery = ({ route, navigation }) => {
  const { allMedia, eventTitle, eventId } = route.params;
  const mediaRef = useRef(null);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const videoRefs = useRef([]);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});

  useEffect(() => {
    loadUploadedFiles();
  }, []);

  const loadUploadedFiles = async () => {
    try {
      const uploadedFilesJSON = await AsyncStorage.getItem('uploadedFiles');
      if (uploadedFilesJSON) {
        setUploadedFiles(JSON.parse(uploadedFilesJSON));
      }
    } catch (error) {
      console.error('Error loading uploaded files:', error);
    }
  };

  const saveUploadedFiles = async (newUploadedFiles) => {
    try {
      await AsyncStorage.setItem('uploadedFiles', JSON.stringify(newUploadedFiles));
    } catch (error) {
      console.error('Error saving uploaded files:', error);
    }
  };

  const isFileUploaded = (uri) => {
    const fileName = uri.split('/').pop();
    const fileKey = `eventkick/${eventId}/${fileName}`;
    return uploadedFiles[eventId]?.includes(fileKey);
  };

  const onViewableItemsChanged = ({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index;
      setSelectedMediaIndex(index);

      videoRefs.current.forEach((video, i) => {
        if (i !== index && video) video.pauseAsync();
        if (i === index && video) video.playAsync();
      });
    }
  };

  const shareMedia = async (uri) => {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
    } else {
      Alert.alert('Sharing is not available on this platform');
    }
  };

  const saveMedia = async (item) => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to save media to your device.');
        return;
      }
      
      await MediaLibrary.saveToLibraryAsync(item.uri);
      toast.success('Media saved to device');
    } catch (error) {
      console.error('Error saving media:', error);
      toast.error('Failed to save media');
    }
  };

  const deleteMedia = useCallback(async (uri) => {
    Alert.alert(
      "Delete Media",
      "Are you sure you want to delete this item?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await FileSystem.deleteAsync(uri);
              // Remove from uploaded files tracking
              const fileName = uri.split('/').pop();
              const fileKey = `eventkick/${eventId}/${fileName}`;
              const newUploadedFiles = { ...uploadedFiles };
              if (newUploadedFiles[eventId]) {
                newUploadedFiles[eventId] = newUploadedFiles[eventId].filter(key => key !== fileKey);
                await saveUploadedFiles(newUploadedFiles);
                setUploadedFiles(newUploadedFiles);
              }
              toast.success('File deleted');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting media:', error);
              toast.error('Failed to delete media');
            }
          }
        }
      ]
    );
  }, [uploadedFiles, eventId]);

  const uploadMedia = async (item) => {
    const fileName = item.uri.split('/').pop();
    const fileKey = `eventkick/${eventId}/${fileName}`;

    // Check if already uploaded
    if (uploadedFiles[eventId]?.includes(fileKey)) {
      toast.info('File already uploaded');
      return;
    }

    // Check if upload is in progress
    if (uploadProgress[item.uri]) {
      toast.info('Upload already in progress');
      return;
    }

    try {
      setUploadProgress(prev => ({ ...prev, [item.uri]: 0 }));

      const response = await FileSystem.readAsStringAsync(item.uri, { encoding: FileSystem.EncodingType.Base64 });
      const blob = Buffer.from(response, 'base64');
      
      const params = {
        Bucket: 'eventkick',
        Key: fileKey,
        Body: blob,
        ContentType: item.type === 'photo' ? 'image/jpeg' : 'video/mp4',
        ACL: 'public-read',
      };

      await new Promise((resolve, reject) => {
        const upload = s3.upload(params);
        
        upload.on('httpUploadProgress', (progress) => {
          const percentage = progress.loaded / progress.total;
          setUploadProgress(prev => ({
            ...prev,
            [item.uri]: percentage
          }));
        });

        upload.send((err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
      });

      const newUploadedFiles = { ...uploadedFiles };
      if (!newUploadedFiles[eventId]) {
        newUploadedFiles[eventId] = [];
      }
      newUploadedFiles[eventId].push(fileKey);
      
      setUploadedFiles(newUploadedFiles);
      await saveUploadedFiles(newUploadedFiles);
      
      toast.success('Upload complete');
    } catch (error) {
      console.error('Error uploading:', error);
      toast.error('Upload failed');
    } finally {
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[item.uri];
        return newProgress;
      });
    }
  };

  const renderItem = ({ item, index }) => (
    <>
      <View style={styles.mediaContainer}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.goBackButton}
        >
          <Ionicons name="chevron-back" size={20} color="#ffffff" />
        </TouchableOpacity>

        {item.type === 'video' ? (
          <Video
            ref={(ref) => (videoRefs.current[index] = ref)}
            source={{ uri: item.uri }}
            style={styles.media}
            resizeMode="stretch"
            shouldPlay={index === selectedMediaIndex}
            isLooping
          />
        ) : (
          <Image 
            source={{ uri: item.uri }} 
            resizeMode="stretch" 
            style={styles.media} 
          />
        )}

        <View style={styles.topRightActions}>
          <TouchableOpacity 
            onPress={() => saveMedia(item)}
            style={styles.actionIcon}
          >
            <Ionicons name="save-outline" size={20} color="#ffffff" />
          </TouchableOpacity>
          
          {!isFileUploaded(item.uri) && (
            <TouchableOpacity
              onPress={() => uploadMedia(item)}
              style={styles.actionIcon}
            >
              <Octicons name="upload" size={20} color="white" />
            </TouchableOpacity>
          )}
        </View>

        {uploadProgress[item.uri] !== undefined && (
          <Progress.Circle 
            progress={uploadProgress[item.uri]} 
            size={35} 
            color="#4CD964"
            borderWidth={0}
            thickness={2}
            style={styles.uploadProgress}
          />
        )}
      </View>

      <View style={styles.bottomActions}>
        <TouchableOpacity 
          onPress={() => shareMedia(item.uri)} 
          style={[styles.actionButton, {backgroundColor: 'rgba(67, 56, 202, 0.5)'}]}
        >
          <Text style={styles.actionButtonText}>Share</Text>
          <FontAwesome name="share-alt" size={24} color="#ffffff" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => deleteMedia(item.uri)} 
          style={[styles.actionButton, {backgroundColor: 'rgba(248, 113, 113, 0.5)'}]}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
          <FontAwesome name="trash" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={mediaRef}
        data={allMedia}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderItem}
      />
      <Toaster/>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131324',
  },
  mediaContainer: {
    width: width - 20,
    height: height - 150,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    marginHorizontal: 10,
  },
  media: {
    width: '100%',
    height: '100%',
  },
  goBackButton: {
    position: 'absolute',
    top: 20,
    left: 10,
    zIndex: 10,
  },
  topRightActions: {
    position: 'absolute',
    top: 20,
    right: 10,
    flexDirection: 'column',
    gap: 10,
    alignItems: 'center',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 10,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    width: 35,
    height: 35,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
    marginBottom: 10,
  },
  uploadProgress: {
    position: 'absolute',
    bottom: 55,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 17.5,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'white',
    marginRight: 8,
  },
});

export default MediaGallery;