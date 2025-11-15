# Supabase Real-time Subscriptions Guide

**Document Version:** 1.0
**Task:** P1-W1-SETUP-002
**Feature:** PostgreSQL Change Data Capture via WebSocket
**Technology:** Supabase Realtime (Built on Postgres logical decoding)

## Overview

Real-time subscriptions allow your app to receive instant notifications when database records change. This is critical for Toy-for-Toy to provide live updates on:

- Ticket balance changes
- Incoming exchange requests
- Delivery confirmations
- Chat messages (future)
- Toy listing updates

## Table of Contents

1. [Architecture](#architecture)
2. [Setup & Connection](#setup--connection)
3. [Subscription Patterns](#subscription-patterns)
4. [Examples by Feature](#examples-by-feature)
5. [Advanced Topics](#advanced-topics)
6. [Troubleshooting](#troubleshooting)
7. [Fallback Strategies](#fallback-strategies)

---

## Architecture

### How It Works

```
Your App                 Supabase           PostgreSQL
    ↓                        ↓                    ↓
[Browser]──WebSocket──→[Realtime Router]──→[Logical Decoding]
    ↑                        ↓                    ↓
    └─────Notifications──[WAL Processor]←──[Change Log]
```

1. Browser connects via WebSocket to Supabase Realtime router
2. Realtime router listens to PostgreSQL WAL (Write-Ahead Log)
3. Database changes are captured in real-time
4. Changes are broadcast to subscribed clients
5. Browser receives notifications and updates UI

### Event Types

```
INSERT  - New row created
UPDATE  - Existing row modified
DELETE  - Row deleted
*       - All events
```

### Limitations

- **Best-effort delivery**: Not guaranteed (eventual consistency)
- **No ordering guarantees**: Events may arrive out of order
- **No persistence**: Offline clients miss events
- **Throttling**: Very high-frequency updates may be dropped
- **Connection limits**: Each WebSocket connection counts

### Broadcast vs Postgres Changes

```
Realtime has two channels:

1. postgres_changes
   ├─ Triggered by actual database INSERT/UPDATE/DELETE
   ├─ Lowest latency
   ├─ Requires RLS policies to work correctly
   └─ USE THIS for real data changes

2. broadcast
   ├─ Triggered by application .send()
   ├─ Any data payload
   ├─ Higher latency (not recommended)
   └─ Rarely used, skip for now
```

---

## Setup & Connection

### Enable Realtime on Tables

Realtime is enabled by default on all tables in Supabase projects. If needed, enable per table:

```sql
-- Enable realtime on a table
ALTER TABLE public.toys REPLICA IDENTITY FULL;

-- Verify
SELECT tablename, replica_identity FROM pg_tables
WHERE schemaname = 'public';

-- Expected output:
-- toys      | f (default)  or 'd' (full)
```

### Initialize Supabase Client

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Realtime connection is automatic
// WebSocket connects on first subscription
```

### Basic Subscription

```typescript
// 1. Create channel
const channel = supabase
  .channel('user_tickets')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'tickets',
      filter: `user_id=eq.${session.user.id}`
    },
    (payload) => {
      console.log('Ticket updated:', payload);
    }
  )
  .subscribe();

// 2. Cleanup when done
channel.unsubscribe();
```

---

## Subscription Patterns

### Pattern 1: Listen to Own Data

```typescript
// Listen to changes in OWN profile
const profileChannel = supabase
  .channel('my_profile')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'profiles',
      filter: `user_id=eq.${session.user.id}`
    },
    (payload) => {
      setProfile(payload.new);
    }
  )
  .subscribe();
```

### Pattern 2: Listen to Public Updates

```typescript
// Listen to ANY active toy being created or deleted
// (used for live discovery feed)
const toysChannel = supabase
  .channel('active_toys')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'toys',
      filter: 'is_active=eq.true'
    },
    (payload) => {
      console.log('New toy listed:', payload.new);
      // Add to discovery feed
    }
  )
  .subscribe();
```

### Pattern 3: Listen to Multi-User Events

```typescript
// Listen to exchanges where I'm participant
const exchangesChannel = supabase
  .channel('my_exchanges')
  .on(
    'postgres_changes',
    {
      event: '*',  // All events
      schema: 'public',
      table: 'exchanges',
      filter: `requester_id=eq.${uid}|owner_id=eq.${uid}`
    },
    (payload) => {
      if (payload.eventType === 'INSERT') {
        console.log('New exchange request:', payload.new);
      } else if (payload.eventType === 'UPDATE') {
        console.log('Exchange updated:', payload.new);
      }
    }
  )
  .subscribe();
```

### Pattern 4: Listen with State Management

```typescript
// React Hook pattern
function useRealtimeTickets(userId: string) {
  const [tickets, setTickets] = useState(null);

  useEffect(() => {
    // Initial load
    supabase
      .from('tickets')
      .select('*')
      .eq('user_id', userId)
      .single()
      .then(({ data }) => setTickets(data));

    // Real-time updates
    const channel = supabase
      .channel(`tickets_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tickets',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          setTickets(payload.new);
        }
      )
      .subscribe();

    return () => channel.unsubscribe();
  }, [userId]);

  return tickets;
}

// Usage
const MyComponent = () => {
  const session = useSession();
  const tickets = useRealtimeTickets(session.user.id);

  return (
    <div>
      Available: {tickets?.total_balance - (tickets?.frozen_listing_tickets + tickets?.frozen_exchange_tickets)}
    </div>
  );
};
```

---

## Examples by Feature

### Ticket Balance Updates

```typescript
// Subscribe to own ticket changes
const ticketChannel = supabase
  .channel('my_tickets')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'tickets',
      filter: `user_id=eq.${session.user.id}`
    },
    (payload) => {
      const { total_balance, frozen_listing_tickets, frozen_exchange_tickets } = payload.new;
      const available = total_balance - (frozen_listing_tickets + frozen_exchange_tickets);

      // Update UI
      setBalance({
        total: total_balance,
        frozen: frozen_listing_tickets + frozen_exchange_tickets,
        available: available
      });

      // Show toast notification
      showNotification(`Balance updated! Available: ${available} tickets`);
    }
  )
  .subscribe();
```

### Incoming Exchange Requests

```typescript
// Listen for new exchange requests as owner
const incomingChannel = supabase
  .channel('incoming_exchanges')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'exchanges',
      filter: `owner_id=eq.${session.user.id}`
    },
    (payload) => {
      const exchange = payload.new;

      // Fetch toy details for notification
      supabase
        .from('toys')
        .select('description')
        .eq('id', exchange.toy_id)
        .single()
        .then(({ data: toy }) => {
          // Show notification
          showNotification(
            `New exchange request for "${toy.description}"`,
            {
              action: 'View',
              onClick: () => navigateTo(`/exchanges/${exchange.id}`)
            }
          );

          // Refresh exchange list
          refetchMyExchanges();
        });
    }
  )
  .subscribe();
```

### Exchange Status Changes

```typescript
// Listen to exchange I'm involved in
const exchangeChannel = supabase
  .channel(`exchange_${exchangeId}`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'exchanges',
      filter: `id=eq.${exchangeId}`
    },
    (payload) => {
      const { old: oldExchange, new: newExchange } = payload;

      // Check for status transitions
      if (oldExchange.status !== newExchange.status) {
        const statusMessage = {
          'pending_owner_response': 'Owner is reviewing...',
          'exchange_confirmed': 'Exchange confirmed! Delivery in progress.',
          'pending_delivery_confirmation': 'Waiting for delivery confirmation...',
          'exchange_completed': 'Exchange completed! Great trade!',
          'dispute_filed': 'Dispute has been filed.',
          'closed': 'Exchange has been closed.'
        };

        showNotification(statusMessage[newExchange.status]);

        // Update UI
        setExchange(newExchange);
      }
    }
  )
  .subscribe();
```

### Live Toy Discovery Feed

```typescript
// Live updates for marketplace
const discoveryChannel = supabase
  .channel('toy_discovery')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'toys',
      filter: 'is_active=eq.true'
    },
    (payload) => {
      // Add new toy to top of feed
      const newToy = payload.new;
      setToys((prev) => [newToy, ...prev.slice(0, 19)]);  // Keep top 20

      // Optional: Highlight as "just added"
      setHighlightedToys((prev) => [...prev, newToy.id]);
      setTimeout(() => {
        setHighlightedToys((prev) => prev.filter((id) => id !== newToy.id));
      }, 5000);
    }
  )
  .on(
    'postgres_changes',
    {
      event: 'DELETE',
      schema: 'public',
      table: 'toys',
      filter: 'is_active=eq.true'
    },
    (payload) => {
      // Remove from feed
      setToys((prev) => prev.filter((toy) => toy.id !== payload.old.id));
    }
  )
  .subscribe();
```

### Toy Status Updates

```typescript
// Listen to toy owner's updates to their listing
const toyChannel = supabase
  .channel(`toy_${toyId}`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'toys',
      filter: `id=eq.${toyId}`
    },
    (payload) => {
      const { old: oldToy, new: newToy } = payload;

      // Detect if toy became inactive
      if (oldToy.is_active && !newToy.is_active) {
        showNotification('This toy is no longer available.');
        setToyClosed(true);
      }

      // Update toy details
      setToy(newToy);
    }
  )
  .subscribe();
```

---

## Advanced Topics

### Multiple Filters

```typescript
// Listen to exchanges where I'm requester OR owner
const multiFilterChannel = supabase
  .channel('all_my_exchanges')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'exchanges',
      filter: `requester_id=eq.${uid}|owner_id=eq.${uid}`  // OR filter
    },
    (payload) => {
      console.log('Exchange updated:', payload.new);
    }
  )
  .subscribe();
```

### Debouncing High-Frequency Updates

```typescript
// If updates come in very fast, debounce to avoid UI thrashing
const [tickets, setTickets] = useState(null);
const updateTimeoutRef = useRef(null);

const handleTicketUpdate = (payload) => {
  clearTimeout(updateTimeoutRef.current);

  updateTimeoutRef.current = setTimeout(() => {
    setTickets(payload.new);
  }, 500);  // Wait 500ms for batch of updates
};

const channel = supabase
  .channel('my_tickets')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'tickets',
      filter: `user_id=eq.${uid}`
    },
    handleTicketUpdate
  )
  .subscribe();
```

### Combining with Initial Query

```typescript
// Best practice: Load initial state + listen for updates
async function initializeTickets(userId) {
  // 1. Fetch current state
  const { data: initialTickets } = await supabase
    .from('tickets')
    .select('*')
    .eq('user_id', userId)
    .single();

  setTickets(initialTickets);

  // 2. Subscribe to future changes
  const channel = supabase
    .channel(`tickets_${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'tickets',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        // Only update if newer than current
        if (payload.new.updated_at > tickets.updated_at) {
          setTickets(payload.new);
        }
      }
    )
    .subscribe();

  return () => channel.unsubscribe();
}
```

### Handling Offline Events

```typescript
// Track online/offline status
useEffect(() => {
  const handleOnline = () => {
    setIsOnline(true);
    // Refetch data when coming back online
    refetchTickets();
  };

  const handleOffline = () => {
    setIsOnline(false);
    // Show offline indicator
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []);

// Use in component
return (
  <>
    {!isOnline && <OfflineAlert />}
    {/* ... */}
  </>
);
```

---

## Troubleshooting

### Issue: Subscription Not Receiving Updates

**Cause 1: RLS Policy Denies Access**

```typescript
// Check RLS policies allow reading the data
// If user cannot SELECT, they won't get updates

// Solution: Ensure RLS policies exist and are correct
CREATE POLICY "users_own_tickets"
  ON tickets
  FOR SELECT
  USING (auth.uid() = user_id);
```

**Cause 2: Wrong Filter**

```typescript
// BAD: Filter doesn't match user
filter: `user_id=eq.wrong-uuid`

// GOOD: Use session user
filter: `user_id=eq.${session.user.id}`
```

**Cause 3: WebSocket Not Connected**

```typescript
// Check browser console for WebSocket errors
// Enable debug logging
const channel = supabase
  .channel('my_channel')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'toys' },
    (payload) => console.log('Update:', payload)
  )
  .subscribe((status) => {
    console.log('Channel status:', status);  // 'SUBSCRIBED' or 'CLOSED'
  });
```

**Cause 4: Table Not Configured for Realtime**

```sql
-- Check if table has replica identity
SELECT tablename, replica_identity FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r';

-- If replica_identity is 'n' (default), enable it:
ALTER TABLE public.toys REPLICA IDENTITY FULL;
```

### Issue: Duplicate Messages

Realtime may deliver the same message twice (at-least-once delivery):

```typescript
// Track processed update IDs
const processedUpdates = useRef(new Set());

const channel = supabase
  .channel('my_channel')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'tickets' },
    (payload) => {
      const updateId = `${payload.new.id}-${payload.new.updated_at}`;

      if (!processedUpdates.current.has(updateId)) {
        processedUpdates.current.add(updateId);
        setTickets(payload.new);

        // Clean up old IDs (prevent memory leak)
        if (processedUpdates.current.size > 1000) {
          processedUpdates.current.clear();
        }
      }
    }
  )
  .subscribe();
```

### Issue: High Network Usage

```typescript
// Reduce subscription frequency
const [updateCount, setUpdateCount] = useState(0);

const channel = supabase
  .channel('my_channel')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'toys' },
    (payload) => {
      // Only update UI every 3rd message
      setUpdateCount((prev) => {
        if ((prev + 1) % 3 === 0) {
          setToy(payload.new);
        }
        return prev + 1;
      });
    }
  )
  .subscribe();
```

---

## Fallback Strategies

### Polling Fallback

```typescript
// If realtime fails, fall back to polling
const [realtimeConnected, setRealtimeConnected] = useState(true);

useEffect(() => {
  const channel = supabase
    .channel('my_tickets')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'tickets', filter: `user_id=eq.${uid}` },
      (payload) => setTickets(payload.new)
    )
    .subscribe((status) => {
      setRealtimeConnected(status === 'SUBSCRIBED');
    });

  // Fallback polling
  const pollInterval = setInterval(async () => {
    if (!realtimeConnected) {
      const { data } = await supabase
        .from('tickets')
        .select('*')
        .eq('user_id', uid)
        .single();

      if (data) setTickets(data);
    }
  }, 5000);  // Poll every 5 seconds if disconnected

  return () => {
    clearInterval(pollInterval);
    channel.unsubscribe();
  };
}, [realtimeConnected, uid]);
```

### Automatic Reconnection

```typescript
// Supabase client handles reconnection, but you can add custom logic

let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

const channel = supabase
  .channel('my_channel')
  .on('postgres_changes', { ... }, handler)
  .subscribe(
    (status) => {
      if (status === 'SUBSCRIBED') {
        reconnectAttempts = 0;
        console.log('Connected');
      } else if (status === 'CLOSED') {
        // Attempt to reconnect
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          setTimeout(() => {
            channel.subscribe();
          }, 1000 * reconnectAttempts);  // Exponential backoff
        }
      }
    }
  );
```

### Graceful Degradation

```typescript
// App works fine without realtime (just less responsive)

const MyComponent = () => {
  const [tickets, setTickets] = useState(null);
  const [isLiveUpdate, setIsLiveUpdate] = useState(false);

  // Initial load
  useEffect(() => {
    loadTickets();
  }, []);

  // Try to enable realtime
  useEffect(() => {
    const channel = supabase
      .channel(`tickets_${uid}`)
      .on('postgres_changes', { ... }, (payload) => {
        setTickets(payload.new);
        setIsLiveUpdate(true);
      })
      .subscribe((status) => {
        if (status === 'CLOSED') {
          setIsLiveUpdate(false);
        }
      });

    return () => channel.unsubscribe();
  }, [uid]);

  return (
    <>
      {!isLiveUpdate && <small>Not connected to live updates</small>}
      <div>Balance: {tickets?.total_balance}</div>
    </>
  );
};
```

---

## Best Practices

1. **Always unsubscribe** when component unmounts
2. **Filter to specific users** to reduce bandwidth
3. **Combine with initial query** for consistency
4. **Handle offline scenarios** gracefully
5. **Use realtime for critical updates** (tickets, exchanges)
6. **Poll for nice-to-have features** (discovery feed)
7. **Test on slow networks** (throttle in DevTools)
8. **Monitor WebSocket connection** in production

---

**Document End**
