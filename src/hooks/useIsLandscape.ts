import { useWindowDimensions } from 'react-native';

/**
 * Hook que detecta se o dispositivo está em orientação paisagem (landscape).
 * Retorna { isLandscape, width, height } para uso em layouts responsivos.
 */
export function useIsLandscape() {
  const { width, height } = useWindowDimensions();
  return {
    isLandscape: width > height,
    width,
    height,
  };
}
