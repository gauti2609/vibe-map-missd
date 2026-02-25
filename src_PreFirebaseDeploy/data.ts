import { Post, RSVPStatus, HotSpotArea, User } from './types';

export const HOT_SPOTS: HotSpotArea[] = [
  {
    area: "Cyber City Hub",
    coordinates: { lat: 28.4950, lng: 77.0895 },
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
    coordinates: { lat: 28.4690, lng: 77.0700 }, // Approx Sector 29
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
    coordinates: { lat: 28.4595, lng: 77.0980 }, // Further down Golf Course Rd
    places: [
      { name: "Whisky Samba", count: 110, trend: 'up', category: 'bar' },
      { name: "Manhattan", count: 85, trend: 'stable', category: 'club' },
      { name: "Open Tap", count: 72, trend: 'down', category: 'pub' },
    ]
  }
];

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
      username: realUser.handle, // We might need to add this property to types.ts if using it explicitly, or just put it in bio/display
      avatarUrl: `https://i.pravatar.cc/150?u=${i + 1}`,
      isConnected: Math.random() > 0.7,
      isInfluencer,
      isFounder,
      followersCount: isInfluencer ? 1000 + Math.floor(Math.random() * 5000) : Math.floor(Math.random() * 500),
      bio: bio,
      vibeParams: [VIBE_TAGS[Math.floor(Math.random() * VIBE_TAGS.length)]],
      followedPlaces: ['Open Tap', 'Social Cyber Hub'],
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

// Generate Posts
const generatePosts = (): Post[] => {
  const posts: Post[] = [];
  const now = new Date();

  // Helper to add days
  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const createPost = (id: string, user: User, dayOffset: number, isFuture: boolean, forcedPlace?: string) => {
    // If it's a place account, use its own name as location
    const placeName = user.isPlaceAccount ? user.displayName : (forcedPlace || PLACE_NAMES[Math.floor(Math.random() * PLACE_NAMES.length)]);

    return {
      id,
      user,
      location: { name: placeName, address: 'Gurgaon' },
      visitDate: addDays(now, dayOffset).toISOString(),
      description: user.isPlaceAccount
        ? `Special event tonight! Don't miss out. #Vibe #Nightlife`
        : (isFuture ? `Can't wait for this weekend! #Excited` : `Had a blast! #Throwback`),
      likes: Math.floor(Math.random() * 50),
      comments: [],
      rsvps: {},
      imageUrl: `https://picsum.photos/seed/${id}/400/300`,
      distanceKm: parseFloat((Math.random() * 20).toFixed(1)) // Random 0-20km
    };
  };

  // 1. Ensure first 4 users (Influencers) have BOTH Past and Future posts
  for (let i = 0; i < 4; i++) {
    const user = USERS[i];
    posts.push(createPost(`fixed_past_${i}`, user, -1 * (Math.floor(Math.random() * 5) + 1), false));
    posts.push(createPost(`fixed_future_${i}`, user, (Math.floor(Math.random() * 5) + 1), true));
  }

  // 2. Place Owner Posts (Mocking activity from places)
  PLACE_OWNERS.forEach((owner, i) => {
    posts.push(createPost(`place_post_${i}`, owner, i, true));
  });

  // 3. Random Past & Future Posts
  for (let i = 0; i < 20; i++) {
    const user = USERS[Math.floor(Math.random() * USERS.length)];
    // Randomize if future or past
    const isFuture = Math.random() > 0.4;
    const offset = isFuture ? (Math.floor(Math.random() * 10) + 1) : -1 * (Math.floor(Math.random() * 10) + 1);

    // Explicitly make some posts about "Open Tap" for testing logic
    const forcedPlace = (i % 5 === 0) ? 'Open Tap' : undefined;

    posts.push(createPost(`rand_${i}`, user, offset, isFuture, forcedPlace));
  }

  // 4. Dummy Check-in Post
  const checkInUser = USERS[Math.floor(Math.random() * USERS.length)];
  posts.unshift({ // Add to top
    id: 'checkin_demo',
    user: checkInUser,
    location: { name: 'Cyber Hub Social', address: 'Gurgaon' },
    visitDate: new Date().toISOString(),
    description: `Just checked in! The vibe is absolutely electric tonight. ⚡ #CyberHub #FridayNight`,
    likes: 42,
    comments: [],
    rsvps: {},
    imageUrl: 'https://images.unsplash.com/photo-1514525253440-b393332569ca?w=800', // Pub/bar vibe
    distanceKm: 0.1
  });

  return posts.sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());
};

export const MOCK_POSTS = generatePosts();

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
