const userContexts = new Map();

export async function getContext(userId) {
  if (!userContexts.has(userId)) userContexts.set(userId, []);
  return userContexts.get(userId);
}

export async function updateContext(userId, newContext) {
  userContexts.set(userId, newContext);
}
