# VibeMap Process & Data Flows

## 1. User Authentication Flow
```mermaid
graph TD
    A[User Opens App] --> B{Auth State?}
    B -- Yes --> C[Fetch User Profile (Firestore)]
    C --> D{isNewUser?}
    D -- Yes --> E[Redirect to 'Roots' Onboarding]
    D -- No --> F[Redirect to Feed]
    B -- No --> G[Show Onboarding/Login]
    G --> H[User Enters Details]
    H --> I[Firebase Auth Create]
    I --> J[Create Firestore Document]
    J --> E
```

## 2. Post Creation Flow
1. **User Input**: User types description, uploads image, adds location/vibes.
2. **AI Analysis**: `moderateContent()` checks for safety. If unsafe, block.
3. **Upload**: Image -> Firebase Storage.
4. **Persist**: Post Object -> `posts` collection.
5. **Feed Update**: Real-time listeners in `useFeed` detect new doc and prepend to Feed.

## 3. Notification Flow
**Trigger**: User A comments on User B's post.
1. `PostCard.submitComment()` is called.
2. Comment added to `posts/{id}/comments` array.
3. `notificationService.sendNotification()` is called.
4. **Firestore**: New doc in `notifications` collection { recipient: UserB, sender: UserA, type: 'comment' }.
5. **UI**: `App.tsx` listener sees new notification -> Updates Red Dot / Badge.

## 4. Admin System Flow
**Role Verification**
1. App Header/Profile checks `admin_privileges/{uid}`.
2. If document exists -> Show "Admin Dashboard".
3. **Write Protection**: Firestore Security Rules deny writes to restricted paths unless `request.auth.uid` is in `admin_privileges` with correct role.

**Super Admin Promotion**
1. Super Admin enters email.
2. Lookup UID from email (Requires Admin SDK or Client-side exhaustive search if permissions allow - currently client-side logic limited).
3. Create/Update `admin_privileges/{targetUid}`.
4. Re-authentication via Password required before commit.
