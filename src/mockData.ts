import { Post, RSVPStatus, HotSpotArea, User } from './types';



// --- MOCK DATA GENERATORS ---

const PLACE_NAMES = [
  'Open Tap', 'Cyber Hub Social', 'Downtown Diner', 'Whisky Samba', 'Cocktails & Dreams',
  'Soi 7', 'Molecule', 'Prankster', 'Big Boyz Lounge', 'Walking Street',
  'Viet:Nom', 'Burma Burma', 'The Wine Company', 'Manhattan', 'Striker'
];

const VIBE_TAGS = ['Techno', 'Jazz', 'Networking', 'Chilling', 'Partying', 'Dating', 'Rooftop', 'Live Music'];

// 50 Real Users with Categories
const REAL_USERS = [
  // 1-7 (Users)
  { name: 'Karun', handle: 'karun_kruz', type: 'User' },
  { name: 'Ashish', handle: 'ash_vibes', type: 'User' },
  { name: 'Gautam', handle: 'gautam_zone', type: 'User' },
  { name: 'CB', handle: 'cb_original', type: 'User' },
  { name: 'Nikhil', handle: 'nick_hill', type: 'User' },
  { name: 'Kanuj', handle: 'kanuj_plays', type: 'User' },
  { name: 'Krishav', handle: 'krishav_xyz', type: 'User' },
  // 8 (Influencer)
  { name: 'Vivaan', handle: 'tech_vivaan', type: 'Influencer', niche: 'Gadgets' },
  // 9 (User)
  { name: 'Ishaan', handle: 'ishaan_ice', type: 'User' },
  // 10 (Influencer)
  { name: 'Riaan', handle: 'riaan_roams', type: 'Influencer', niche: 'Travelling' },
  // 11-13 (Users)
  { name: 'Shaurya', handle: 'shaurya_bold', type: 'User' },
  { name: 'Vihaan', handle: 'vihaan_rise', type: 'User' },
  { name: 'Atharv', handle: 'atharv_a1', type: 'User' },
  // 14 (Influencer)
  { name: 'Samar', handle: 'samar_eats', type: 'Influencer', niche: 'Foodie' },
  // 15-17 (Users)
  { name: 'Anay', handle: 'anay_way', type: 'User' },
  { name: 'Krish', handle: 'krish_core', type: 'User' },
  { name: 'Aarush', handle: 'aarush_ray', type: 'User' },
  // 18 (Influencer)
  { name: 'Yuvaan', handle: 'fincap_yuvaan', type: 'Influencer', niche: 'Finance' },
  // 19-22 (Users)
  { name: 'Aditya', handle: 'adi_sun', type: 'User' },
  { name: 'Aryan', handle: 'aryan_arc', type: 'User' },
  { name: 'Rudra', handle: 'rudra_rage', type: 'User' },
  { name: 'Tejas', handle: 'tejas_fast', type: 'User' },
  // 23 (Influencer)
  { name: 'Omkar', handle: 'omkar_plates', type: 'Influencer', niche: 'Foodie' },
  // 24-34 (Users - Note: Mix of Male/Female start here but we treat them as Users)
  { name: 'Pranay', handle: 'pranay_pics', type: 'User' },
  { name: 'Tanay', handle: 'tanay_tunes', type: 'User' },
  { name: 'Richa', handle: 'richa_radiant', type: 'User' },
  { name: 'Priya', handle: 'priya_pop', type: 'User' },
  { name: 'Arushi', handle: 'arushi_arts', type: 'User' },
  { name: 'Shefali', handle: 'shef_styles', type: 'User' },
  { name: 'Shreya', handle: 'shreya_song', type: 'User' },
  { name: 'Manisha', handle: 'mani_moon', type: 'User' },
  { name: 'Ira', handle: 'ira_ink', type: 'User' },
  { name: 'Saanvi', handle: 'saanvi_sky', type: 'User' },
  { name: 'Meera', handle: 'meera_muse', type: 'User' },
  // 35 (Influencer)
  { name: 'Diya', handle: 'style_diya', type: 'Influencer', niche: 'Fashion' },
  // 36-37 (Users)
  { name: 'Ishika', handle: 'ishika_ig', type: 'User' },
  { name: 'Navya', handle: 'navya_new', type: 'User' },
  // 38 (Influencer)
  { name: 'Tanishka', handle: 'glam_tanishka', type: 'Influencer', niche: 'Beauty' },
  // 39-44 (Users)
  { name: 'Vanya', handle: 'vanya_vogue', type: 'User' },
  { name: 'Zoya', handle: 'zesty_zoya', type: 'User' },
  { name: 'Aarohi', handle: 'aarohi_ascend', type: 'User' },
  { name: 'Charvi', handle: 'charvi_charm', type: 'User' },
  { name: 'Kavya', handle: 'kavya_poetry', type: 'User' },
  { name: 'Samaira', handle: 'samaira_star', type: 'User' },
  // 45 (Influencer)
  { name: 'Trisha', handle: 'makeup_trish', type: 'Influencer', niche: 'Makeup' },
  // 46 (User)
  { name: 'Naina', handle: 'naina_views', type: 'User' },
  // 47 (Influencer)
  { name: 'Pari', handle: 'pari_trails', type: 'Influencer', niche: 'Travelling' },
  // 48-49 (Users)
  { name: 'Prisha', handle: 'prisha_pure', type: 'User' },
  { name: 'Siya', handle: 'siya_smile', type: 'User' },
  // 50 (Influencer)
  { name: 'Yashvi', handle: 'invest_yashvi', type: 'Influencer', niche: 'Investment' },
];

// Generate 50 Users from Real List
const generateUsers = (): User[] => {
  return REAL_USERS.map((realUser, i) => {
    const isInfluencer = realUser.type === 'Influencer';
    const isFounder = i === 0;

    // Use specific niche bio for influencers, generic for others
    const bio = isInfluencer
      ? `${realUser.niche} Enthusiast 🌟 Living the vibe!`
      : "Just here for the music and good vibes.";

    return {
      id: `u${i + 1}`,
      displayName: realUser.name,
      handle: realUser.handle,
      avatarUrl: `https://i.pravatar.cc/150?u=${i + 1}`,
      isConnected: Math.random() > 0.7,
      isInfluencer,
      isFounder,
      followersCount: isInfluencer ? 1000 + Math.floor(Math.random() * 5000) : Math.floor(Math.random() * 500),
      bio: bio,
      vibeParams: [VIBE_TAGS[Math.floor(Math.random() * VIBE_TAGS.length)]],
      followedPlaces: ['Open Tap', 'Social Cyber Hub'],
      wishlist: ['Downtown Diner', 'Whisky Samba'], // Mock wishlist items
      frequentPlaces: ['Downtown Diner', 'Whisky Samba'],
      trustScore: isInfluencer ? 95 + Math.floor(Math.random() * 5) : 75 + Math.floor(Math.random() * 20)
    };
  });
};

export const USERS = generateUsers();

const PLACE_OWNERS: User[] = [
  { id: 'p_social', displayName: 'Social Cyber Hub', avatarUrl: 'https://images.unsplash.com/photo-1572116469696-95872127f635?w=150', isPlaceAccount: true, isConnected: false },
  { id: 'p_downtown', displayName: 'Downtown Diner', avatarUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=150', isPlaceAccount: true, isConnected: false },
  { id: 'p_opentap', displayName: 'Open Tap', avatarUrl: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=150', isPlaceAccount: true, isConnected: false }
];

// 3. Mock Posts
export const MOCK_POSTS: Post[] = [
  {
    id: '1',
    user: {
      id: 'u1',
      displayName: 'Karun',
      handle: 'karun_kruz',
      avatarUrl: 'https://picsum.photos/50/50?1',
      isConnected: true,
      trustScore: 85
    },
    location: { name: 'Open Tap', address: 'Golf Course Road' },
    visitDate: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    description: '[Partying] Friday night vibes! 🍻',
    likes: 12,
    comments: [],
    rsvps: { 'currentUser': RSVPStatus.WILL_JOIN },
    imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1974&auto=format&fit=crop',
    userReaction: 'fire'
  },
  {
    id: '2',
    user: {
      id: 'u2',
      displayName: 'Vivaan',
      handle: 'tech_vivaan',
      avatarUrl: 'https://picsum.photos/50/50?2',
      isConnected: false,
      isInfluencer: true,
      trustScore: 92
    },
    location: { name: 'Cyber Hub Social', address: 'Cyber City' },
    visitDate: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    description: '[Networking] Tech meetup was lit! 🔥',
    likes: 45,
    comments: [
      { id: 'c1', userId: 'u3', userName: 'Ishaan', text: 'Missed it!', timestamp: new Date().toISOString() }
    ],
    rsvps: {},
  },
  {
    id: '3',
    user: {
      id: 'u3',
      displayName: 'Ishaan',
      handle: 'ishaan_ice',
      avatarUrl: 'https://picsum.photos/50/50?3',
      isConnected: true,
      trustScore: 78
    },
    location: { name: 'Burma Burma', address: 'Cyber City' },
    visitDate: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    description: '[Dating] Amazing Khao Suey properly authentic.',
    likes: 8,
    comments: [],
    rsvps: {},
  }
];

// --- ACTIVITY & DISCOVERY SHARED DATA ---

export const ACTIVITY_HISTORY = [
  { id: 1, type: 'checkin', place: 'Neon District', time: '2 hours ago', vibe: 'Electric', points: '+50' },
  { id: 2, type: 'event', place: 'Cyber Cafe', time: 'Yesterday', vibe: 'Chill', points: '+30' },
  { id: 3, type: 'connection', place: 'Met Vibers', time: '2 days ago', vibe: 'Social', points: '+15' },
];

export const RADAR_ITEMS = [
  { id: 1, user: 'Nova', location: 'CyberHub Social', time: '10 mins ago', mutuals: 3, avatar: 'https://i.pravatar.cc/150?u=nova' },
  { id: 2, user: 'Glitch', location: 'Cyber Hub', time: '30 mins ago', mutuals: 1, avatar: 'https://i.pravatar.cc/150?u=glitch' },
];
