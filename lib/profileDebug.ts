/**
 * Profile debugging utilities
 */

export const debugProfileData = (context: string, user: any) => {
  console.log(`=== PROFILE DEBUG [${context}] ===`);
  console.log('User object:', user);
  console.log('User structure:', {
    id: user?.id,
    name: user?.name,
    email: user?.email,
    phone: user?.phone,
    address: user?.address,
    first_name: user?.first_name,
    last_name: user?.last_name,
    isGuest: user?.isGuest,
    _fallback: user?._fallback,
  });
  console.log('All user keys:', user ? Object.keys(user) : 'No user');
  console.log('=== END PROFILE DEBUG ===');
};

export const debugCacheData = (queryClient: any, userId: string) => {
  console.log(`=== CACHE DEBUG [userId: ${userId}] ===`);
  
  // Check different query keys
  const newAuthUser = queryClient.getQueryData(['auth', 'user']);
  const oldAuthUser = queryClient.getQueryData(['auth', 'user']);
  const newProfile = queryClient.getQueryData(['user', userId, 'profile']);
  const oldProfile = queryClient.getQueryData(['profile', 'detail', userId]);
  
  console.log('New auth.user cache:', newAuthUser);
  console.log('Old auth.user cache:', oldAuthUser);
  console.log('New profile cache:', newProfile);
  console.log('Old profile cache:', oldProfile);
  console.log('=== END CACHE DEBUG ===');
};
