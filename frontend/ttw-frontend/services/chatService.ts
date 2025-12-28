import { Booking, Listing } from '../types';

const API_URL = import.meta.env.VITE_API_URL as string;

// Helper to get headers with token
const getHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

// --- CHAT SERVICES (FIXED) ---

export const getChatRoom = async (bookingId: string) => {
    const res = await fetch(`${API_URL}/chat/bookings/${bookingId}/`, {
        headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to get chat room");
    return res.json();
};

export const getMessages = async (bookingId: string) => {
    const res = await fetch(`${API_URL}/chat/bookings/${bookingId}/messages/`, {
        headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to get messages");
    return res.json();
};

export const sendMessage = async (bookingId: string, text: string) => {
    console.log(`Sending message to ${bookingId}:`, text);
    
    const res = await fetch(`${API_URL}/chat/bookings/${bookingId}/messages/`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ 
            text: text  // <--- KEY FIX: Backend expects "text", NOT "message"
        }) 
    });

    if (!res.ok) {
        const err = await res.json();
        console.error("Send message failed:", err);
        throw new Error(err.detail || "Failed to send message");
    }
    
    return res.json();
};

export const markMessagesAsSeen = async (bookingId: string) => {
    const res = await fetch(`${API_URL}/chat/bookings/${bookingId}/seen/`, {
        method: "PATCH",
        headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to mark seen");
    return res.json();
};

// ... existing imports

// ADD THIS FUNCTION
export const getProviderChats = async () => {
    const res = await fetch(`${API_URL}/chat/provider/`, {
        headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to get provider chats");
    return res.json();
};

// ... keep existing functions (getChatRoom, getMessages, sendMessage, markMessagesAsSeen)