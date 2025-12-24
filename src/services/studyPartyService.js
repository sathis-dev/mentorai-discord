import { logger } from '../utils/logger.js';

const activeParties = new Map();

export async function createStudyParty({ topic, duration, hostId, guildId, channelId }) {
  const party = {
    id: `party_${Date.now()}`,
    topic,
    duration,
    hostId,
    guildId,
    channelId,
    participants: [hostId],
    status: 'waiting',
    currentLesson: null,
    createdAt: new Date(),
    startedAt: null,
    bonusXp: 1.5
  };

  activeParties.set(party.id, party);

  setTimeout(() => {
    const p = activeParties.get(party.id);
    if (p && p.status === 'waiting') {
      activeParties.delete(party.id);
    }
  }, 10 * 60 * 1000);

  return party;
}

export async function joinParty(partyId, userId) {
  const party = activeParties.get(partyId);
  
  if (!party) {
    throw new Error('Party not found or has ended');
  }

  if (party.status !== 'waiting') {
    throw new Error('Party has already started');
  }

  if (!party.participants.includes(userId)) {
    party.participants.push(userId);
  }

  return party;
}

export async function startParty(partyId, userId) {
  const party = activeParties.get(partyId);
  
  if (!party) {
    throw new Error('Party not found');
  }

  if (party.hostId !== userId) {
    throw new Error('Only the host can start the party');
  }

  party.status = 'active';
  party.startedAt = new Date();

  setTimeout(() => {
    endParty(partyId);
  }, party.duration * 60 * 1000);

  return party;
}

export async function endParty(partyId) {
  const party = activeParties.get(partyId);
  
  if (!party) return null;

  party.status = 'completed';
  party.endedAt = new Date();

  activeParties.delete(partyId);

  return party;
}

export function getParty(partyId) {
  return activeParties.get(partyId);
}

export function getActiveParties(guildId) {
  return Array.from(activeParties.values())
    .filter(p => p.guildId === guildId && p.status !== 'completed');
}

export default {
  createStudyParty,
  joinParty,
  startParty,
  endParty,
  getParty,
  getActiveParties
};
