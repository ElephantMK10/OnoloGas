import { createIconSetFromIcoMoon, Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { ComponentProps } from 'react';

// This component is a workaround to force the bundler to only include the Ionicons font
// and not all the other vector icon fonts.

const CustomIcon = createIconSetFromIcoMoon(
  // We don't need a config file, just the font.
  // The glyph map is embedded in the font file.
  {},
  'Ionicons',
  'Ionicons.ttf'
);

type CustomIconProps = ComponentProps<typeof Ionicons>;

export default (props: CustomIconProps) => {
  const [fontsLoaded] = useFonts({
    Ionicons: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return <CustomIcon {...props} />;
};
