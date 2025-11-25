import { useTheme } from '../context/ThemeContext';

export const useColors = () => {
  const { colors } = useTheme();
  return colors;
};
