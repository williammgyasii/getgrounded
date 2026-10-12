import { NativeModule, requireNativeModule } from 'expo-modules-core';

export type NevoBubbleConfig = {
  label: string;
  hint?: string;
  deepLink: string;
  streakDays: number;
  layoutRevision?: number;
};

declare class NevoBubbleModule extends NativeModule {
  start(config: NevoBubbleConfig): Promise<void>;
  stop(): Promise<void>;
  update(config: NevoBubbleConfig): Promise<void>;
  canDrawOverlays(): Promise<boolean>;
  openOverlaySettings(): Promise<void>;
  addListener(
    event: 'onBubbleDismissed',
    listener: (event: { reason?: string }) => void,
  ): { remove: () => void };
}

export default requireNativeModule<NevoBubbleModule>('NevoBubble');
