# VibeMap Debugging Guide

## Common Issues & Solutions

### 1. "Missing Permissions" / Firestore Permission Denied
**Symptom**: Console Red Error `FirebaseError: Missing or insufficient permissions`.
**Cause**: The action violates `firestore.rules`.
**Fix**:
1. Check `firestore.rules` in the root.
2. Ensure the user is authenticated.
3. If writing to `notifications`, check if `create` is allowed.
4. If Admin action, ensure `admin_privileges` document exists for the user.

### 2. Notifications Not Clearing
**Symptom**: User clicks notification or undoes action, but badge remains.
**Cause**: Race condition between read/write or UI state vs Server state.
**Fix**:
- We use a "Retry" logic in `removeNotification`.
- Ensure `targetId` format matches exactly (e.g., `undo-comment-delete:POST_ID:COMMENT_ID`).

### 3. Roots Page Loop
**Symptom**: User stuck on Roots page.
**Cause**: `isNewUser` flag not clearing.
**Fix**:
- `App.tsx` only clears `isNewUser` when `Roots` component invokes `onBack`.
- Ensure user actually clicks "Back" or "Join".

### 4. Build Failures (TypeScript)
**Symptom**: `npm run build` fails.
**Fix**:
- Usually strict null checks.
- Check `vite-env.d.ts` for global types.
- Ensure all imports are absolute or correctly relative.

## Debugging Tools
1. **Console Logs**: Use the browser console.
2. **React Developer Tools**: Inspect component state (`user`, `posts`).
3. **Firebase Console**: Check real-time data in Firestore Data viewer.
