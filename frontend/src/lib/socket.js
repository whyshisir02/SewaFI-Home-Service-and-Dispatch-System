import { io } from 'socket.io-client';
import { API_CONFIG } from '../config/api.config';

let socketInstance = null;

export const getSocket = (token) => {
  if (!socketInstance) {
    socketInstance = io(API_CONFIG.socketURL, {
      autoConnect: false,
      withCredentials: true,
      auth: token ? { token } : undefined,
    });
  } else if (token) {
    socketInstance.auth = { token };
  }

  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};
