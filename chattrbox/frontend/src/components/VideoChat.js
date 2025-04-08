import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Container, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import Peer from 'simple-peer';
import io from 'socket.io-client';

// Use the host's IP address for network access
const SERVER_URL = 'http://192.168.1.100:5000'; // Replace with your actual IP address

const socket = io(SERVER_URL, {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5
});

const VideoChat = () => {
  const [stream, setStream] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [peer, setPeer] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [error, setError] = useState(null);
  const [partnerLeft, setPartnerLeft] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();

  useEffect(() => {
    // Socket connection status
    socket.on('connect', () => {
      console.log('Connected to server');
      setConnectionStatus('connected');
      setError(null);
    });

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setError('Failed to connect to server. Please check your network connection.');
      setConnectionStatus('error');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnectionStatus('disconnected');
    });

    // Get user's media stream
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        console.error('Error accessing media devices:', err);
        setError('Please allow camera and microphone access to use the video chat.');
      });

    // Socket event handlers
    socket.on('user-joined', ({ roomId: newRoomId }) => {
      setRoomId(newRoomId);
      setIsWaiting(false);
      setIsCalling(true);
      setPartnerLeft(false);
    });

    socket.on('signal', ({ signal, userId }) => {
      if (peer) {
        peer.signal(signal);
      }
    });

    socket.on('partner-left', () => {
      setPartnerLeft(true);
      setIsCalling(false);
      if (peer) {
        peer.destroy();
        setPeer(null);
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    });

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      socket.off('connect');
      socket.off('connect_error');
      socket.off('disconnect');
      socket.off('user-joined');
      socket.off('signal');
      socket.off('partner-left');
    };
  }, [peer, stream]);

  const startCall = () => {
    if (connectionStatus !== 'connected') {
      setError('Not connected to server. Please check your network connection.');
      return;
    }
    setIsWaiting(true);
    setError(null);
    setPartnerLeft(false);
    socket.emit('find-partner');
  };

  const endCall = () => {
    if (peer) {
      peer.destroy();
      setPeer(null);
    }
    setIsCalling(false);
    setIsWaiting(false);
    setPartnerLeft(false);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    socket.emit('leave-room', roomId);
  };

  useEffect(() => {
    if (roomId && stream) {
      const newPeer = new Peer({
        initiator: true,
        trickle: false,
        stream: stream
      });

      newPeer.on('signal', data => {
        socket.emit('signal', { signal: data, roomId, userId: socket.id });
      });

      newPeer.on('stream', remoteStream => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      });

      newPeer.on('error', err => {
        console.error('Peer error:', err);
        setError('Connection error occurred. Please try again.');
      });

      setPeer(newPeer);
    }
  }, [roomId, stream]);

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Video Chat
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {connectionStatus === 'error' && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Server connection error. Please check your network and try again.
          </Alert>
        )}

        {partnerLeft && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Your partner has left the chat.
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 4 }}>
          <Box sx={{ width: '45%' }}>
            <Typography variant="h6" gutterBottom>You</Typography>
            <video
              ref={localVideoRef}
              autoPlay
              muted
              style={{ width: '100%', borderRadius: '8px' }}
            />
          </Box>
          
          <Box sx={{ width: '45%' }}>
            <Typography variant="h6" gutterBottom>Stranger</Typography>
            <video
              ref={remoteVideoRef}
              autoPlay
              style={{ width: '100%', borderRadius: '8px' }}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, gap: 2 }}>
          {!isCalling && !isWaiting ? (
            <Button
              variant="contained"
              color="primary"
              onClick={startCall}
              size="large"
              disabled={connectionStatus !== 'connected'}
            >
              Start Random Chat
            </Button>
          ) : isWaiting ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <CircularProgress />
              <Typography>Looking for a stranger...</Typography>
            </Box>
          ) : (
            <Button
              variant="contained"
              color="secondary"
              onClick={endCall}
              size="large"
            >
              End Chat
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default VideoChat; 