"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppSelector } from "@/shared/hooks/redux";
import { useLogin } from "@/features/auth/hooks";
import styled from "@emotion/styled";
import { PageContainer, Container } from "@/shared/ui/container";
import { Button } from "@/shared/ui/button";

const LoginCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 48px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 500px;
  margin: 100px auto;
`;

const Title = styled.h1`
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 16px;
  color: #2c3e50;
`;

const Description = styled.p`
  font-size: 16px;
  color: #6c757d;
  margin-bottom: 32px;
  line-height: 1.6;
`;

const DiscordButton = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 0 auto;

  &::before {
    content: "🎮";
    font-size: 24px;
  }
`;

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const handleLogin = useLogin();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/profile");
    }
  }, [isAuthenticated, router]);

  const returnTo = searchParams.get("return_to") || undefined;

  return (
    <PageContainer>
      <Container>
        <LoginCard>
          <Title>Вход в систему</Title>
          <Description>
            Для доступа к сервису необходимо авторизоваться через Discord
          </Description>
          <DiscordButton size="large" onClick={() => handleLogin(returnTo)}>
            Войти через Discord
          </DiscordButton>
        </LoginCard>
      </Container>
    </PageContainer>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <PageContainer>
          <Container>
            <LoginCard>
              <Title>Загрузка...</Title>
            </LoginCard>
          </Container>
        </PageContainer>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}
