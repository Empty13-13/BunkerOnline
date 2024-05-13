import { io } from "socket.io-client";

const URL = import.meta.env.VITE_SERVER_SOCKET_LINK
export const userSocket = io(URL, {
  path: '/socket/',
  autoConnect: false
});

export const hostSocket = io(URL + 'host', {
  path: '/socket/',
  autoConnect: false
});
