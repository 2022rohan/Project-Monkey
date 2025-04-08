import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Container, Typography, Paper, CircularProgress } from '@mui/material';
import Peer from 'simple-peer';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

const VideoChat = () => {
  const [stream, setStream] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [peer, setPeer] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();

  useEffect(() => {
    // Get user's media stream
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      })
      .catch(err => console.error('Error accessing media devices:', err));

    // Socket event handlers
    socket.on('user-joined', ({ roomId: newRoomId }) => {
      setRoomId(newRoomId);
      setIsWaiting(false);
      setIsCalling(true);
    });

    socket.on('signal', ({ signal, userId }) => {
      if (peer) {
        peer.signal(signal);
      }
    });

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      socket.off('user-joined');
      socket.off('signal');
    };
  }, [peer, stream]);

  const startCall = () => {
    setIsWaiting(true);
    socket.emit('find-partner');
  };

  const endCall = () => {
    if (peer) {
      peer.destroy();
      setPeer(null);
    }
    setIsCalling(false);
    setIsWaiting(false);
    setRoomId(null);
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

      setPeer(newPeer);
    }
  }, [roomId, stream]);

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Video Chat
        </Typography>
        
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