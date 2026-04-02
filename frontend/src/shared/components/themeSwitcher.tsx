import styled from "@emotion/styled";
import { useThemeSwitcher } from "@/shared/hooks/useTheme";
import { Button } from "@/shared/ui/button";

const ThemeSwitcherContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border-radius: 8px;
  background: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
`;

const ThemeSwitcherTitle = styled.h4`
  color: ${(props) => props.theme.colors.text};
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 8px 0;
`;

const ThemeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
`;

const ThemeButton = styled(Button)<{ isActive: boolean }>`
  padding: 8px 12px;
  font-size: 12px;
  background: ${(props) => 
    props.isActive 
      ? props.theme.colors.primary 
      : props.theme.colors.surfaceSecondary};
  border: 1px solid ${(props) => 
    props.isActive 
      ? props.theme.colors.primary 
      : props.theme.colors.border};
  
  &:hover:not(:disabled) {
    background: ${(props) => 
      props.isActive 
        ? props.theme.colors.primaryHover 
        : props.theme.colors.surfaceSecondary};
  }
`;

const ThemePreview = styled.div<{ themeColors: any }>`
  width: 100%;
  height: 20px;
  border-radius: 4px;
  background: linear-gradient(
    90deg,
    ${(props) => props.themeColors.background} 0%,
    ${(props) => props.themeColors.surface} 50%,
    ${(props) => props.themeColors.primary} 100%
  );
  margin-bottom: 4px;
`;

export const ThemeSwitcher = () => {
  const { switchToTheme, getThemeNames, currentThemeName, availableThemes } = useThemeSwitcher();

  return (
    <ThemeSwitcherContainer>
      <ThemeSwitcherTitle>Выбор темы</ThemeSwitcherTitle>
      <ThemeGrid>
        {getThemeNames().map((themeName) => {
          const theme = availableThemes[themeName];
          const isActive = theme.name === currentThemeName;
          
          return (
            <ThemeButton
              key={themeName}
              isActive={isActive}
              onClick={() => switchToTheme(themeName)}
              size="small"
            >
              <ThemePreview themeColors={theme.colors} />
              {theme.name}
            </ThemeButton>
          );
        })}
      </ThemeGrid>
    </ThemeSwitcherContainer>
  );
};


