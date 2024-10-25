import React, { useState, useEffect, useContext, useRef } from 'react';
import { 
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import ThreadCount from '../components/ThreadCount';
import { getCommentsRoute, addCommentRoute, registerEventRoute, deleteCommentRoute, getEventRoute } from '../utils/APIRoutes';
import axios from 'axios';
import BuyTicket from '../components/BuyTicket';
import { toast, Toaster } from 'sonner-native';

const { width: screenWidth } = Dimensions.get('window');

const EventDetails = ({ route }) => {
  const { user, token } = useContext(AuthContext);
  const { event } = route.params;
  const navigation = useNavigation();
  const [eventDeets, setEventDeets] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [imageHeight, setImageHeight] = useState(0);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const bottomSheetRef = useRef();

  useEffect(() => {
    fetchEventDeets();

    if (event.image) {
      Image.getSize(event.image, (width, height) => {
        const imageWidth = screenWidth * 0.7;
        const scaleFactor = imageWidth / width;
        setImageHeight(height * scaleFactor);
      }, (error) => {
        console.error("Couldn't get the image size:", error);
      });
    }
    setIsRegistered(
      event.registeredUsers.some(registeredUser => registeredUser.user.toString() === user._id)
    );
    fetchComments();
  }, [event, user._id]);

  const fetchEventDeets = async () => {
    try {
      const res = await axios.get(getEventRoute(event._id), {
        headers: { Authorization: `Bearer ${token}`}
      });

      setEventDeets(res.data)
    } catch (e) {
      console.error('Error fetching event details: ', e.response.data)
    }
  }

  const fetchComments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(getCommentsRoute(event._id));
      setComments(response.data.comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Failed to load comments. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = async () => {
    try {
      const res = await axios.post(registerEventRoute(event._id), {
        userId: user._id,
      }, { headers: { Authorization: `Bearer ${token}` } });
      // console.log(res.data);
      if (res.status === 200) {
        fetchEventDeets();
        setIsRegistered(true);
        toast.success(res.data.message);
      }
    } catch (e) {
      console.error('Error registering for event:', e);
      setError('Failed to register for the event. Please try again later.');
    };
  }

  const handleRegister = async () => {
    if (event.isPaid) {
      bottomSheetRef.current.open();
    } else {
      try {
        const res = await axios.post(registerEventRoute(event._id), {
          userId: user._id,
        }, { headers: { Authorization: `Bearer ${token}` } });
        // console.log(res.data);
        if (res.status === 200) {
          fetchEventDeets();
          setIsRegistered(true);
          toast.success(res.data.message);
        }
      } catch (e) {
        console.error('Error registering for event:', e);
        setError('Failed to register for the event. Please try again later.');
      };
    };
  };

  const handleAddComment = async () => {
    if (newComment.trim() === '') return;
    setIsLoading(true);
    setError(null);
    try {
      await axios.post(addCommentRoute, {
        eventId: event._id,
        userId: user._id,
        content: newComment,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to add comment. Please try again.');
      setIsLoading(false);
    }
  };

  const handleDeleteComment = async (commentId, userId) => {
    Alert.alert(
      "Delete Comment",
      "Are you sure you want to delete this comment?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "OK", 
          onPress: async () => {
            try {
              const res = await axios.delete(deleteCommentRoute(commentId, userId), {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              })
              toast.success(res.data.msg);
              fetchComments();
            } catch (e) {
              console.error('Error deleting comments: ', e.response);
              Alert.alert('Comment not deleted!')
            }
          }
        }
      ]
    );
  }

  const renderComments = () => {
    if (isLoading) {
      return <ActivityIndicator size="large" color="#4a90e2" />;
    }
    if (error) {
      return <Text style={styles.errorText}>{error}</Text>;
    }
    if (comments.length === 0) {
      return <Text style={styles.noCommentsText}>No comments yet. Be the first to comment!</Text>;
    }
    return comments.map((item) => (
      <View key={item._id} style={styles.commentItem}>
        <Text style={styles.commentUser}>{item.user.username || 'Anonymous'}</Text>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 5}}>
          <Text style={styles.commentText}>{item.content}</Text>
          {user._id === item.user._id ? (
            <TouchableOpacity onPress={() => handleDeleteComment(item._id, user._id)}>
              <MaterialCommunityIcons name="trash-can" size={20} color="#4a90e2" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    ));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <SafeAreaView>
        <ScrollView>
          <Image 
            source={{ uri: event.image }}
            style={styles.blurredBackground}
            blurRadius={10}
          />
          <View style={styles.imageWrapper}>
            <View style={[styles.imageContainer, { height: imageHeight + 90 }]}>
              <Image 
                source={{ uri: event.image }} 
                style={styles.eventImage} 
                resizeMode="stretch" 
              />
              {isRegistered ? (
                <ThreadCount eventId={event._id} token={token} eventTitle={event.title}  />
              ) : (
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'absolute',
                    bottom: 10,
                    right: 10,
                    width: 40,
                    height: 30,
                    borderRadius: 10,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                  }}
                  onPress={handleRegister}
                >
                  <MaterialCommunityIcons name={event.isPaid ? 'ticket-outline' : 'pencil-outline'} size={20} color='#fff' />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.contentContainer}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <View style={styles.eventMetaContainer}>
              <View style={styles.eventMetaItem}>
                <MaterialCommunityIcons name="map-marker" size={20} color="#4a90e2" />
                <Text style={styles.eventMetaText}>{event.location}</Text>
              </View>
              <View style={styles.eventMetaItem}>
                <MaterialCommunityIcons name="calendar" size={20} color="#4a90e2" />
                <Text style={styles.eventMetaText}>{new Date(event.date).toLocaleDateString()}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>About the Event</Text>
            <Text style={styles.descriptionText}>{event.description}</Text>
          </View>

          <View style={styles.commentsContainer}>
            <Text style={styles.sectionTitle}>Comments</Text>
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor="#a0a0b0"
                value={newComment}
                onChangeText={setNewComment}
              />
              <TouchableOpacity style={styles.postButton} onPress={handleAddComment}>
                <Text style={styles.postButtonText}>Post</Text>
              </TouchableOpacity>
            </View>
            {renderComments()}
          </View>
        </ScrollView>
        <BuyTicket ref={bottomSheetRef} eventTitle={event.title} userId={user._id} onSuccess={handleSuccess} eventId={event._id} price={1} />
        <Toaster />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f1f3c',
  },
  imageWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  imageContainer: {
    width: '90%',
    overflow: 'hidden',
    padding: 10
  },
  eventImage: {
    width: '100%',
    height: '100%',
    alignSelf: 'center',
    borderRadius: 10,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: '#1f1f3c',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  eventTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  eventMetaContainer: {
    marginBottom: 15,
  },
  eventMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5
  },
  eventMetaText: {
    fontSize: 16,
    color: '#a0a0b0',
    marginLeft: 5,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 16,
    color: '#a0a0b0',
    lineHeight: 24,
    marginBottom: 20,
  },
  forumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a90e2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: 'center',
  },
  forumButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a90e2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: 'center',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
  commentsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 50,
    backgroundColor: '#1f1f3c',
  },
  commentInputContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#2a2a4c',
    borderRadius: 20,
    padding: 10,
    color: '#fff',
    marginRight: 10,
  },
  postButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 20,
    paddingHorizontal: 15,
    justifyContent: 'center',
  },
  postButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  commentItem: {
    backgroundColor: '#2a2a4c',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  commentUser: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  commentText: {
    fontSize: 14,
    color: '#a0a0b0',
  },
  blurredBackground: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  noCommentsText: {
    fontSize: 14,
    color: 'white'
  }
});

export default EventDetails;