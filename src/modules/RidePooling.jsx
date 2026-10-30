
import React, { useEffect, useState } from 'react';
import {
  Car,
  MapPin,
  Clock,
  ShieldCheck,
  Leaf,
  Users,
  Calculator,
  Search,
  PlusCircle,
  UserPlus,
  Bell,
  CheckCircle,
  MessageCircle,
  Send,
  X,
} from 'lucide-react';

import { MODULES } from '../data/seed';
import { supabase } from '../lib/supabase';

export default function RidePooling() {
  const moduleData = MODULES.find((m) => m.id === 'ride-pooling');
  const sampleRoutes = moduleData?.sampleRoutes || [];

  // Emission calculator state
  const [commuteDistance, setCommuteDistance] = useState(12);
  const [coRiders, setCoRiders] = useState(3);

  // Supabase state
  const [rides, setRides] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [bookedRideIds, setBookedRideIds] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Chat state
  const [chatRides, setChatRides] = useState([]);
  const [activeChatRide, setActiveChatRide] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const [loadingRides, setLoadingRides] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [joiningRideId, setJoiningRideId] = useState(null);
  const [markingReadId, setMarkingReadId] = useState(null);

  // Status messages
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  // Offer Ride form state
  const [rideFrom, setRideFrom] = useState('');
  const [rideTo, setRideTo] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [availableSeats, setAvailableSeats] = useState('2');

  // Find Ride search state
  const [searchDestination, setSearchDestination] = useState('');

  // Fetch rides
  async function fetchRides() {
    const { data, error } = await supabase
      .from('rides')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching rides:', error);
      setMessage(`Could not load rides: ${error.message}`);
      setMessageType('error');
      setLoadingRides(false);
      return;
    }

    const formattedRides = (data || []).map((ride) => ({
      ...ride,
      from: ride.pickup_location,
      to: ride.destination,
      corridor: `${ride.pickup_location} -> ${ride.destination}`,
      departureTime: ride.departure_time,
      seats: ride.available_seats,
      driverType: 'Student Commuter',
      estDistanceKm: 0,
    }));

    setRides(formattedRides);
    setLoadingRides(false);
  }

  // Fetch notifications
  async function fetchNotifications(userId) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      return;
    }

    setNotifications(data || []);
  }

  // Fetch rides already booked by this passenger
  async function fetchMyBookings(userId) {
    const { data, error } = await supabase
      .from('ride_bookings')
      .select('ride_id')
      .eq('passenger_id', userId);

    if (error) {
      console.error('Error fetching bookings:', error);
      return;
    }

    setBookedRideIds((data || []).map((booking) => booking.ride_id));
  }

  // Fetch all ride conversations involving the current student
  async function fetchChatRides(userId) {
    const { data: allRides, error: ridesError } = await supabase
      .from('rides')
      .select('*')
      .order('created_at', { ascending: false });

    if (ridesError) {
      console.error('Could not fetch chat rides:', ridesError);
      return;
    }

    const { data: bookings, error: bookingsError } = await supabase
      .from('ride_bookings')
      .select('ride_id, passenger_id');

    if (bookingsError) {
      console.error('Could not fetch ride participants:', bookingsError);
      return;
    }

    const myRides = (allRides || []).filter((ride) => {
      return (
        ride.driver_id === userId ||
        (bookings || []).some(
          (booking) =>
            booking.ride_id === ride.id &&
            booking.passenger_id === userId
        )
      );
    });

    if (myRides.length === 0) {
      setChatRides([]);
      return;
    }

    const rideIds = myRides.map((ride) => ride.id);

    const rideBookings = (bookings || []).filter((booking) =>
      rideIds.includes(booking.ride_id)
    );

    const participantIds = [
      ...new Set([
        ...myRides.map((ride) => ride.driver_id),
        ...rideBookings.map((booking) => booking.passenger_id),
      ]),
    ];

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', participantIds);

    if (profilesError) {
      console.error('Could not fetch student profiles:', profilesError);
      return;
    }

    const profileMap = {};

    (profiles || []).forEach((profile) => {
      profileMap[profile.id] = profile.full_name || 'Student';
    });

    const formattedChats = myRides
      .map((ride) => {
        const passengers = rideBookings
          .filter((booking) => booking.ride_id === ride.id)
          .map((booking) => ({
            id: booking.passenger_id,
            name: profileMap[booking.passenger_id] || 'Student',
          }));

        return {
          ...ride,
          driverName: profileMap[ride.driver_id] || 'Student',
          passengers,
          participants: [
            {
              id: ride.driver_id,
              name: profileMap[ride.driver_id] || 'Student',
            },
            ...passengers,
          ],
        };
      })
      .filter((ride) => ride.participants.length > 1);

    setChatRides(formattedChats);
  }

  // Fetch previous messages for a ride
  async function fetchChatMessages(rideId) {
    setLoadingMessages(true);

    const { data, error } = await supabase
      .from('ride_messages')
      .select('*')
      .eq('ride_id', rideId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Could not load messages:', error);
      setMessage(`Could not load chat: ${error.message}`);
      setMessageType('error');
      setLoadingMessages(false);
      return;
    }

    setChatMessages(data || []);
    setLoadingMessages(false);
  }

  // Open a ride conversation
  async function handleOpenChat(ride) {
    setActiveChatRide(ride);
    setChatMessages([]);
    setNewChatMessage('');
    setMessage('');

    await fetchChatMessages(ride.id);

    // Scroll to the selected chat
    setTimeout(() => {
      document.getElementById('ride-chat-window')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);
  }

  // Open chat using notification's ride ID
  async function handleOpenNotificationChat(rideId) {
    if (!rideId) {
      setMessage('This notification is not linked to a ride.');
      setMessageType('error');
      return;
    }

    let ride = chatRides.find((item) => item.id === rideId);

    // Refresh conversations if the ride is not already in the list
    if (!ride && currentUserId) {
      await fetchChatRides(currentUserId);

      const { data: rideData, error } = await supabase
        .from('rides')
        .select('*')
        .eq('id', rideId)
        .single();

      if (error || !rideData) {
        setMessage('Could not find this ride conversation.');
        setMessageType('error');
        return;
      }

      const { data: bookings, error: bookingsError } = await supabase
        .from('ride_bookings')
        .select('passenger_id')
        .eq('ride_id', rideId);

      if (bookingsError) {
        setMessage('Could not load ride participants.');
        setMessageType('error');
        return;
      }

      const participantIds = [
        rideData.driver_id,
        ...(bookings || []).map((booking) => booking.passenger_id),
      ];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', participantIds);

      if (profilesError) {
        setMessage('Could not load participant names.');
        setMessageType('error');
        return;
      }

      const profileMap = {};

      (profiles || []).forEach((profile) => {
        profileMap[profile.id] = profile.full_name || 'Student';
      });

      const passengers = (bookings || []).map((booking) => ({
        id: booking.passenger_id,
        name: profileMap[booking.passenger_id] || 'Student',
      }));

      ride = {
        ...rideData,
        driverName: profileMap[rideData.driver_id] || 'Student',
        passengers,
        participants: [
          {
            id: rideData.driver_id,
            name: profileMap[rideData.driver_id] || 'Student',
          },
          ...passengers,
        ],
      };
    }

    if (!ride) {
      setMessage('Could not find this ride conversation.');
      setMessageType('error');
      return;
    }

    await handleOpenChat(ride);
  }

  // Close a ride conversation
  function handleCloseChat() {
    setActiveChatRide(null);
    setChatMessages([]);
    setNewChatMessage('');
  }

  // Send a chat message
  async function handleSendMessage(event) {
    event.preventDefault();

    const text = newChatMessage.trim();

    if (!text || !activeChatRide || !currentUserId) return;

    setSendingMessage(true);

    const { data, error } = await supabase
      .from('ride_messages')
      .insert({
        ride_id: activeChatRide.id,
        sender_id: currentUserId,
        message: text,
      })
      .select()
      .single();

    if (error) {
      console.error('Could not send message:', error);
      setMessage(`Could not send message: ${error.message}`);
      setMessageType('error');
    } else {
      setChatMessages((previous) => {
        if (previous.some((item) => item.id === data.id)) {
          return previous;
        }

        return [...previous, data];
      });

      setNewChatMessage('');
      setMessage('');
    }

    setSendingMessage(false);
  }

  // Initial loading + Realtime subscriptions
  useEffect(() => {
    let channel;
    let isMounted = true;

    async function initializeRidePooling() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        if (isMounted) {
          setMessage('Please log in to use RidePooling.');
          setMessageType('error');
          setLoadingRides(false);
        }
        return;
      }

      if (!isMounted) return;

      setCurrentUserId(user.id);

      await Promise.all([
        fetchRides(),
        fetchNotifications(user.id),
        fetchMyBookings(user.id),
        fetchChatRides(user.id),
      ]);

      if (!isMounted) return;

      channel = supabase
        .channel(`ride-pooling-${user.id}`)

        // Listen for ride creation and seat-count updates
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'rides',
          },
          () => {
            fetchRides();
            fetchChatRides(user.id);
            fetchMyBookings(user.id);
          }
        )

        // Listen for new bookings
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'ride_bookings',
          },
          () => {
            fetchChatRides(user.id);
            fetchMyBookings(user.id);
          }
        )

        // Listen for notifications sent to this student
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${user.id}`,
          },
          (payload) => {
            setNotifications((previous) => [
              payload.new,
              ...previous,
            ]);
          }
        )
        .subscribe();
    }

    initializeRidePooling();

    return () => {
      isMounted = false;

      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // Listen for new messages in the selected ride chat
  useEffect(() => {
    if (!activeChatRide || !currentUserId) return;

    const channel = supabase
      .channel(`ride-chat-${activeChatRide.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ride_messages',
          filter: `ride_id=eq.${activeChatRide.id}`,
        },
        (payload) => {
          setChatMessages((previous) => {
            if (previous.some((item) => item.id === payload.new.id)) {
              return previous;
            }

            return [...previous, payload.new];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChatRide?.id, currentUserId]);

  // Emission calculations
  const soloKg = commuteDistance * 0.17;
  const pooledKg = soloKg / (coRiders + 1);
  const savedKg = soloKg - pooledKg;

  // Search available rides
  const filteredRides = rides.filter((ride) => {
    const query = searchDestination.trim().toLowerCase();

    return (
      ride.seats > 0 &&
      (!query ||
        ride.to.toLowerCase().includes(query) ||
        ride.from.toLowerCase().includes(query) ||
        ride.corridor.toLowerCase().includes(query))
    );
  });

  // Publish a ride
  async function handleOfferRide(event) {
    event.preventDefault();
    setMessage('');

    if (!rideFrom.trim() || !rideTo.trim() || !departureTime) {
      setMessage('Please fill in all ride details.');
      setMessageType('error');
      return;
    }

    if (rideFrom.trim().toLowerCase() === rideTo.trim().toLowerCase()) {
      setMessage('Starting point and destination cannot be the same.');
      setMessageType('error');
      return;
    }

    setPublishing(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('Please log in before publishing a ride.');
      }

      const { error } = await supabase
        .from('rides')
        .insert({
          driver_id: user.id,
          pickup_location: rideFrom.trim(),
          destination: rideTo.trim(),
          departure_time: departureTime,
          available_seats: Number(availableSeats),
        });

      if (error) throw error;

      setMessage('Ride published successfully!');
      setMessageType('success');

      setRideFrom('');
      setRideTo('');
      setDepartureTime('');
      setAvailableSeats('2');

      await fetchRides();
    } catch (error) {
      console.error('Error publishing ride:', error);
      setMessage(error.message || 'Could not publish ride.');
      setMessageType('error');
    } finally {
      setPublishing(false);
    }
  }

  // Join a ride
  async function handleJoinRide(rideId) {
    setMessage('');
    setJoiningRideId(rideId);

    try {
      const { data, error } = await supabase.rpc('join_ride', {
        p_ride_id: rideId,
      });

      if (error) throw error;

      setBookedRideIds((previous) =>
        previous.includes(rideId)
          ? previous
          : [...previous, rideId]
      );

      setMessage(
        `Ride confirmed! You've successfully joined this ride. ${data.remaining_seats} seat(s) remaining.`
      );
      setMessageType('success');

      await Promise.all([
        fetchRides(),
        fetchMyBookings(currentUserId),
        fetchChatRides(currentUserId),
      ]);
    } catch (error) {
      console.error('Error joining ride:', error);

      let errorMessage = error.message || 'Could not join this ride.';

      if (errorMessage.toLowerCase().includes('duplicate key')) {
        errorMessage = 'You have already joined this ride.';
      }

      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      setJoiningRideId(null);
    }
  }

  // Mark notification as read
  async function handleMarkRead(notificationId) {
    setMarkingReadId(notificationId);

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('recipient_id', currentUserId);

    if (error) {
      console.error('Could not update notification:', error);
      setMessage(`Could not mark notification as read: ${error.message}`);
      setMessageType('error');
      setMarkingReadId(null);
      return;
    }

    setNotifications((previous) =>
      previous.map((notification) =>
        notification.id === notificationId
          ? { ...notification, is_read: true }
          : notification
      )
    );

    setMarkingReadId(null);
  }

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  return (
    <div className="ride-pooling-module">

      {/* Module overview */}
      <div className="uni-card" style={{ marginBottom: '24px' }}>
        <div className="uni-card-header">
          <div className="uni-card-title">
            <ShieldCheck size={20} color="var(--brand-green-700)" />
            <span>Smart Campus Ride-Pooling & Commuter Mobility</span>
          </div>
        </div>

        <div className="uni-card-body">
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            {moduleData?.description}
          </p>

          <div className="uni-grid-3">
            <div>
              <MapPin size={22} color="var(--brand-green-700)" />
              <strong>Corridor Route Bundling</strong>
              <p>
                Find commuters travelling along similar routes to reduce
                redundant vehicle trips.
              </p>
            </div>

            <div>
              <ShieldCheck size={22} color="var(--brand-green-700)" />
              <strong>Verified Campus Identity</strong>
              <p>
                Designed for institutional authentication of campus
                drivers and passengers.
              </p>
            </div>

            <div>
              <Leaf size={22} color="var(--brand-green-700)" />
              <strong>Estimated Emission Offsets</strong>
              <p>
                Estimate potential carbon savings when students share
                their commute.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Ride booking notifications */}
      <div className="uni-card" style={{ marginBottom: '24px' }}>
        <div className="uni-card-header">
          <div className="uni-card-title">
            <Bell size={20} color="var(--brand-green-700)" />
            <span>Ride Booking Notifications</span>
          </div>

          <span className="uni-badge uni-badge-neutral">
            {unreadCount} Unread
          </span>
        </div>

        <div className="uni-card-body">
          {notifications.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>
              No booking notifications yet. You'll see a notification here
              when another student joins one of your rides.
            </p>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                style={{
                  padding: '14px',
                  marginBottom: '10px',
                  borderRadius: '10px',
                  background: notification.is_read
                    ? 'var(--bg-canvas)'
                    : 'var(--surface-secondary, var(--bg-canvas))',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', gap: '10px', flex: 1 }}>
                  <CheckCircle
                    size={20}
                    color="var(--brand-green-700)"
                  />

                  <div>
                    <strong>
                      {notification.is_read
                        ? 'Booking notification'
                        : 'New ride booking!'}
                    </strong>

                    <p style={{ margin: '5px 0' }}>
                      {notification.message}
                    </p>

                    <small style={{ color: 'var(--text-secondary)' }}>
                      {new Date(notification.created_at).toLocaleString()}
                    </small>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {notification.ride_id && (
                    <button
                      type="button"
                      className="uni-button"
                      onClick={() =>
                        handleOpenNotificationChat(notification.ride_id)
                      }
                    >
                      <MessageCircle size={16} />
                      Open Chat
                    </button>
                  )}

                  {!notification.is_read && (
                    <button
                      type="button"
                      className="uni-button"
                      disabled={markingReadId === notification.id}
                      onClick={() => handleMarkRead(notification.id)}
                    >
                      <CheckCircle size={16} />
                      {markingReadId === notification.id
                        ? 'Updating...'
                        : 'Mark as Read'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* My Ride Chats */}
      <div className="uni-card" style={{ marginBottom: '24px' }}>
        <div className="uni-card-header">
          <div className="uni-card-title">
            <MessageCircle size={20} color="var(--brand-green-700)" />
            <span>My Ride Chats</span>
          </div>

          <span className="uni-badge uni-badge-neutral">
            {chatRides.length} Conversations
          </span>
        </div>

        <div className="uni-card-body">
          {chatRides.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>
              No ride conversations yet. Once someone joins your ride
              or you book a ride, your chat will appear here.
            </p>
          ) : (
            chatRides.map((ride) => (
              <div
                key={ride.id}
                style={{
                  padding: '14px 0',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: '1 1 220px' }}>
                  <strong>
                    {ride.pickup_location} → {ride.destination}
                  </strong>

                  <p style={{ margin: '5px 0' }}>
                    Driver: {ride.driverName}
                  </p>

                  <small style={{ color: 'var(--text-secondary)' }}>
                    Participants:{' '}
                    {ride.participants
                      .map((person) => person.name)
                      .join(', ')}
                  </small>
                </div>

                <button
                  type="button"
                  className="uni-button"
                  onClick={() => handleOpenChat(ride)}
                >
                  <MessageCircle size={16} />
                  Open Chat
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Selected Ride Chat */}
      {activeChatRide && (
        <div
          id="ride-chat-window"
          className="uni-card"
          style={{ marginBottom: '24px' }}
        >
          <div className="uni-card-header">
            <div className="uni-card-title">
              <Users size={20} color="var(--brand-green-700)" />
              <span>Ride Conversation</span>
            </div>

            <button
              type="button"
              className="uni-button"
              onClick={handleCloseChat}
            >
              <X size={16} />
              Close Chat
            </button>
          </div>

          <div className="uni-card-body">
            <strong>
              {activeChatRide.pickup_location} →{' '}
              {activeChatRide.destination}
            </strong>

            <p style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>
              Driver: {activeChatRide.driverName}
            </p>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              {activeChatRide.participants.map((person) => (
                <span
                  key={person.id}
                  className="uni-badge uni-badge-neutral"
                >
                  {person.name}
                  {person.id === currentUserId ? ' (You)' : ''}
                </span>
              ))}
            </div>

            {/* Message history */}
            <div
              style={{
                minHeight: '220px',
                maxHeight: '350px',
                overflowY: 'auto',
                padding: '14px',
                background: 'var(--bg-canvas)',
                borderRadius: '10px',
                marginBottom: '16px',
              }}
            >
              {loadingMessages ? (
                <p>Loading messages...</p>
              ) : chatMessages.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>
                  No messages yet. Say hello and coordinate your ride!
                </p>
              ) : (
                chatMessages.map((chatMessage) => {
                  const sender = activeChatRide.participants.find(
                    (person) => person.id === chatMessage.sender_id
                  );

                  const isMine =
                    chatMessage.sender_id === currentUserId;

                  return (
                    <div
                      key={chatMessage.id}
                      style={{
                        display: 'flex',
                        justifyContent: isMine ? 'flex-end' : 'flex-start',
                        marginBottom: '12px',
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '80%',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          background: isMine
                            ? 'var(--surface-secondary, #dcfce7)'
                            : 'var(--surface)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <strong style={{ fontSize: '13px' }}>
                          {isMine ? 'You' : sender?.name || 'Student'}
                        </strong>

                        <p
                          style={{
                            margin: '5px 0',
                            overflowWrap: 'anywhere',
                          }}
                        >
                          {chatMessage.message}
                        </p>

                        <small style={{ color: 'var(--text-secondary)' }}>
                          {new Date(chatMessage.created_at).toLocaleString()}
                        </small>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Send message */}
            <form
              onSubmit={handleSendMessage}
              style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
              }}
            >
              <input
                className="uni-input"
                type="text"
                placeholder="Type your message..."
                value={newChatMessage}
                onChange={(event) =>
                  setNewChatMessage(event.target.value)
                }
                maxLength={2000}
                disabled={sendingMessage}
                required
              />

              <button
                type="submit"
                className="uni-button"
                disabled={sendingMessage || !newChatMessage.trim()}
              >
                <Send size={16} />
                {sendingMessage ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Offer a ride */}
      <div className="uni-card" style={{ marginBottom: '24px' }}>
        <div className="uni-card-header">
          <div className="uni-card-title">
            <PlusCircle size={20} color="var(--brand-green-700)" />
            <span>Offer a Ride</span>
          </div>
        </div>

        <div className="uni-card-body">
          <form onSubmit={handleOfferRide}>
            <div className="uni-grid-2">
              <div className="uni-form-group">
                <label className="uni-label" htmlFor="ride-from">
                  Starting Point
                </label>

                <input
                  id="ride-from"
                  className="uni-input"
                  type="text"
                  placeholder="e.g. Andheri Station"
                  value={rideFrom}
                  onChange={(event) => setRideFrom(event.target.value)}
                  required
                />
              </div>

              <div className="uni-form-group">
                <label className="uni-label" htmlFor="ride-to">
                  Destination
                </label>

                <input
                  id="ride-to"
                  className="uni-input"
                  type="text"
                  placeholder="e.g. SPIT Campus"
                  value={rideTo}
                  onChange={(event) => setRideTo(event.target.value)}
                  required
                />
              </div>

              <div className="uni-form-group">
                <label className="uni-label" htmlFor="ride-time">
                  Departure Time
                </label>

                <input
                  id="ride-time"
                  className="uni-input"
                  type="time"
                  value={departureTime}
                  onChange={(event) => setDepartureTime(event.target.value)}
                  required
                />
              </div>

              <div className="uni-form-group">
                <label className="uni-label" htmlFor="ride-seats">
                  Available Seats
                </label>

                <select
                  id="ride-seats"
                  className="uni-input"
                  value={availableSeats}
                  onChange={(event) => setAvailableSeats(event.target.value)}
                >
                  <option value="1">1 seat</option>
                  <option value="2">2 seats</option>
                  <option value="3">3 seats</option>
                  <option value="4">4 seats</option>
                  <option value="5">5 seats</option>
                </select>
              </div>
            </div>

            <button
              className="uni-button"
              type="submit"
              disabled={publishing}
            >
              <Car size={17} />
              {publishing ? 'Publishing...' : 'Publish Ride'}
            </button>
          </form>

          {message && (
            <p
              role="status"
              style={{
                marginTop: '12px',
                color: messageType === 'error'
                  ? 'var(--danger, #dc2626)'
                  : 'var(--brand-green-700)',
              }}
            >
              {message}
            </p>
          )}
        </div>
      </div>

      {/* Find and join a ride */}
      <div className="uni-card" style={{ marginBottom: '24px' }}>
        <div className="uni-card-header">
          <div className="uni-card-title">
            <Search size={20} color="var(--brand-green-700)" />
            <span>Find a Ride</span>
          </div>

          <span className="uni-badge uni-badge-neutral">
            {filteredRides.length} Available
          </span>
        </div>

        <div className="uni-card-body">
          <div className="uni-form-group">
            <label className="uni-label" htmlFor="ride-search">
              Search by starting point or destination
            </label>

            <input
              id="ride-search"
              className="uni-input"
              type="search"
              placeholder="Try Andheri or SPIT Campus..."
              value={searchDestination}
              onChange={(event) => setSearchDestination(event.target.value)}
            />
          </div>

          {loadingRides ? (
            <p>Loading rides from Supabase...</p>
          ) : filteredRides.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>
              No available rides match your search. Try another destination
              or offer a new ride.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredRides.map((ride) => {
                const isDriver = ride.driver_id === currentUserId;
                const hasJoined = bookedRideIds.includes(ride.id);

                return (
                  <div
                    key={ride.id}
                    style={{
                      padding: '16px 0',
                      borderBottom: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '16px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ flex: '1 1 220px' }}>
                      <strong>
                        {ride.from} → {ride.to}
                      </strong>

                      <div style={{ marginTop: '6px' }}>
                        <Users
                          size={15}
                          style={{ verticalAlign: 'middle' }}
                        />
                        {' '}{ride.seats} seat(s) available
                      </div>

                      <div style={{ marginTop: '4px' }}>
                        <Clock
                          size={15}
                          style={{ verticalAlign: 'middle' }}
                        />
                        {' '}{ride.departureTime}
                      </div>

                      <div
                        style={{
                          marginTop: '4px',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {ride.driverType}
                      </div>
                    </div>

                    <button
                      className="uni-button"
                      type="button"
                      disabled={
                        isDriver ||
                        hasJoined ||
                        ride.seats <= 0 ||
                        joiningRideId === ride.id
                      }
                      onClick={() => handleJoinRide(ride.id)}
                    >
                      <UserPlus size={16} />

                      {isDriver
                        ? 'Your Ride'
                        : hasJoined
                          ? 'Joined'
                          : joiningRideId === ride.id
                            ? 'Joining...'
                            : 'Join Ride'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {message && (
            <p
              role="status"
              style={{
                marginTop: '12px',
                color: messageType === 'error'
                  ? 'var(--danger, #dc2626)'
                  : 'var(--brand-green-700)',
              }}
            >
              {message}
            </p>
          )}
        </div>
      </div>

      {/* Emission calculator */}
      <div className="uni-card" style={{ marginBottom: '24px' }}>
        <div className="uni-card-header">
          <div className="uni-card-title">
            <Calculator size={20} color="var(--brand-green-700)" />
            <span>Commuter Emission Estimation Model</span>
          </div>

          <span className="uni-badge uni-badge-neutral">
            Mathematical Model
          </span>
        </div>

        <div className="uni-card-body">
          <div className="uni-grid-2">
            <div>
              <div className="uni-form-group">
                <label className="uni-label">
                  One-Way Commute Distance: {commuteDistance} km
                </label>

                <input
                  type="range"
                  min="2"
                  max="40"
                  value={commuteDistance}
                  onChange={(event) =>
                    setCommuteDistance(Number(event.target.value))
                  }
                  style={{ width: '100%' }}
                  aria-label="Commute distance in kilometers"
                />
              </div>

              <div className="uni-form-group">
                <label className="uni-label">
                  Number of Co-Riders Sharing Trip: {coRiders} Passengers
                </label>

                <input
                  type="range"
                  min="1"
                  max="5"
                  value={coRiders}
                  onChange={(event) =>
                    setCoRiders(Number(event.target.value))
                  }
                  style={{ width: '100%' }}
                  aria-label="Number of co-riders"
                />
              </div>

              <p>
                Model assumption: approximately 0.17 kg CO₂ per vehicle
                kilometer. This is a simplified illustrative estimate.
              </p>
            </div>

            <div
              style={{
                padding: '20px',
                borderRadius: '12px',
                background: 'var(--bg-canvas)',
                textAlign: 'center',
              }}
            >
              <div>Estimated Net Avoided Emissions</div>
              <h2>{savedKg.toFixed(2)} kg CO₂e</h2>

              <p>
                Baseline solo trip: {soloKg.toFixed(2)} kg CO₂e vs.
                pooled trip: {pooledKg.toFixed(2)} kg CO₂e per passenger.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sample route reference */}
      <div className="uni-card">
        <div className="uni-card-header">
          <div>
            <div className="uni-card-title">
              <MapPin size={20} color="var(--brand-green-700)" />
              <span>Original Sample Route Corridors</span>
            </div>

            <div className="uni-card-desc">
              Reference data provided by the UniVerse prototype.
            </div>
          </div>
        </div>

        <div className="uni-card-body">
          {sampleRoutes.map((route) => (
            <div
              key={route.id}
              style={{
                padding: '12px 0',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <strong>{route.corridor}</strong>

              <div style={{ marginTop: '5px' }}>
                {route.driverType} • {route.estDistanceKm} km
                {' • '}{route.availableSeats} sample seats
                {' • '}{route.departsIn}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
