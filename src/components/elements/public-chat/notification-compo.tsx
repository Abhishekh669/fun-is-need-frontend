"use client"

import { Bell, BellDot, Heart, MessageCircle, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Button } from "@/components/ui/button";

// Add this interface for notification types
interface Notification {
  id: string;
  type: 'message' | 'reaction' | 'friend_request' | 'system';
  content: string;
  timestamp: Date;
  read: boolean;
}

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'message',
      content: 'New message from John',
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      read: false,
    },
    {
      id: '2',
      type: 'reaction',
      content: 'Sarah liked your message',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      read: false,
    },
    {
      id: '3',
      type: 'friend_request',
      content: 'Friend request from Alex',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      read: true,
    },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? {...n, read: true} : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({...n, read: true})));
  };

  const getNotificationIcon = (type: string) => {
    switch(type) {
      case 'message':
        return <MessageCircle className="w-4 h-4 mr-2" />;
      case 'reaction':
        return <Heart className="w-4 h-4 mr-2" />;
      case 'friend_request':
        return <UserPlus className="w-4 h-4 mr-2" />;
      default:
        return <Bell className="w-4 h-4 mr-2" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative rounded-full hover:bg-white/20"
        >
          {unreadCount > 0 ? (
            <>
              <BellDot className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                {unreadCount}
              </Badge>
            </>
          ) : (
            <Bell className="h-5 w-5" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-72 max-h-[80vh] overflow-y-auto"
      >
        <div className="px-2 py-1.5 border-b">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Notifications</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs h-6"
            >
              Mark all as read
            </Button>
          </div>
        </div>
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            No notifications yet
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem 
              key={notification.id} 
              className={`py-2 px-3 ${!notification.read ? 'bg-blue-50' : ''}`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="flex items-start gap-2 w-full">
                <div className="mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm">{notification.content}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatTime(notification.timestamp)}
                  </p>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                )}
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}