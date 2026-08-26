const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'https://dev.get-grounded.app';

export async function identifyMe(token: string): Promise<{ userId: string }> {
  const response = await fetch(`${apiUrl}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Could not reach GetGrounded after sign-up.');
  }

  return (await response.json()) as { userId: string };
}

export async function startVoiceSession(
  token: string,
): Promise<{ conversationToken: string; agentId: string }> {
  const response = await fetch(`${apiUrl}/voice/session`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 503) {
    throw new Error('Voice is not configured on the API yet.');
  }

  if (!response.ok) {
    throw new Error('Could not start a voice session.');
  }

  return (await response.json()) as { conversationToken: string; agentId: string };
}
