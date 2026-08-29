import type { Utility } from '../types/index.js';

export const UTILITIES: Utility[] = [
  {
    id: 'util-meeting-rooms',
    name: 'Meeting Rooms',
    description: 'Bookable meeting and conference rooms across the office.',
    options: [
      { id: 'opt-mr-1', name: 'Meeting Room 1' },
      { id: 'opt-mr-2', name: 'Meeting Room 2' },
      { id: 'opt-mr-3', name: 'Boardroom' },
    ],
    calendar: {
      enabled: true,
      provider: 'google',
      calendarAddress: 'meetingrooms@bet9ja.com',
      syncMode: 'meeting',
    },
    status: 'active',
    createdAt: '2026-05-10T09:00:00.000Z',
    updatedAt: '2026-05-10T09:00:00.000Z',
  },
  {
    id: 'util-pool-cars',
    name: 'Pool Cars',
    description: 'Company vehicles available for official trips and errands.',
    options: [
      { id: 'opt-pc-1', name: 'Toyota Hiace (LND-234-KJ)' },
      { id: 'opt-pc-2', name: 'Toyota Camry (LND-778-XZ)' },
    ],
    calendar: {
      enabled: true,
      provider: 'outlook',
      calendarAddress: 'poolcars@bet9ja.com',
      syncMode: 'event',
    },
    status: 'active',
    createdAt: '2026-05-12T09:00:00.000Z',
    updatedAt: '2026-05-12T09:00:00.000Z',
  },
  {
    id: 'util-av-equipment',
    name: 'AV Equipment',
    description: 'Projectors, speakers, and video conferencing kits for events and training.',
    options: [
      { id: 'opt-av-1', name: 'Projector A' },
      { id: 'opt-av-2', name: 'Portable PA System' },
    ],
    calendar: {
      enabled: false,
      provider: null,
      calendarAddress: '',
      syncMode: null,
    },
    status: 'active',
    createdAt: '2026-06-01T09:00:00.000Z',
    updatedAt: '2026-06-01T09:00:00.000Z',
  },
];

export const getUtilityById = (id: string): Utility | undefined =>
  UTILITIES.find((u) => u.id === id);
