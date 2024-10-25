import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { initiatePushRoute, confirmRoute } from '../utils/APIRoutes';

const BuyTicket = React.forwardRef(({ eventId, eventTitle, price, onSuccess, userId }, ref) => {
  const [phoneNo, setPhoneNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [checkoutRequestId, setCheckoutRequestId] = useState('');
  const [step, setStep] = useState('initial');

  const handleInitiatePayment = async () => {
    if (phoneNo.length !== 9) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid 9-digit phone number.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(initiatePushRoute, {
        phone: `254${phoneNo}`,
        amount: price,
        Order_ID: `EVENT-${eventId}_${userId}`,
        eventTitle: eventTitle
      });

      if (response.data.CheckoutRequestID) {
        setCheckoutRequestId(response.data.CheckoutRequestID);
        setStep('initiated');
        Alert.alert('Payment Initiated', 'Please check your phone for the M-Pesa prompt and enter your PIN.');
      } else {
        throw new Error('Failed to initiate payment');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    setLoading(true);
    setStep('checking');
    try {
      const response = await axios.post(confirmRoute, {
        CheckoutRequestID: checkoutRequestId
      });

      console.log(response.data, checkoutRequestId)
      if (response.data.success) {
        setPaymentStatus('success');
        Alert.alert('Success', 'Payment completed successfully!');

        // Notify parent about success
        onSuccess();
        // Close the sheet
        ref.current.close();
      } else {
        setPaymentStatus('failed');
        Alert.alert('Payment Failed', response.data.resultDesc);
        setStep('initiated');
      }
      
    } catch (error) {
      setPaymentStatus('failed');
      Alert.alert('Error', 'Failed to confirm payment status. Please try again.');
      setStep('initiated');
    } finally {
      setLoading(false);
    }
  };

  const renderButton = () => {
    switch (step) {
      case 'initial':
        return (
          <TouchableOpacity
            style={[styles.button, (loading || phoneNo.length !== 9) && styles.disabledButton]}
            onPress={handleInitiatePayment}
            disabled={loading || phoneNo.length !== 9}
          >
            <Text style={styles.buttonText}>Initiate Payment</Text>
          </TouchableOpacity>
        );
      case 'initiated':
        return (
          <TouchableOpacity
            style={[styles.button, loading && styles.disabledButton]}
            onPress={handleCheckStatus}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Check Payment Status</Text>
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  return (
    <RBSheet ref={ref} height={400} openDuration={250} customStyles={{ container: styles.sheetContainer }}>
      <LinearGradient colors={['#1e1e36', '#131324']} style={styles.gradientBackground}>
        <View style={styles.content}>
          <Text style={styles.title}>Buy Ticket</Text>
          <Text style={styles.price}>Price: KES {price}</Text>
          {step === 'initial' && (
            <>
              <Text style={styles.label}>Enter M-Pesa Phone Number</Text>
              <View style={styles.phoneInputContainer}>
                <Text style={styles.phonePrefix}>+254</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={phoneNo}
                  onChangeText={(value) => setPhoneNo(value.replace(/[^0-9]/g, '').slice(0, 9))}
                  placeholder="7XX XXX XXX"
                  placeholderTextColor="#6c6c7c"
                  maxLength={9}
                  editable={step === 'initial'}
                />
              </View>
            </>
          )}
          {step !== 'initial' && (
            <Text style={styles.statusText}>
              {step === 'initiated' && 'Payment initiated. Please complete the payment on your phone.'}
              {step === 'checking' && 'Checking payment status...'}
            </Text>
          )}
          {loading && <ActivityIndicator color="#4CD964" style={styles.loader} />}
          {renderButton()}
          {paymentStatus === 'failed' && (
            <Text style={styles.errorText}>Payment failed. Please try again.</Text>
          )}
        </View>
      </LinearGradient>
    </RBSheet>
  );
});

const styles = StyleSheet.create({
  sheetContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  gradientBackground: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  price: {
    fontSize: 18,
    color: '#4CD964',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#fff',
    alignSelf: 'flex-start',
    marginBottom: 5,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  phonePrefix: {
    fontSize: 16,
    color: '#fff',
    marginRight: 5,
  },
  input: {
    borderBottomWidth: 2,
    borderColor: '#4CD964',
    color: '#fff',
    fontSize: 16,
    paddingVertical: 5,
    minWidth: 200,
  },
  button: {
    backgroundColor: '#4CD964',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#2a2a4a',
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusText: {
    color: '#fff',
    textAlign: 'center',
    marginVertical: 10,
  },
  loader: {
    marginVertical: 10,
  },
  errorText: {
    color: '#ff6b6b',
    marginTop: 10,
  },
});

export default BuyTicket;
