import styled from "@emotion/styled";

interface ButtonProps {
  variant?: "primary" | "secondary" | "danger";
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
}

export const Button = styled.button<ButtonProps>`
  padding: ${(props) =>
    props.size === "small"
      ? "8px 16px"
      : props.size === "large"
      ? "16px 32px"
      : "12px 24px"};

  font-size: ${(props) =>
    props.size === "small" ? "14px" : props.size === "large" ? "18px" : "16px"};

  font-weight: 600;
  border-radius: 8px;
  border: 1px solid ${(props) => props.theme.colors.border};
  cursor: pointer;
  transition: all 0.2s ease;
  width: ${(props) => (props.fullWidth ? "100%" : "auto")};

  background: ${(props) =>
    props.variant === "secondary"
      ? props.theme.colors.surfaceSecondary
      : props.variant === "danger"
      ? props.theme.colors.error
      : props.theme.colors.primary};

  color: ${(props) => props.theme.colors.text};

  &:hover:not(:disabled) {
    background: ${(props) =>
      props.variant === "secondary"
        ? props.theme.colors.surface
        : props.variant === "danger"
        ? props.theme.colors.error
        : props.theme.colors.primaryHover};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
