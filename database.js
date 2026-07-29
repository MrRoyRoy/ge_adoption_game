const { Firestore } = require('@google-cloud/firestore');

// Initialize Firestore client with project context
const firestore = new Firestore({
  projectId: process.env.PROJECT_ID || 'ge-edu-demo'
});

const ROOMS_COLLECTION = 'rooms';
const PLAYERS_COLLECTION = 'players';

/**
 * Initialize / verify Firestore connection
 */
async function initDatabase() {
  try {
    console.log('Initializing Cloud Firestore connection...');
    // Quick ping to verify connectivity
    await firestore.collection(ROOMS_COLLECTION).limit(1).get();
    console.log('Cloud Firestore initialized successfully.');
  } catch (err) {
    console.error('Error connecting to Cloud Firestore:', err);
  }
}

/**
 * Clean up heavy player payloads and images for rooms older than 1 day
 */
async function purgeExpiredRooms() {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const expiredRoomsSnap = await firestore.collection(ROOMS_COLLECTION)
      .where('created_at', '<', oneDayAgo)
      .get();

    if (expiredRoomsSnap.empty) {
      console.log('No expired rooms to purge.');
      return;
    }

    const batch = firestore.batch();
    for (const roomDoc of expiredRoomsSnap.docs) {
      const playersSnap = await roomDoc.ref.collection(PLAYERS_COLLECTION).get();
      playersSnap.forEach(pDoc => {
        // Clear heavy base64 and evaluation data but keep user row
        batch.update(pDoc.ref, {
          user_image_base64: null,
          evaluation_json: null,
          submitted_prompt: null
        });
      });
    }

    await batch.commit();
    console.log('Successfully purged heavy player submission states for expired rooms (>24h).');
  } catch (err) {
    console.error('Error purging expired rooms in Firestore:', err);
  }
}

// Helper methods mirroring previous SQLite structure for clean async interface

/**
 * Get room by ID
 */
async function getRoom(roomId) {
  const doc = await firestore.collection(ROOMS_COLLECTION).doc(roomId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

/**
 * Create or update room
 */
async function upsertRoom(roomId, data) {
  const roomRef = firestore.collection(ROOMS_COLLECTION).doc(roomId);
  const doc = await roomRef.get();
  if (!doc.exists) {
    await roomRef.set({
      id: roomId,
      status: 'LOBBY',
      game_mode: 'GAME1',
      active_master_index: 0,
      created_by_email: 'anonymous@google.com',
      created_at: new Date().toISOString(),
      ...data
    });
  } else if (Object.keys(data).length > 0) {
    await roomRef.update(data);
  }
  return getRoom(roomId);
}

/**
 * Update room fields
 */
async function updateRoom(roomId, data) {
  const roomRef = firestore.collection(ROOMS_COLLECTION).doc(roomId);
  await roomRef.update(data);
}

/**
 * Get all rooms
 */
async function getAllRooms() {
  const snap = await firestore.collection(ROOMS_COLLECTION)
    .orderBy('created_at', 'desc')
    .get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Delete room and its players
 */
async function deleteRoom(roomId) {
  const roomRef = firestore.collection(ROOMS_COLLECTION).doc(roomId);
  const playersSnap = await roomRef.collection(PLAYERS_COLLECTION).get();
  
  const batch = firestore.batch();
  playersSnap.forEach(doc => batch.delete(doc.ref));
  batch.delete(roomRef);
  await batch.commit();
}

/**
 * Get player doc
 */
async function getPlayer(roomId, username) {
  const doc = await firestore.collection(ROOMS_COLLECTION)
    .doc(roomId)
    .collection(PLAYERS_COLLECTION)
    .doc(username)
    .get();
  if (!doc.exists) return null;
  return { username: doc.id, ...doc.data() };
}

/**
 * Add or update player
 */
async function upsertPlayer(roomId, username, data = {}) {
  const playerRef = firestore.collection(ROOMS_COLLECTION)
    .doc(roomId)
    .collection(PLAYERS_COLLECTION)
    .doc(username);

  const doc = await playerRef.get();
  if (!doc.exists) {
    await playerRef.set({
      username,
      room_id: roomId,
      score: 0,
      accumulated_score: 0,
      submitted_prompt: null,
      user_image_base64: null,
      evaluation_json: null,
      game2_state_json: null,
      has_submitted: 0,
      ...data
    });
  } else if (Object.keys(data).length > 0) {
    await playerRef.update(data);
  }

  return getPlayer(roomId, username);
}

/**
 * Update player doc directly
 */
async function updatePlayer(roomId, username, data) {
  const playerRef = firestore.collection(ROOMS_COLLECTION)
    .doc(roomId)
    .collection(PLAYERS_COLLECTION)
    .doc(username);
  await playerRef.set(data, { merge: true });
}

/**
 * Get all players in a room sorted by field
 */
async function getRoomPlayers(roomId, orderByField = 'score', direction = 'desc') {
  const snap = await firestore.collection(ROOMS_COLLECTION)
    .doc(roomId)
    .collection(PLAYERS_COLLECTION)
    .get();

  const players = snap.docs.map(doc => ({ username: doc.id, ...doc.data() }));
  
  // In-memory sort to avoid requiring composite indexes for small dynamic room rosters
  players.sort((a, b) => {
    const valA = a[orderByField] || 0;
    const valB = b[orderByField] || 0;
    return direction === 'desc' ? valB - valA : valA - valB;
  });

  return players;
}

/**
 * Reset all player round states in a room
 */
async function resetRoomPlayers(roomId, game2StateJson = null) {
  const playersSnap = await firestore.collection(ROOMS_COLLECTION)
    .doc(roomId)
    .collection(PLAYERS_COLLECTION)
    .get();

  if (playersSnap.empty) return;

  const batch = firestore.batch();
  playersSnap.forEach(doc => {
    batch.update(doc.ref, {
      score: 0,
      submitted_prompt: null,
      user_image_base64: null,
      evaluation_json: null,
      game2_state_json: game2StateJson,
      has_submitted: 0
    });
  });
  await batch.commit();
}

/**
 * Get stats for analytics portal
 */
async function getAnalyticsStats() {
  const roomsSnap = await firestore.collection(ROOMS_COLLECTION).get();
  
  const latestRooms = [];
  const creatorCounts = {};

  for (const doc of roomsSnap.docs) {
    const roomData = doc.data();
    const playersSnap = await doc.ref.collection(PLAYERS_COLLECTION).get();
    
    latestRooms.push({
      room_id: doc.id,
      created_by_email: roomData.created_by_email || 'anonymous@google.com',
      game_mode: roomData.game_mode || 'GAME1',
      status: roomData.status || 'LOBBY',
      created_at: roomData.created_at,
      user_count: playersSnap.size
    });

    const email = roomData.created_by_email;
    if (email && email !== 'anonymous@google.com') {
      creatorCounts[email] = (creatorCounts[email] || 0) + 1;
    }
  }

  // Sort latest rooms descending
  latestRooms.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  // Top creators array
  const topCreators = Object.entries(creatorCounts)
    .map(([created_by_email, total_games_created]) => ({ created_by_email, total_games_created }))
    .sort((a, b) => b.total_games_created - a.total_games_created)
    .slice(0, 10);

  return { latestRooms, topCreators };
}

module.exports = {
  firestore,
  initDatabase,
  purgeExpiredRooms,
  getRoom,
  upsertRoom,
  updateRoom,
  getAllRooms,
  deleteRoom,
  getPlayer,
  upsertPlayer,
  updatePlayer,
  getRoomPlayers,
  resetRoomPlayers,
  getAnalyticsStats
};
