import { Redirect } from 'expo-router';

/** Deep link entry: getgroundedapp://plan */
export default function PlanDeepLink() {
  return <Redirect href="/(app)/(tabs)/talk" />;
}
