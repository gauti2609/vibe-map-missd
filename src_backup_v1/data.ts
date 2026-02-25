import { Post, RSVPStatus, HotSpotArea } from './types';

export const HOT_SPOTS: HotSpotArea[] = [
    {
        area: "Cyber City Hub",
        places: [
            { name: "Social", count: 142, trend: 'up', category: 'pub' },
            { name: "Burma Burma", count: 89, trend: 'stable', category: 'dining' },
            { name: "The Wine Company", count: 65, trend: 'up', category: 'bar' },
            { name: "Viet:Nom", count: 42, trend: 'down', category: 'dining' },
            { name: "Soi 7", count: 38, trend: 'up', category: 'pub' },
        ]
    },
    {
        area: "Sector 29",
        places: [
            { name: "Downtown", count: 120, trend: 'up', category: 'pub' },
            { name: "Molecule", count: 95, trend: 'down', category: 'pub' },
            { name: "Prankster", count: 88, trend: 'stable', category: 'club' },
            { name: "Big Boyz Lounge", count: 70, trend: 'up', category: 'bar' },
            { name: "Walking Street", count: 55, trend: 'down', category: 'dining' },
        ]
    },
    {
        area: "Golf Course Road",
        places: [
            { name: "Whisky Samba", count: 110, trend: 'up', category: 'bar' },
            { name: "Manhattan", count: 85, trend: 'stable', category: 'club' },
            { name: "Open Tap", count: 72, trend: 'down', category: 'pub' },
        ]
    }
];

export const MOCK_POSTS: Post[] = [
  {
    id: '1',
    user: { id: 'u2', displayName: 'TechnoTraveler', avatarUrl: 'https://picsum.photos/50/50?1', isConnected: true },
    location: { name: 'Open Tap', address: 'Sec 67, Gurgaon' },
    visitDate: '2025-12-26T20:00:00',
    description: "Hitting the dance floor this Friday! Who's coming? @JazzSoul #TechnoNight",
    rsvps: { 'u10': RSVPStatus.WILL_JOIN, 'u11': RSVPStatus.MAYBE },
    comments: [
      { id: 'c1', userId: 'u10', userName: 'JazzSoul', text: 'Count me in!', timestamp: '2025-12-25T10:00:00' }
    ],
    likes: 12,
    userReaction: 'fire',
    imageUrl: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: '2',
    user: { id: 'u3', displayName: 'CityLight', avatarUrl: 'https://picsum.photos/50/50?2', isConnected: false },
    location: { name: 'Cyber Hub Social', address: 'Cyber City' },
    visitDate: '2025-12-27T19:00:00',
    description: "Casual drinks and catching up. #WeekendVibes",
    rsvps: {},
    comments: [],
    likes: 5
  },
  {
    id: '3',
    user: { id: 'u4', displayName: 'NeonRider', avatarUrl: 'https://picsum.photos/50/50?3', isConnected: false },
    location: { name: 'Downtown Diner', address: 'Sector 29' },
    visitDate: '2025-12-28T21:00:00',
    description: "Best burgers in town. Anyone around?",
    rsvps: {},
    comments: [],
    likes: 8,
    imageUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: '4',
    user: { id: 'u5', displayName: 'WhiskyGal', avatarUrl: 'https://picsum.photos/50/50?4', isConnected: true },
    location: { name: 'Whisky Samba', address: 'Two Horizon Center' },
    visitDate: '2025-12-28T20:30:00',
    description: "Checking out the new cocktail menu. #FineDining",
    rsvps: { 'u12': RSVPStatus.INTERESTED },
    comments: [],
    likes: 15,
    imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: '5',
    user: { id: 'u6', displayName: 'BassHead', avatarUrl: 'https://picsum.photos/50/50?5', isConnected: false },
    location: { name: 'Toy Room', address: 'Aerocity' },
    visitDate: '2025-12-29T23:00:00',
    description: "Late night scenes! 🐻 #PartyMode",
    rsvps: {},
    comments: [],
    likes: 32
  }
];
