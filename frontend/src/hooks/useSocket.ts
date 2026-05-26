import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/auth.store';
import type { Notification, Task } from '@/types';

export const useSocket = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket();

    socket.on('notification:new', (n: Notification) => {
      toast.message(n.title, { description: n.message });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    const invalidateBoard = (t: Task) => {
      queryClient.invalidateQueries({ queryKey: ['board', t.projectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    };
    socket.on('task:created', invalidateBoard);
    socket.on('task:updated', invalidateBoard);
    socket.on('task:moved', invalidateBoard);
    socket.on('task:deleted', () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['board'] });
    });
    socket.on('comment:new', () => {
      queryClient.invalidateQueries({ queryKey: ['task'] });
    });

    return () => {
      socket.off('notification:new');
      socket.off('task:created');
      socket.off('task:updated');
      socket.off('task:moved');
      socket.off('task:deleted');
      socket.off('comment:new');
    };
  }, [accessToken, queryClient]);

  useEffect(() => () => disconnectSocket(), []);
};
