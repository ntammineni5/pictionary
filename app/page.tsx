'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';
import { useGameStore } from '@/lib/store';
import { RoomType } from '@/types';

export default function Home() {
  const router = useRouter();
  const { setPlayerId, setPlayerName, setRoom } = useGameStore();

  const [view, setView] = useState<'home' | 'create' | 'join' | 'public'>('home');
  const [name, setName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState<RoomType>('public');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [publicRooms, setPublicRooms] = useState<Array<{ id: string; name: string; playerCount: number; gameState: string }>>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const socket = getSocket();

    socket.on('room:created', ({ roomId, room }) => {
      setPlayerId(socket.id!);
      setRoom(room);
      router.push(`/room/${roomId}`);
    });

    socket.on('room:joined', ({ room, playerId }) => {
      setPlayerId(playerId);
      setRoom(room);
      router.push(`/room/${room.id}`);
    });

    socket.on('rooms:list', (rooms) => {
      setPublicRooms(rooms);
    });

    socket.on('error', (message) => {
      setError(message);
    });

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off('room:created');
      socket.off('room:joined');
      socket.off('rooms:list');
      socket.off('error');
    };
  }, [router, setPlayerId, setRoom]);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !roomName.trim()) return;

    setPlayerName(name.trim());
    const socket = getSocket();
    socket.emit('room:create', {
      roomName: roomName.trim(),
      roomType,
      playerName: name.trim(),
    });
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !joinRoomId.trim()) return;

    setPlayerName(name.trim());
    const socket = getSocket();
    socket.emit('room:join', {
      roomId: joinRoomId.trim(),
      playerName: name.trim(),
    });
  };

  const handleJoinPublicRoom = (roomId: string) => {
    if (!name.trim()) {
      setError('Please enter your name first');
      return;
    }

    setPlayerName(name.trim());
    const socket = getSocket();
    socket.emit('room:join', {
      roomId,
      playerName: name.trim(),
    });
  };

  const fetchPublicRooms = () => {
    const socket = getSocket();
    socket.emit('rooms:fetch');
    setView('public');
  };

  if (view === 'home') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-6xl font-bold text-primary-500 dark:text-primary-400 mb-2">Pictionary</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">Draw, Guess, and Win!</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl dark:shadow-gray-900/50 p-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-primary-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg">
                {error}
              </div>
            )}

            <button
              onClick={() => setView('create')}
              disabled={!name.trim()}
              className="w-full px-6 py-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
            >
              Create Room
            </button>

            <button
              onClick={fetchPublicRooms}
              disabled={!name.trim()}
              className="w-full px-6 py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
            >
              Join Public Room
            </button>

            <button
              onClick={() => setView('join')}
              disabled={!name.trim()}
              className="w-full px-6 py-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
            >
              Join Private Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'create') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <button
            onClick={() => setView('home')}
            className="mb-4 text-primary-500 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
          >
            ← Back
          </button>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl dark:shadow-gray-900/50 p-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Create Room</h2>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Room Name
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Enter room name"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-primary-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Room Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRoomType('public')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      roomType === 'public'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                    }`}
                  >
                    <div className="font-semibold dark:text-gray-100">Public</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Anyone can join</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoomType('private')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      roomType === 'private'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                    }`}
                  >
                    <div className="font-semibold dark:text-gray-100">Private</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Invite only</div>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full px-6 py-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-semibold text-lg"
              >
                Create Room
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'join') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <button
            onClick={() => setView('home')}
            className="mb-4 text-primary-500 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
          >
            ← Back
          </button>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl dark:shadow-gray-900/50 p-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Join Private Room</h2>

            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Room ID
                </label>
                <input
                  type="text"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  placeholder="Enter room ID"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-primary-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full px-6 py-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-semibold text-lg"
              >
                Join Room
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'public') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <button
            onClick={() => setView('home')}
            className="mb-4 text-primary-500 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
          >
            ← Back
          </button>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl dark:shadow-gray-900/50 p-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Public Rooms</h2>

            {publicRooms.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p className="text-lg">No public rooms available</p>
                <p className="mt-2">Create a new room to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {publicRooms.map((room) => (
                  <div
                    key={room.id}
                    className="flex items-center justify-between p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 transition-all"
                  >
                    <div>
                      <div className="font-semibold text-lg dark:text-gray-100">{room.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {room.playerCount} players · {room.gameState}
                      </div>
                    </div>
                    <button
                      onClick={() => handleJoinPublicRoom(room.id)}
                      className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
                    >
                      Join
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
