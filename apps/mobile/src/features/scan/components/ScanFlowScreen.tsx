import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { useScanFlow } from '../useScanFlow';
import { AddedStep } from './AddedStep';
import { DetectingStep } from './DetectingStep';
import { ReviewStep } from './ReviewStep';
import { ViewfinderStep } from './ViewfinderStep';

export function ScanFlowScreen() {
  const flow = useScanFlow();
  const router = useRouter();
  const close = () => { router.back(); };
  const goPantry = () => { router.replace('/pantry'); };
  const goCook = () => { router.replace('/cook'); };

  switch (flow.step) {
    case 'viewfinder':
      return <ViewfinderStep onCapture={flow.capture} onClose={close} />;
    case 'detecting':
      return <DetectingStep testID="scan-detecting" />;
    case 'review':
      return <ReviewStep flow={flow} onBack={flow.reset} onRescan={flow.reset} />;
    case 'added':
      return flow.summary === null ? (
        <View />
      ) : (
        <AddedStep
          summary={flow.summary}
          onSeeIdeas={goCook}
          onViewPantry={goPantry}
          onClose={close}
        />
      );
  }
}
